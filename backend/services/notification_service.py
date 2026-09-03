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

    async def send_interactive_confirmation_request(
        self,
        db: AsyncSession,
        order: Order,
        customer_name: Optional[str] = "Valued Customer",
        customer_phone: Optional[str] = None
    ) -> NotificationLog:
        """Send interactive WhatsApp message with 3 action buttons for COD verification."""
        phone = customer_phone or getattr(order, "customer_phone", "+923001234567")
        header = f"🛍️ Order #{order.id} Confirmation Required"
        total_amount = getattr(order, "total_price", "4,200")
        address = getattr(order, "shipping_address", "Delivery Address on File")

        body = (
            f"Salam {customer_name}! Please confirm your Cash on Delivery (COD) order #{order.id}.\n\n"
            f"• COD Amount: PKR {total_amount}\n"
            f"• Destination: {address}\n\n"
            f"Please tap an action below or reply: 1 (Confirm), 2 (Reschedule), 3 (Cancel)."
        )

        buttons = [
            {"id": "CONFIRM_ORDER", "title": "✓ Confirm (1)"},
            {"id": "RESCHEDULE_ORDER", "title": "📅 Reschedule (2)"},
            {"id": "CANCEL_ORDER", "title": "✕ Cancel (3)"},
        ]

        res = await self.whatsapp.send_interactive_buttons(
            recipient_phone=phone,
            header_text=header,
            body_text=body,
            buttons=buttons
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
        message_text: str,
        button_id: Optional[str] = None,
        order_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process two-way customer replies on WhatsApp to confirm, reschedule, or cancel COD orders.
        Supports button clicks (button_id) and free-form natural language text replies.
        """
        cleaned_text = message_text.strip().lower()
        active_button = (button_id or "").upper()

        # Find target order by order_id or latest order matching sender phone
        order = None
        if order_id:
            stmt = select(Order).where(Order.id == str(order_id)).limit(1)
            res = await db.execute(stmt)
            order = res.scalar_one_or_none()

        if not order:
            stmt = select(Order).order_by(desc(Order.created_at)).limit(1)
            res = await db.execute(stmt)
            order = res.scalar_one_or_none()

        if not order:
            return {"success": False, "reason": "No pending order found for this number."}

        # Branch 1: Confirm Order
        confirm_triggers = ["1", "confirm", "yes", "haan", "g", "ok", "tasdeeq", "sahih", "confirm order"]
        if active_button == "CONFIRM_ORDER" or any(t in cleaned_text for t in confirm_triggers):
            order.status = ConfirmationStatus.CONFIRMED.value
            order.is_address_confirmed = True
            order.is_amount_confirmed = True
            order.intent_to_receive = True
            order.confirmed_at = datetime.datetime.utcnow()
            await db.commit()

            reply_msg = f"Shukriya! Order #{order.id} confirm ho chuka hai. Hum jald courier dispatch karenge."
            await self.whatsapp.send_message(
                recipient_phone=sender_phone,
                message_body=reply_msg
            )

            return {
                "success": True,
                "action": "confirmed",
                "order_id": order.id,
                "message": f"Order #{order.id} confirmed via WhatsApp reply.",
                "bot_reply": reply_msg
            }

        # Branch 2: Reschedule Order
        reschedule_triggers = ["2", "reschedule", "delay", "kal", "later", "baad mein", "change date", "reschedule order"]
        if active_button == "RESCHEDULE_ORDER" or any(t in cleaned_text for t in reschedule_triggers):
            current_tags = getattr(order, "tags", "") or ""
            order.tags = (current_tags + ",whatsapp_rescheduled").strip(",")
            await db.commit()

            reply_msg = f"Aapki delivery reschedule request record ho chuki hai. Humari dispatch team delivery se pehle rabta karegi."
            await self.whatsapp.send_message(
                recipient_phone=sender_phone,
                message_body=reply_msg
            )

            return {
                "success": True,
                "action": "rescheduled",
                "order_id": order.id,
                "message": f"Order #{order.id} marked as rescheduled per customer WhatsApp reply.",
                "bot_reply": reply_msg
            }

        # Branch 3: Cancel Order
        cancel_triggers = ["3", "cancel", "no", "nahi", "reject", "mansookh", "cancel order"]
        if active_button == "CANCEL_ORDER" or any(t in cleaned_text for t in cancel_triggers):
            order.status = ConfirmationStatus.REJECTED.value
            await db.commit()

            reply_msg = f"Order #{order.id} mansookh (cancelled) kar diya gaya hai. Shukriya."
            await self.whatsapp.send_message(
                recipient_phone=sender_phone,
                message_body=reply_msg
            )

            return {
                "success": True,
                "action": "rejected",
                "order_id": order.id,
                "message": f"Order #{order.id} cancelled per customer request via WhatsApp.",
                "bot_reply": reply_msg
            }

        # Fallback: Unrecognized input
        fallback_msg = "Assalam-o-Alaikum! Please reply:\n1 to Confirm\n2 to Reschedule\n3 to Cancel"
        await self.whatsapp.send_message(
            recipient_phone=sender_phone,
            message_body=fallback_msg
        )

        return {
            "success": False,
            "action": "unrecognized",
            "order_id": order.id,
            "message": "Unrecognized reply. Sent prompt: 1 to Confirm, 2 to Reschedule, 3 to Cancel.",
            "bot_reply": fallback_msg
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
