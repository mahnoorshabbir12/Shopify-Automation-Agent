from typing import Protocol, runtime_checkable
from backend.schemas.shipment import (
    BookingRequest,
    BookingResponse,
    RateQuoteRequest,
    RateQuoteResponse,
    TrackingStatusResponse,
)


@runtime_checkable
class CourierAdapter(Protocol):
    """Unified asynchronous protocol for e-commerce courier partners."""

    code: str
    name: str

    async def check_coverage(self, city: str) -> bool:
        """Verify whether the courier services the specified destination city."""
        ...

    async def calculate_rate(self, request: RateQuoteRequest) -> RateQuoteResponse:
        """Compute the total shipping rate quote including weight tariffs and COD fee."""
        ...

    async def book_shipment(self, request: BookingRequest) -> BookingResponse:
        """Create a booking consignment and return the AWB tracking details."""
        ...

    async def get_tracking(self, awb_number: str) -> TrackingStatusResponse:
        """Fetch tracking telemetry for an existing AWB number."""
        ...
