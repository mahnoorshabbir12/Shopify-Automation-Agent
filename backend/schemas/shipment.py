from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class RateQuoteRequest(BaseModel):
    """Parameters required to compute a shipping rate quote."""
    origin_city: str = Field(default="Karachi", description="Origin fulfillment warehouse city")
    destination_city: str = Field(..., description="Customer destination city")
    weight_kg: float = Field(default=0.5, ge=0.05, le=50.0, description="Gross parcel weight in kg")
    cod_amount: float = Field(default=0.0, ge=0.0, description="Cash-on-delivery amount to collect")
    order_id: Optional[str] = Field(default=None, description="Shopify Order ID reference")


class RateQuoteResponse(BaseModel):
    """Calculated rate quote from a courier adapter."""
    courier_code: str = Field(..., description="Identifier: tcs, postex, or blueex")
    courier_name: str = Field(..., description="Display brand name")
    base_rate: float = Field(..., description="Base shipping tariff (PKR)")
    additional_weight_rate: float = Field(default=0.0, description="Rate for weight over base tier (PKR)")
    cod_fee: float = Field(default=0.0, description="COD collection commission/insurance fee (PKR)")
    total_cost: float = Field(..., description="Total cost = base + weight + cod_fee (PKR)")
    estimated_days: int = Field(default=2, description="Expected business days to delivery")
    is_serviceable: bool = Field(default=True, description="Whether courier covers the destination city")
    notes: Optional[str] = Field(default=None, description="Operational flags or routing notes")


class BookingRequest(BaseModel):
    """Payload dispatched to a courier partner to create a consignment."""
    order_id: str = Field(..., description="Shopify order reference ID")
    courier_code: str = Field(..., description="Target courier: tcs, postex, or blueex")
    customer_name: str = Field(..., description="Customer recipient name")
    customer_phone: str = Field(..., description="Customer contact phone")
    delivery_address: str = Field(..., description="Complete delivery street address")
    destination_city: str = Field(..., description="Destination city name")
    cod_amount: float = Field(..., ge=0.0, description="Cash collection value in PKR")
    weight_kg: float = Field(default=0.5, ge=0.05, description="Parcel weight in kg")
    pieces: int = Field(default=1, ge=1, description="Number of parcels in shipment")
    special_instructions: Optional[str] = Field(default="Handle with care - COD Parcel")


class BookingResponse(BaseModel):
    """Outcome returned after booking a parcel with a courier."""
    success: bool
    awb_number: str
    courier_code: str
    courier_name: str
    tracking_url: str
    shipping_cost: float
    label_url: Optional[str] = None
    error_message: Optional[str] = None


class TrackingCheckpoint(BaseModel):
    """Individual telemetry event along the delivery journey."""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str
    location: Optional[str] = None
    remarks: Optional[str] = None


class TrackingStatusResponse(BaseModel):
    """Aggregated tracking status for a shipment."""
    awb_number: str
    courier_code: str
    current_status: str
    checkpoints: List[TrackingCheckpoint] = []
