from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TrackingQueryRequest(BaseModel):
    order_id: Optional[str] = Field(None, description="Shopify order number, e.g. #10482 or order-10482")
    awb_number: Optional[str] = Field(None, description="Air waybill tracking number, e.g. BX-90412")


class TrackingQueryResponse(BaseModel):
    found: bool
    order_id: Optional[str] = None
    awb_number: Optional[str] = None
    courier_name: Optional[str] = None
    status: str
    destination_city: Optional[str] = None
    tracking_url: Optional[str] = None
    latest_checkpoint: Optional[str] = None
    estimated_delivery: Optional[str] = None
    human_summary: str


class ComplaintCreateRequest(BaseModel):
    order_id: str = Field(..., description="Target Shopify order ID")
    customer_phone: Optional[str] = None
    issue_type: str = Field(..., description="DAMAGED_ITEM, WRONG_ITEM, RIDER_MISBEHAVIOR, DELAYED_DELIVERY")
    description: str = Field(..., description="Details regarding the complaint")
    severity: Optional[str] = Field("medium", description="low, medium, high, urgent")


class ComplaintResponse(BaseModel):
    success: bool
    complaint_id: int
    ticket_number: str
    status: str
    message: str


class RefundCreateRequest(BaseModel):
    order_id: str = Field(..., description="Target Shopify order ID")
    reason: str = Field(..., description="Reason for refund or return request")
    refund_amount: Optional[float] = Field(None, description="Requested refund amount in PKR")


class RefundEligibilityResponse(BaseModel):
    is_eligible: bool
    order_id: str
    refund_amount: float
    eligibility_status: str  # ELIGIBLE, INELIGIBLE_EXPIRED_WINDOW, INELIGIBLE_NOT_DELIVERED
    rejection_reason: Optional[str] = None
    ticket_number: Optional[str] = None
    message: str


class InventoryQueryRequest(BaseModel):
    product_title_or_sku: str = Field(..., description="Product title, variant, or SKU to query")


class InventoryQueryResponse(BaseModel):
    available: bool
    product_title: str
    inventory_quantity: int
    price: float
    currency: str = "PKR"
    message: str


class SupportTicketResponse(BaseModel):
    id: int
    ticket_number: str
    order_id: Optional[str] = None
    customer_id: Optional[str] = None
    category: str
    priority: str
    status: str
    summary: str
    resolution_notes: Optional[str] = None
    created_at: str
