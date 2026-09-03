import enum
import datetime
from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from backend.database.base import Base


class TicketCategory(str, enum.Enum):
    WISMO = "wismo"
    COMPLAINT = "complaint"
    REFUND = "refund"
    PRODUCT_INQUIRY = "product_inquiry"
    GENERAL = "general"


class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class SupportTicket(Base):
    """Central ledger for all customer support interactions and inquiries."""
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(50), unique=True, index=True, nullable=False)
    order_id = Column(String(100), ForeignKey("orders.id"), nullable=True)
    customer_id = Column(String(100), ForeignKey("customers.id"), nullable=True)
    channel = Column(String(50), default="voice")  # voice, chat, whatsapp
    category = Column(String(50), default=TicketCategory.GENERAL.value)
    priority = Column(String(50), default=TicketPriority.MEDIUM.value)
    status = Column(String(50), default=TicketStatus.OPEN.value)
    summary = Column(String(255), nullable=False)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    complaints = relationship("Complaint", back_populates="ticket", cascade="all, delete-orphan")
    refund_requests = relationship("RefundRequest", back_populates="ticket", cascade="all, delete-orphan")


class Complaint(Base):
    """Specific customer grievances (damaged items, wrong items, courier rider misbehavior)."""
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), nullable=False)
    issue_type = Column(String(50), nullable=False)  # DAMAGED_ITEM, WRONG_ITEM, RIDER_MISBEHAVIOR, DELAYED_DELIVERY
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship
    ticket = relationship("SupportTicket", back_populates="complaints")


class RefundRequest(Base):
    """Refund or return requests evaluated against the 7-day policy window."""
    __tablename__ = "refund_requests"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), nullable=False)
    order_id = Column(String(100), ForeignKey("orders.id"), nullable=False)
    refund_amount = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    eligibility_status = Column(String(50), default="ELIGIBLE")  # ELIGIBLE, INELIGIBLE_EXPIRED_WINDOW, INELIGIBLE_NOT_DELIVERED
    rejection_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship
    ticket = relationship("SupportTicket", back_populates="refund_requests")
