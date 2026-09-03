from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_db, verify_tool_api_key
from backend.schemas.tools import (
    ConfirmOrderRequest,
    ConfirmOrderResponse,
    GetOrderRequest,
    GetOrderResponse,
    ScheduleCallbackRequest,
    ScheduleCallbackResponse,
    SearchKnowledgeRequest,
    SearchKnowledgeResponse,
    TransferToHumanRequest,
    TransferToHumanResponse,
)
from backend.services.knowledge_service import KnowledgeService
from backend.services.tool_service import ToolService

router = APIRouter(dependencies=[Depends(verify_tool_api_key)])

@router.post("/get-order", response_model=GetOrderResponse, summary="Retrieve order and customer details")
async def get_order_endpoint(
    payload: GetOrderRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Called by the Retell voice agent to inspect order details, price,
    shipping address, and current confirmation status.
    """
    return await ToolService.get_order_details(db, payload.order_id)

@router.post("/confirm-order", response_model=ConfirmOrderResponse, summary="Confirm or record rejection for COD order")
async def confirm_order_endpoint(
    payload: ConfirmOrderRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Called by the Retell voice agent when customer agrees or disagrees to COD terms.
    Enforces agreement on Address + Amount + Intent to receive.
    """
    return await ToolService.confirm_or_reject_order(db, payload)

@router.post("/schedule-callback", response_model=ScheduleCallbackResponse, summary="Schedule a follow-up callback")
async def schedule_callback_endpoint(
    payload: ScheduleCallbackRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Called when the customer is busy or requests to be called back at another time.
    """
    return await ToolService.schedule_order_callback(db, payload)

@router.post("/transfer-to-human", response_model=TransferToHumanResponse, summary="Escalate order to human queue")
async def transfer_to_human_endpoint(
    payload: TransferToHumanRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Called when the customer requests a human agent or an unresolvable dispute arises.
    """
    return await ToolService.escalate_order_to_human(db, payload)

@router.post("/search-knowledge", response_model=SearchKnowledgeResponse, summary="Query store policies and FAQ")
async def search_knowledge_endpoint(
    payload: SearchKnowledgeRequest
):
    """
    Called by the voice agent to answer customer inquiries about returns,
    delivery timelines, COD payment guidelines, or support hours.
    """
    snippets = await KnowledgeService.search_knowledge(payload.query, limit=payload.limit or 3)
    return SearchKnowledgeResponse(query=payload.query, results=snippets)
