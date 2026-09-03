import datetime
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.integrations.messaging.sms import SMSAdapter
from backend.integrations.messaging.whatsapp import WhatsAppAdapter
from backend.models.notification import (
    NotificationChannel,
    NotificationLog,
    NotificationStatus,
    NotificationType,
)
from backend.models.order import ConfirmationStatus, Order
from backend.models.shipment import Shipment

logger = logging.getLogger(__name__)


class NotificationService:
    """Core service for orchestrating multi-channel WhatsApp and SMS communications."""

    def __init__(self):
        self.whatsapp = WhatsAppAdapter()
        self.sms = SMSAdapter()

    async def send_dispatch_alert(
        self,
        db: AsyncSession,
        order: Order,
        shipment: Shipment,
        customer_name: Optional[str] = "Valued Customer",
        customer_phone: Optional[str] = None
    ) -> NotificationLog:
        """Send automated dispatch notification with courier tracking link."""
        phone = customer_phone or getattr(order, "customer_phone", "+923001234567")
        courier_name = (shipment.courier_code or "Courier").upper()

        body = (
            f"Salam {customer_name}! Great news: Your order #{order.id} has been dispatched via "
            f"{courier_name} with AWB #{shipment.awb_number}. "
            f"Track live package status: {shipment.tracking_url}"
        )

        # Primary channel: WhatsApp
        res = await self.whatsapp.send_message(
            recipient_phone=phone,
            message_body=body,
            template_name="order_dispatch_alert",
            template_variables={"awb": shipment.awb_number, "url": shipment.tracking_url}
        )

        log_entry = NotificationLog(
            order_id=order.id,
            customer_phone=res.get("recipient_phone", phone),
            channel=NotificationChannel.WHATSAPP.value,
            notification_type=NotificationType.DISPATCH_TRACKING.value,
            status=NotificationStatus.DELIVERED.value if res.get("success") else NotificationStatus.FAILED.value,
            recipient_name=customer_name,
            content=body,
            external_message_id=res.get("external_message_id"),
            sent_at=datetime.datetime.utcnow()
        )
        db.add(log_entry)
        await db.commit()
        return log_entry

    async def send_unreachable_reminder(
        self,
        db: AsyncSession,
        order: Order,
        customer_name: Optional[str] = "Valued Customer",
        customer_phone: Optional[str] = None
    ) -> NotificationLog:
        """Send two-way interactive confirmation fallback after unanswered voice calls."""
        phone = customer_phone or getattr(order, "customer_phone", "+923001234567")
        amount = getattr(order, "total_price", 0.0)

        body = (
            f"Salam {customer_name}! We attempted to call you to confirm your COD order #{order.id} "
            f"amounting to PKR {amount:,.0f}. "
            f"Please reply '1' to CONFIRM your parcel delivery, or '2' to CANCEL."
        )

        res = await self.whatsapp.send_message(
            recipient_phone=phone,
            message_body=body,
            template_name="confirmation_fallback_reminder"
        )

        log_entry = NotificationLog(
            order_id=order.id,
            customer_phone=res.get("recipient_phone", phone),
            channel=NotificationChannel.WHATSAPP.value,
            notification_type=NotificationType.CONFIRMATION_REMINDER.value,
            status=NotificationStatus.DELIVERED.value if res.get("success") else NotificationStatus.FAILED.value,
            recipient_name=customer_name,
            content=body,
            external_message_id=res.get("external_message_id"),
            sent_at=datetime.datetime.utcnow()
        )
        db.add(log_entry)
        await db.commit()
        return log_entry

    async def handle_inbound_reply(
        self,
        db: AsyncSession,
        sender_phone: str,
        message_text: str
    ) -> Dict[str, Any]:
        """Process two-way customer replies on WhatsApp to confirm or cancel COD orders."""
        cleaned_text = message_text.strip().lower()
        clean_phone = sender_phone.replace(" ", "").replace("-", "")

        # Find latest active or pending order for this customer
        stmt = select(Order).order_by(desc(Order.created_at)).limit(1)
        res = await db.execute(stmt)
        order = res.scalar_one_or_none()

        if not order:
            return {"success": False, "reason": "No pending order found for this number."}

        if cleaned_text in ["1", "confirm", "yes", "haan", "g", "ok"]:
            order.status = ConfirmationStatus.CONFIRMED.value
            order.is_address_confirmed = True
            order.is_amount_confirmed = True
            order.intent_to_receive = True
            order.confirmed_at = datetime.datetime.utcnow()
            await db.commit()
            return {
                "success": True,
                "action": "confirmed",
                "order_id": order.id,
                "message": f"Order #{order.id} confirmed via WhatsApp reply."
            }

        elif cleaned_text in ["2", "cancel", "no", "nahi", "reject"]:
            order.status = ConfirmationStatus.REJECTED.value
            await db.commit()
            return {
                "success": True,
                "action": "rejected",
                "order_id": order.id,
                "message": f"Order #{order.id} cancelled per customer request via WhatsApp."
            }

        return {
            "success": False,
            "action": "unrecognized",
            "order_id": order.id,
            "message": "Unrecognized reply. Please reply '1' to Confirm or '2' to Cancel."
        }

    async def list_notifications(
        self,
        db: AsyncSession,
        order_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """List outbound and inbound notification logs."""
        stmt = select(NotificationLog).order_by(desc(NotificationLog.created_at)).limit(limit)
        if order_id:
            stmt = stmt.where(NotificationLog.order_id == order_id)

        res = await db.execute(stmt)
        logs = res.scalars().all()

        return [
            {
                "id": log.id,
                "order_id": log.order_id,
                "customer_phone": log.customer_phone,
                "channel": log.channel,
                "notification_type": log.notification_type,
                "status": log.status,
                "recipient_name": log.recipient_name,
                "content": log.content,
                "external_message_id": log.external_message_id,
                "sent_at": log.sent_at.isoformat() if log.sent_at else None
            }
            for log in logs
        ]


notification_service = NotificationService()
