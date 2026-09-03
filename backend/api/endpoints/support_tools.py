import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_db, verify_tool_api_key
from backend.models.support import SupportTicket, TicketStatus
from backend.schemas.support import (
    ComplaintCreateRequest,
    ComplaintResponse,
    InventoryQueryRequest,
    InventoryQueryResponse,
    RefundCreateRequest,
    RefundEligibilityResponse,
    TrackingQueryRequest,
    TrackingQueryResponse,
)
from backend.services.support_service import support_service

logger = logging.getLogger(__name__)

# Router for Retell AI Voice Tool Calling (under /tools)
tools_router = APIRouter(prefix="/tools", tags=["Retell Support Tools"])

# Router for Dashboard Management (under /api/v1/support)
dashboard_support_router = APIRouter(prefix="/support", tags=["Support Management"])


# ==========================================================
# RETELL AI VOICE TOOLS (SECURED VIA TOOL_API_KEY)
# ==========================================================

@tools_router.post(
    "/get-tracking-info",
    response_model=TrackingQueryResponse,
    dependencies=[Depends(verify_tool_api_key)]
)
async def tool_get_tracking_info(
    payload: TrackingQueryRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Voice tool called by Retell when customer asks 'Where is my order?' (WISMO)
    or inquires about delivery timelines.
    """
    logger.info(f"Tool call 'get-tracking-info': order_id={payload.order_id}, awb={payload.awb_number}")
    return await support_service.get_tracking_info(
        db=db,
        order_id=payload.order_id,
        awb_number=payload.awb_number
    )


@tools_router.post(
    "/create-complaint",
    response_model=ComplaintResponse,
    dependencies=[Depends(verify_tool_api_key)]
)
async def tool_create_complaint(
    payload: ComplaintCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Voice tool called by Retell when customer reports a damaged item, wrong product,
    or courier rider misbehavior.
    """
    logger.info(f"Tool call 'create-complaint': order_id={payload.order_id}, issue={payload.issue_type}")
    return await support_service.create_complaint(db=db, request=payload)


@tools_router.post(
    "/request-refund",
    response_model=RefundEligibilityResponse,
    dependencies=[Depends(verify_tool_api_key)]
)
async def tool_request_refund(
    payload: RefundCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Voice tool called by Retell to evaluate return/refund eligibility
    against the store's 7-day policy.
    """
    logger.info(f"Tool call 'request-refund': order_id={payload.order_id}")
    return await support_service.request_refund(db=db, request=payload)


@tools_router.post(
    "/get-inventory",
    response_model=InventoryQueryResponse,
    dependencies=[Depends(verify_tool_api_key)]
)
async def tool_get_inventory(
    payload: InventoryQueryRequest
):
    """
    Voice tool called by Retell when customer asks about product availability or stock.
    """
    logger.info(f"Tool call 'get-inventory': query={payload.product_title_or_sku}")
    return await support_service.get_inventory(payload.product_title_or_sku)


# ==========================================================
# DASHBOARD API ROUTES (FOR FRONTEND HELP DESK)
# ==========================================================

@dashboard_support_router.get("/tickets", response_model=List[Dict[str, Any]])
async def list_support_tickets(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve list of active and past customer support tickets for the console."""
    return await support_service.list_tickets(db=db, limit=limit)


class TicketActionRequest(BaseModel):
    action: str  # resolve, escalate
    notes: Optional[str] = None


@dashboard_support_router.post("/tickets/{ticket_id}/action")
async def update_ticket_action(
    ticket_id: int,
    payload: TicketActionRequest,
    db: AsyncSession = Depends(get_db)
):
    """Update support ticket status from the dashboard."""
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found.")

    if payload.action == "resolve":
        ticket.status = TicketStatus.RESOLVED.value
        ticket.resolution_notes = payload.notes or "Resolved by operator."
    elif payload.action == "escalate":
        ticket.status = TicketStatus.ESCALATED.value
        ticket.resolution_notes = payload.notes or "Escalated for management intervention."

    await db.commit()
    return {"success": True, "ticket_id": ticket.id, "status": ticket.status}


class SupportChatRequest(BaseModel):
    query: str
    order_id: Optional[str] = None
    customer_id: Optional[str] = None


@dashboard_support_router.post("/chat")
async def simulate_support_chat(
    payload: SupportChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Simulate or test incoming customer support inquiries directly through the LangGraph engine.
    """
    from backend.agents.support.graph import process_support_inquiry

    result = await process_support_inquiry(
        query=payload.query,
        order_id=payload.order_id,
        customer_id=payload.customer_id,
        db=db
    )
    return result
