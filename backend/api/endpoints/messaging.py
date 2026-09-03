import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_db
from backend.models.order import Order
from backend.models.shipment import Shipment
from backend.services.notification_service import notification_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications & Messaging"])
webhooks_router = APIRouter(prefix="/webhooks", tags=["Messaging Webhooks"])


class InboundWhatsAppPayload(BaseModel):
    sender_phone: str
    message_text: str
    timestamp: Optional[str] = None


@webhooks_router.post("/whatsapp")
async def webhook_inbound_whatsapp(
    payload: InboundWhatsAppPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Inbound webhook for Meta WhatsApp Business API.
    Captures customer replies to confirmation reminders (e.g. '1' to confirm).
    """
    logger.info(f"Inbound WhatsApp from {payload.sender_phone}: '{payload.message_text}'")
    result = await notification_service.handle_inbound_reply(
        db=db,
        sender_phone=payload.sender_phone,
        message_text=payload.message_text
    )
    return result


@router.get("", response_model=List[Dict[str, Any]])
async def list_notifications(
    order_id: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve operational notification history."""
    return await notification_service.list_notifications(db=db, order_id=order_id, limit=limit)


@router.post("/send-dispatch/{order_id}")
async def trigger_dispatch_notification(
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Manually or programmatically trigger a dispatch notification with live tracking link."""
    clean_id = order_id.replace("#", "")
    order_res = await db.execute(
        select(Order).where(
            (Order.id == order_id) | (Order.id == f"#{clean_id}") | (Order.id == clean_id)
        )
    )
    order = order_res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    ship_res = await db.execute(select(Shipment).where(Shipment.order_id == order.id))
    shipment = ship_res.scalar_one_or_none()
    if not shipment:
        # Create a mock shipment representation if dispatch alert is triggered before booking
        shipment = Shipment(
            order_id=order.id,
            courier_code="blueex",
            awb_number="BX-90412",
            tracking_url="https://www.blue-ex.com/tracking?cn=BX-90412"
        )

    log = await notification_service.send_dispatch_alert(
        db=db,
        order=order,
        shipment=shipment
    )

    return {
        "success": True,
        "notification_id": log.id,
        "status": log.status,
        "channel": log.channel,
        "content": log.content
    }


@router.post("/send-reminder/{order_id}")
async def trigger_unreachable_reminder(
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Trigger WhatsApp confirmation reminder when telephone call was unanswered."""
    clean_id = order_id.replace("#", "")
    order_res = await db.execute(
        select(Order).where(
            (Order.id == order_id) | (Order.id == f"#{clean_id}") | (Order.id == clean_id)
        )
    )
    order = order_res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    log = await notification_service.send_unreachable_reminder(db=db, order=order)

    return {
        "success": True,
        "notification_id": log.id,
        "status": log.status,
        "channel": log.channel,
        "content": log.content
    }
