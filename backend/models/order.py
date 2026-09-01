from sqlalchemy import Column, String, BigInteger, JSON, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from backend.database.base import Base
import datetime

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
    
    status = Column(String, default="pending_confirmation")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Confirmation workflow data
    is_address_confirmed = Column(Boolean, default=False)
    is_amount_confirmed = Column(Boolean, default=False)
    intent_to_receive = Column(Boolean, default=False)
    
    customer = relationship("Customer", back_populates="orders")
