import datetime
from enum import Enum
from sqlalchemy import Column, DateTime, Integer, String, Text
from backend.database.base import Base


class NotificationChannel(str, Enum):
    WHATSAPP = "whatsapp"
    SMS = "sms"


class NotificationType(str, Enum):
    DISPATCH_TRACKING = "dispatch_tracking"
    CONFIRMATION_REMINDER = "confirmation_reminder"
    SUPPORT_UPDATE = "support_update"


class NotificationStatus(str, Enum):
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(String, index=True, nullable=False)
    customer_phone = Column(String, nullable=False)
    channel = Column(String, nullable=False, default=NotificationChannel.WHATSAPP.value)
    notification_type = Column(String, nullable=False, default=NotificationType.DISPATCH_TRACKING.value)
    status = Column(String, nullable=False, default=NotificationStatus.SENT.value)

    recipient_name = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    external_message_id = Column(String, nullable=True, index=True)

    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    sent_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
