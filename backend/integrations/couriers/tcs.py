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


class TCSAdapter:
    """TCS Express courier adapter with nationwide coverage and sandbox simulation."""

    code: str = "tcs"
    name: str = "TCS Express"

    # Known restricted or unreachable remote outposts
    UNSERVICEABLE_CITIES = {"ASTORE", "ORMARA", "WARI"}

    def __init__(self, api_key: Optional[str] = None, account_number: Optional[str] = None, sandbox_mode: bool = True):
        self.api_key = api_key or "tcs_sandbox_key"
        self.account_number = account_number or "TCS-ACC-99214"
        self.sandbox_mode = sandbox_mode

    async def check_coverage(self, city: str) -> bool:
        """TCS has nationwide coverage across almost all major and minor cities."""
        norm_city = city.strip().upper()
        return norm_city not in self.UNSERVICEABLE_CITIES

    async def calculate_rate(self, request: RateQuoteRequest) -> RateQuoteResponse:
        """Calculate TCS rate quote."""
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
                notes=f"City '{request.destination_city}' is outside TCS serviceable network."
            )

        is_within_city = request.origin_city.strip().upper() == request.destination_city.strip().upper()
        base_rate = 220.0 if is_within_city else 290.0
        
        # Incremental weight calculation (base includes first 0.5kg)
        extra_kg = max(0.0, request.weight_kg - 0.5)
        chargeable_extra_units = math.ceil(extra_kg)
        weight_fee = float(chargeable_extra_units * 150.0)

        # COD collection tariff: 1.5% of COD amount (min PKR 40)
        cod_fee = round(max(40.0, request.cod_amount * 0.015), 2) if request.cod_amount > 0 else 0.0
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
            notes="TCS Express COD Priority delivery with insurance coverage."
        )

    async def book_shipment(self, request: BookingRequest) -> BookingResponse:
        """Create a booking consignment with TCS."""
        is_covered = await self.check_coverage(request.destination_city)
        if not is_covered:
            return BookingResponse(
                success=False,
                awb_number="",
                courier_code=self.code,
                courier_name=self.name,
                tracking_url="",
                shipping_cost=0.0,
                error_message=f"Destination city '{request.destination_city}' is not serviceable by TCS."
            )

        # Compute cost for booking
        quote = await self.calculate_rate(RateQuoteRequest(
            origin_city="Karachi",
            destination_city=request.destination_city,
            weight_kg=request.weight_kg,
            cod_amount=request.cod_amount,
            order_id=request.order_id
        ))

        # Generate realistic 11-digit TCS consignment number
        timestamp_suffix = str(int(time.time()))[-6:]
        rand_digits = f"{random.randint(1000, 9999)}"
        awb = f"778{timestamp_suffix}{rand_digits}"[:11]
        tracking_url = f"https://www.tcsexpress.com/tracking?awb={awb}"
        label_url = f"https://api.tcsexpress.com/labels/{awb}.pdf"

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
        """Fetch tracking telemetry for TCS AWB."""
        now = datetime.utcnow()
        checkpoints = [
            TrackingCheckpoint(
                timestamp=now - timedelta(hours=8),
                status="BOOKED",
                location="Karachi Central Hub",
                remarks="Consignment data received from merchant"
            ),
            TrackingCheckpoint(
                timestamp=now - timedelta(hours=4),
                status="PICKED_UP",
                location="Karachi Station 02",
                remarks="Parcel collected by rider"
            ),
            TrackingCheckpoint(
                timestamp=now - timedelta(hours=1),
                status="IN_TRANSIT",
                location="TCS Sorting Facility",
                remarks="Departed on linehaul flight/vehicle"
            ),
        ]

        return TrackingStatusResponse(
            awb_number=awb_number,
            courier_code=self.code,
            current_status="IN_TRANSIT",
            checkpoints=checkpoints
        )
