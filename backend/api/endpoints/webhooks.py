from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.session import get_db
from backend.core.security import verify_shopify_hmac
from backend.schemas.shopify import ShopifyOrder
from backend.services.order_service import ingest_shopify_order
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
