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


class BlueEXAdapter:
    """BlueEX courier adapter optimized for economical parcel rates and bulk logistics."""

    code: str = "blueex"
    name: str = "BlueEX Courier"

    # BlueEX covers primary urban centers and industrial corridors
    SERVICEABLE_CITIES = {
        "KARACHI", "LAHORE", "ISLAMABAD", "RAWALPINDI", "FAISALABAD",
        "GUJRANWALA", "SIALKOT", "PESHAWAR", "MULTAN", "HYDERABAD",
        "QUETTA", "SUKKUR", "SAHIWAL", "RAHIM YAR KHAN", "BAHAWALPUR",
        "JHELUM", "WAH CANTT", "KASUR", "GUJRAT", "OKARA"
    }

    def __init__(self, api_key: Optional[str] = None, client_code: Optional[str] = None, sandbox_mode: bool = True):
        self.api_key = api_key or "blueex_sandbox_key"
        self.client_code = client_code or "BX-CL-55102"
        self.sandbox_mode = sandbox_mode

    async def check_coverage(self, city: str) -> bool:
        """Verify city coverage with BlueEX."""
        norm_city = city.strip().upper()
        return norm_city in self.SERVICEABLE_CITIES

    async def calculate_rate(self, request: RateQuoteRequest) -> RateQuoteResponse:
        """Calculate economical BlueEX rate quote."""
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
                notes=f"City '{request.destination_city}' is outside BlueEX coverage zone."
            )

        is_within_city = request.origin_city.strip().upper() == request.destination_city.strip().upper()
        base_rate = 160.0 if is_within_city else 210.0

        extra_kg = max(0.0, request.weight_kg - 0.5)
        chargeable_extra_units = math.ceil(extra_kg)
        weight_fee = float(chargeable_extra_units * 100.0)

        # Most economical COD commission: 1.0% (min PKR 25)
        cod_fee = round(max(25.0, request.cod_amount * 0.010), 2) if request.cod_amount > 0 else 0.0
        total_cost = round(base_rate + weight_fee + cod_fee, 2)
        est_days = 2 if is_within_city else 3

        return RateQuoteResponse(
            courier_code=self.code,
            courier_name=self.name,
            base_rate=base_rate,
            additional_weight_rate=weight_fee,
            cod_fee=cod_fee,
            total_cost=total_cost,
            estimated_days=est_days,
            is_serviceable=True,
            notes="BlueEX Value Economy COD - ideal for non-urgent bulk e-commerce parcels."
        )

    async def book_shipment(self, request: BookingRequest) -> BookingResponse:
        """Create booking consignment with BlueEX."""
        is_covered = await self.check_coverage(request.destination_city)
        if not is_covered:
            return BookingResponse(
                success=False,
                awb_number="",
                courier_code=self.code,
                courier_name=self.name,
                tracking_url="",
                shipping_cost=0.0,
                error_message=f"Destination '{request.destination_city}' is outside BlueEX network."
            )

        quote = await self.calculate_rate(RateQuoteRequest(
            origin_city="Karachi",
            destination_city=request.destination_city,
            weight_kg=request.weight_kg,
            cod_amount=request.cod_amount,
            order_id=request.order_id
        ))

        # Generate BlueEX Consignment Number (CN)
        timestamp = str(int(time.time()))[-5:]
        rand_num = f"{random.randint(1000, 9999)}"
        awb = f"BX-{timestamp}{rand_num}"
        tracking_url = f"https://www.blue-ex.com/tracking?cn={awb}"
        label_url = f"https://api.blue-ex.com/labels/print?cn={awb}"

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
        """Fetch tracking telemetry from BlueEX."""
        now = datetime.utcnow()
        checkpoints = [
            TrackingCheckpoint(
                timestamp=now - timedelta(hours=10),
                status="BOOKED",
                location="BlueEX Station",
                remarks="CN booked electronically"
            ),
            TrackingCheckpoint(
                timestamp=now - timedelta(hours=3),
                status="IN_TRANSIT",
                location="Regional Operations Center",
                remarks="Consignment processed into manifest"
            ),
        ]

        return TrackingStatusResponse(
            awb_number=awb_number,
            courier_code=self.code,
            current_status="IN_TRANSIT",
            checkpoints=checkpoints
        )
