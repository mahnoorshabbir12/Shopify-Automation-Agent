from enum import Enum
import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.database.base import Base


class ShipmentStatus(str, Enum):
    """Lifecycle statuses of a booked shipment."""
    BOOKED = "booked"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    RETURNED = "returned"
    CANCELLED = "cancelled"
    FAILED = "failed"


class Courier(Base):
    """Courier company registration and configuration."""
    __tablename__ = "couriers"

    id = Column(Integer, primary_key=True)
    code = Column(String(32), unique=True, nullable=False, index=True)  # e.g., 'tcs', 'postex', 'blueex'
    name = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    api_base_url = Column(String(255), nullable=True)
    settings = Column(JSON, nullable=False, default=dict)  # Merchant credentials, account #, city codes
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    rate_rules = relationship("CourierRateRule", back_populates="courier", cascade="all, delete-orphan")


class CourierRateRule(Base):
    """Pre-negotiated rate rules and zone tiers for courier rate calculations."""
    __tablename__ = "courier_rate_rules"

    id = Column(Integer, primary_key=True)
    courier_id = Column(Integer, ForeignKey("couriers.id"), nullable=False, index=True)
    destination_zone = Column(String(64), nullable=False)  # e.g., 'WITHIN_CITY', 'SAME_ZONE', 'DIFFERENT_ZONE'
    weight_min_kg = Column(Float, default=0.0, nullable=False)
    weight_max_kg = Column(Float, default=1.0, nullable=False)
    base_rate = Column(Float, nullable=False)  # PKR
    additional_kg_rate = Column(Float, default=0.0, nullable=False)  # PKR per additional kg
    cod_percentage = Column(Float, default=0.015, nullable=False)  # e.g., 1.5%
    estimated_delivery_days = Column(Integer, default=2, nullable=False)

    courier = relationship("Courier", back_populates="rate_rules")


class Shipment(Base):
    """Durable record of a parcel booked with a courier partner."""
    __tablename__ = "shipments"
    __table_args__ = (
        UniqueConstraint("awb_number", name="uq_shipments_awb_number"),
        Index("ix_shipments_order_id", "order_id"),
        Index("ix_shipments_status", "status"),
    )

    id = Column(Integer, primary_key=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    courier_code = Column(String(32), nullable=False)
    awb_number = Column(String(128), nullable=False)
    tracking_url = Column(String(512), nullable=True)
    status = Column(String(32), nullable=False, default=ShipmentStatus.BOOKED.value)
    
    shipping_cost = Column(Float, nullable=False)  # Calculated courier delivery fee
    cod_amount = Column(Float, nullable=False)     # Cash to be collected from customer
    destination_city = Column(String(128), nullable=False)
    
    booked_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    dispatched_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    
    label_url = Column(String(512), nullable=True)
    shopify_fulfillment_id = Column(String(128), nullable=True)
    courier_payload = Column(JSON, nullable=True)

    order = relationship("Order", backref="shipments")
    tracking_events = relationship("TrackingEvent", back_populates="shipment", cascade="all, delete-orphan")


class TrackingEvent(Base):
    """Historical telemetry checkpoint for a parcel."""
    __tablename__ = "tracking_events"
    __table_args__ = (
        Index("ix_tracking_events_shipment_id", "shipment_id"),
    )

    id = Column(Integer, primary_key=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    event_time = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    status = Column(String(64), nullable=False)
    location = Column(String(128), nullable=True)
    remarks = Column(String(255), nullable=True)

    shipment = relationship("Shipment", back_populates="tracking_events")
