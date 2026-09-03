from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_db
from backend.services.orchestrator_service import orchestrator_service

router = APIRouter(prefix="/orchestrator", tags=["Lifecycle Orchestrator"])


@router.post("/run/{order_id}", response_model=Dict[str, Any])
async def trigger_autonomous_lifecycle(
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Execute the full autonomous cascade for an order:
    Shopify Ingestion -> Confirmation Call -> Shipping LangGraph Dispatch -> WhatsApp Tracking Alert.
    """
    return await orchestrator_service.run_autonomous_lifecycle(db=db, order_id=order_id)
