import math
import random
import time
from datetime import datetime, timedelta
from typing import Optional

from backend.schemas.shipment import (
    BookingRequest,
    BookingResponse,
    RateQuoteRequest,
    RateQuoteResponse,
    TrackingCheckpoint,
    TrackingStatusResponse,
)


class PostExAdapter:
    """PostEx courier adapter tailored for rapid e-commerce COD disbursement."""

    code: str = "postex"
    name: str = "PostEx Logistics"

    # PostEx operates primarily in core urban and semi-urban commercial hubs
    SERVICEABLE_CITIES = {
        "KARACHI", "LAHORE", "ISLAMABAD", "RAWALPINDI", "FAISALABAD",
        "MULTAN", "SIALKOT", "GUJRANWALA", "PESHAWAR", "HYDERABAD",
        "ABBOTTABAD", "SARGODHA", "BAHAWALPUR", "SUKKUR", "QUETTA",
        "SHEIKHUPURA", "SAHIWAL", "GUJRAT", "MARDAN", "KASUR"
    }

    def __init__(self, api_token: Optional[str] = None, merchant_id: Optional[str] = None, sandbox_mode: bool = True):
        self.api_token = api_token or "postex_sandbox_token"
        self.merchant_id = merchant_id or "PX-M-10294"
        self.sandbox_mode = sandbox_mode

    async def check_coverage(self, city: str) -> bool:
        """Check whether the destination city is in PostEx's active delivery network."""
        norm_city = city.strip().upper()
        return norm_city in self.SERVICEABLE_CITIES

    async def calculate_rate(self, request: RateQuoteRequest) -> RateQuoteResponse:
        """Compute PostEx rate quote."""
        is_covered = await self.check_coverage(request.destination_city)
        if not is_covered:
            return RateQuoteResponse(
                courier_code=self.code,
                courier_name=self.name,
                base_rate=0.0,
                additional_weight_rate=0.0,
                cod_fee=0.0,
                total_cost=0.0,
                estimated_days=0,
                is_serviceable=False,
                notes=f"City '{request.destination_city}' is not in PostEx express network."
            )

        is_within_city = request.origin_city.strip().upper() == request.destination_city.strip().upper()
        base_rate = 180.0 if is_within_city else 240.0

        extra_kg = max(0.0, request.weight_kg - 0.5)
        chargeable_extra_units = math.ceil(extra_kg)
        weight_fee = float(chargeable_extra_units * 120.0)

        # Lower COD fee: 1.2% (min PKR 30)
        cod_fee = round(max(30.0, request.cod_amount * 0.012), 2) if request.cod_amount > 0 else 0.0
        total_cost = round(base_rate + weight_fee + cod_fee, 2)
        est_days = 1 if is_within_city else 2

        return RateQuoteResponse(
            courier_code=self.code,
            courier_name=self.name,
            base_rate=base_rate,
            additional_weight_rate=weight_fee,
            cod_fee=cod_fee,
            total_cost=total_cost,
            estimated_days=est_days,
            is_serviceable=True,
            notes="PostEx Next-Day e-Commerce COD with automated 24h bank remittance."
        )

    async def book_shipment(self, request: BookingRequest) -> BookingResponse:
        """Book consignment with PostEx."""
        is_covered = await self.check_coverage(request.destination_city)
        if not is_covered:
            return BookingResponse(
                success=False,
                awb_number="",
                courier_code=self.code,
                courier_name=self.name,
                tracking_url="",
                shipping_cost=0.0,
                error_message=f"PostEx does not service '{request.destination_city}'."
            )

        quote = await self.calculate_rate(RateQuoteRequest(
            origin_city="Karachi",
            destination_city=request.destination_city,
            weight_kg=request.weight_kg,
            cod_amount=request.cod_amount,
            order_id=request.order_id
        ))

        # Generate PostEx format tracking code
        timestamp = str(int(time.time()))[-5:]
        rand_hex = f"{random.randint(1000, 9999)}"
        awb = f"PX-{timestamp}{rand_hex}"
        tracking_url = f"https://postex.pk/tracking?orderRefNumber={awb}"
        label_url = f"https://api.postex.pk/v2/invoices/{awb}/label.pdf"

        return BookingResponse(
            success=True,
            awb_number=awb,
            courier_code=self.code,
            courier_name=self.name,
            tracking_url=tracking_url,
            shipping_cost=quote.total_cost,
            label_url=label_url
        )

    async def get_tracking(self, awb_number: str) -> TrackingStatusResponse:
        """Fetch tracking telemetry from PostEx."""
        now = datetime.utcnow()
        checkpoints = [
            TrackingCheckpoint(
                timestamp=now - timedelta(hours=6),
                status="BOOKED",
                location="PostEx Warehouse",
                remarks="Digital order booked"
            ),
            TrackingCheckpoint(
                timestamp=now - timedelta(hours=2),
                status="IN_TRANSIT",
                location="Linehaul Sorting",
                remarks="Dispatched to destination hub"
            ),
        ]

        return TrackingStatusResponse(
            awb_number=awb_number,
            courier_code=self.code,
            current_status="IN_TRANSIT",
            checkpoints=checkpoints
        )
