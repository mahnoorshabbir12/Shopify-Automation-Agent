import logging
import os
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
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

WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "shopify_ops_verify_token")


class InboundWhatsAppPayload(BaseModel):
    sender_phone: str
    message_text: str
    button_id: Optional[str] = None
    order_id: Optional[str] = None
    timestamp: Optional[str] = None


@webhooks_router.get("/whatsapp")
async def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge")
):
    """
    Meta WhatsApp Cloud API Webhook Verification Handshake.
    When configuring webhook URL in Meta App Dashboard, Meta sends a GET request
    with hub.mode, hub.verify_token, and hub.challenge.
    """
    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        logger.info("[Meta Webhook] Verification successful.")
        return Response(content=hub_challenge, media_type="text/plain")
    logger.warning("[Meta Webhook] Verification failed: token mismatch.")
    raise HTTPException(status_code=403, detail="Verification token mismatch")


@webhooks_router.post("/whatsapp")
async def webhook_inbound_whatsapp(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Inbound webhook for Meta WhatsApp Business API.
    Handles both direct JSON payloads and Meta Cloud API nested event schemas.
    """
    payload_json = await request.json()
    logger.info(f"[Inbound WhatsApp Webhook] Payload received: {payload_json}")

    # Parse message data using WhatsAppAdapter
    parsed = notification_service.whatsapp.parse_inbound_webhook(payload_json)
    sender_phone = parsed.get("sender_phone") or payload_json.get("sender_phone", "")
    message_text = parsed.get("message_text") or payload_json.get("message_text", "")
    button_id = parsed.get("button_id") or payload_json.get("button_id")
    order_id = parsed.get("order_id") or payload_json.get("order_id")

    if not sender_phone:
        logger.warning("[Inbound WhatsApp Webhook] Missing sender_phone in payload.")
        return {"success": False, "reason": "Missing sender_phone"}

    result = await notification_service.handle_inbound_reply(
        db=db,
        sender_phone=sender_phone,
        message_text=message_text,
        button_id=button_id,
        order_id=order_id
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


@router.post("/send-interactive-confirmation/{order_id}")
async def trigger_interactive_confirmation(
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Trigger an interactive WhatsApp 3-button confirmation message."""
    clean_id = order_id.replace("#", "")
    order_res = await db.execute(
        select(Order).where(
            (Order.id == order_id) | (Order.id == f"#{clean_id}") | (Order.id == clean_id)
        )
    )
    order = order_res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    log = await notification_service.send_interactive_confirmation_request(db=db, order=order)

    return {
        "success": True,
        "notification_id": log.id,
        "status": log.status,
        "channel": log.channel,
        "content": log.content
    }


@router.post("/simulate-reply")
async def simulate_customer_reply(
    payload: InboundWhatsAppPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Simulation endpoint for operators and automated tests.
    Simulates incoming customer WhatsApp responses (confirm, reschedule, cancel).
    """
    return await notification_service.handle_inbound_reply(
        db=db,
        sender_phone=payload.sender_phone,
        message_text=payload.message_text,
        button_id=payload.button_id,
        order_id=payload.order_id
    )

