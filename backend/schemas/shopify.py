from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class ShopifyCustomer(BaseModel):
    id: int
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None

class ShopifyOrder(BaseModel):
    id: int
    name: str  # Usually the order number like #1001
    total_price: str
    currency: str
    customer: Optional[ShopifyCustomer] = None
    shipping_address: Optional[Dict[str, Any]] = None
    
    # We will expand this model in Phase 2/3 (Shipping/Returns)
    # to include line_items, variants, fulfillment status, etc.
