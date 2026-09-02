from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.database.base import Base
import datetime


class ConfirmationStatus(str, Enum):
    """Business states for the Phase 1 COD confirmation workflow."""

    PENDING_CONFIRMATION = "pending_confirmation"
    CALLING = "calling"
    CALLBACK_SCHEDULED = "callback_scheduled"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    ESCALATED = "escalated"
    UNREACHABLE = "unreachable"


class WorkflowTaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(String, primary_key=True, index=True) # Usually a string from Shopify
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    
    orders = relationship("Order", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, index=True) # Shopify Order ID
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    total_price = Column(Float, nullable=False)
    currency = Column(String, default="PKR")
    shipping_address = Column(JSON, nullable=False)
    
    status = Column(String, nullable=False, default=ConfirmationStatus.PENDING_CONFIRMATION.value)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    
    # Confirmation workflow data
    is_address_confirmed = Column(Boolean, default=False)
    is_amount_confirmed = Column(Boolean, default=False)
    intent_to_receive = Column(Boolean, default=False)

    # Operational workflow metadata. Evidence for confirmation remains on the
    # three fields above; these fields only track the call lifecycle.
    confirmation_attempt_count = Column(Integer, nullable=False, default=0)
    confirmation_started_at = Column(DateTime, nullable=True)
    confirmed_at = Column(DateTime, nullable=True)
    
    customer = relationship("Customer", back_populates="orders")
    workflow_tasks = relationship("WorkflowTask", back_populates="order", cascade="all, delete-orphan")


class WorkflowTask(Base):
    """Durable, idempotent work scheduled by operational workflows."""

    __tablename__ = "workflow_tasks"
    __table_args__ = (
        UniqueConstraint("idempotency_key", name="uq_workflow_tasks_idempotency_key"),
        Index("ix_workflow_tasks_due", "status", "run_at"),
        Index("ix_workflow_tasks_order_id", "order_id"),
    )

    id = Column(Integer, primary_key=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    task_type = Column(String, nullable=False)
    status = Column(String, nullable=False, default=WorkflowTaskStatus.PENDING.value)
    run_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    attempt_number = Column(Integer, nullable=False, default=1)
    payload = Column(JSON, nullable=False, default=dict)
    idempotency_key = Column(String, nullable=False)

    claimed_at = Column(DateTime, nullable=True)
    claimed_by = Column(String, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="workflow_tasks")
