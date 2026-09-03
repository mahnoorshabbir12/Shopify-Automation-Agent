from typing import Dict, List, Optional
from backend.integrations.couriers.base import CourierAdapter
from backend.integrations.couriers.blueex import BlueEXAdapter
from backend.integrations.couriers.postex import PostExAdapter
from backend.integrations.couriers.tcs import TCSAdapter
from backend.schemas.shipment import RateQuoteRequest, RateQuoteResponse


class CourierRegistry:
    """Central registry and discovery service for courier integration adapters."""

    def __init__(self):
        self._adapters: Dict[str, CourierAdapter] = {}
        # Pre-register primary Pakistani courier partners
        self.register(TCSAdapter())
        self.register(PostExAdapter())
        self.register(BlueEXAdapter())

    def register(self, adapter: CourierAdapter) -> None:
        """Register or override a courier adapter."""
        self._adapters[adapter.code.lower()] = adapter

    def get(self, courier_code: str) -> Optional[CourierAdapter]:
        """Fetch an adapter by courier code."""
        return self._adapters.get(courier_code.lower())

    def get_all(self) -> Dict[str, CourierAdapter]:
        """Retrieve all active courier adapters."""
        return dict(self._adapters)

    async def get_serviceable_couriers(self, city: str) -> List[CourierAdapter]:
        """Identify which couriers provide delivery coverage for a target city."""
        serviceable: List[CourierAdapter] = []
        for adapter in self._adapters.values():
            if await adapter.check_coverage(city):
                serviceable.append(adapter)
        return serviceable

    async def calculate_all_quotes(self, request: RateQuoteRequest) -> List[RateQuoteResponse]:
        """Query all registered adapters simultaneously to collect competing quotes."""
        quotes: List[RateQuoteResponse] = []
        for adapter in self._adapters.values():
            quote = await adapter.calculate_rate(request)
            if quote.is_serviceable:
                quotes.append(quote)
        # Sort quotes by lowest cost first
        quotes.sort(key=lambda q: q.total_cost)
        return quotes


# Singleton registry instance for application-wide dependency injection
courier_registry = CourierRegistry()
