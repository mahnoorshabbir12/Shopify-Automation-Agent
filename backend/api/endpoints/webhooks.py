from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.session import get_db
from backend.core.security import verify_shopify_hmac
from backend.api.deps import verify_retell_webhook
from backend.schemas.shopify import ShopifyOrder
from backend.schemas.retell import CallOutcomeResponse, RetellCallEndedWebhook
from backend.services.order_service import ingest_shopify_order
from backend.services.workflow.confirmation_service import process_call_outcome
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/shopify/orders/create", dependencies=[Depends(verify_shopify_hmac)])
async def create_order_webhook(
    request: Request,
    order: ShopifyOrder, 
    db: AsyncSession = Depends(get_db)
):
    """
    Webhook receiver for Shopify orders/create.
    Protected by HMAC verification dependency.
    """
    logger.info(f"Received verified Shopify webhook for order: {order.name} ({order.id})")
    
    # Pass to the service layer for idempotent ingestion
    result = await ingest_shopify_order(db=db, shopify_order=order)
    
    return result

@router.post("/retell/call-ended", response_model=CallOutcomeResponse, dependencies=[Depends(verify_retell_webhook)])
async def retell_call_ended_webhook(
    payload: RetellCallEndedWebhook,
    db: AsyncSession = Depends(get_db)
):
    """
    Webhook receiver for Retell call_ended / call_analyzed events.
    Feeds disconnection reasons (no_answer, busy, etc.) into the LangGraph retry scheduler.
    """
    logger.info(f"Received Retell call-ended webhook for call {payload.call.call_id}, reason: {payload.call.disconnection_reason}")

    # Extract order_id from dynamic variables or metadata
    order_id = (
        payload.call.retell_llm_dynamic_variables.get("order_id")
        or payload.call.metadata.get("order_id")
    )

    if not order_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Missing 'order_id' in call dynamic variables or metadata."
        )

    return await process_call_outcome(
        db,
        order_id=str(order_id),
        disconnection_reason=payload.call.disconnection_reason,
        duration_ms=payload.call.duration_ms or 0
    )
