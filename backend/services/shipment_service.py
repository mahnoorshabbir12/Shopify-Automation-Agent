import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.agents.shipping.graph import evaluate_shipping_for_order
from backend.integrations.couriers.registry import courier_registry
from backend.integrations.shopify.client import ShopifyAdminClient
from backend.models.order import Order
from backend.models.shipment import Shipment, ShipmentStatus
from backend.schemas.shipment import BookingRequest, RateQuoteRequest, RateQuoteResponse

logger = logging.getLogger(__name__)


class ShipmentService:
    """Enterprise coordinator for multi-courier booking, tracking, and Shopify sync."""

    def __init__(self, shopify_client: Optional[ShopifyAdminClient] = None):
        self.shopify_client = shopify_client or ShopifyAdminClient()

    async def get_quotes_for_order(self, db: AsyncSession, order_id: str) -> List[RateQuoteResponse]:
        """Collect all available courier rate quotes for a specific order."""
        result = await db.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()
        if not order:
            raise ValueError(f"Order '{order_id}' not found.")

        dest_city = "Karachi"
        if isinstance(order.shipping_address, dict):
            dest_city = order.shipping_address.get("city", "Karachi")

        request = RateQuoteRequest(
            origin_city="Karachi",
            destination_city=dest_city,
            weight_kg=0.5,
            cod_amount=float(order.total_price),
            order_id=order.id
        )

        return await courier_registry.calculate_all_quotes(request)

    async def book_order_shipment(
        self,
        db: AsyncSession,
        order_id: str,
        preferred_courier_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute parcel booking with the optimal courier (or operator override),
        persist AWB record, and synchronize fulfillment to Shopify.
        """
        # 1. Idempotency Check: Don't double-book an already booked parcel
        existing_result = await db.execute(
            select(Shipment).where(
                Shipment.order_id == order_id,
                Shipment.status != ShipmentStatus.CANCELLED.value
            )
        )
        existing_shipment = existing_result.scalar_one_or_none()
        if existing_shipment:
            logger.info(f"Order {order_id} already has active shipment AWB {existing_shipment.awb_number}")
            return {
                "success": True,
                "already_booked": True,
                "shipment_id": existing_shipment.id,
                "awb_number": existing_shipment.awb_number,
                "courier_code": existing_shipment.courier_code,
                "tracking_url": existing_shipment.tracking_url,
                "shipping_cost": existing_shipment.shipping_cost,
                "status": existing_shipment.status
            }

        # 2. Fetch Order and Customer Data
        order_res = await db.execute(select(Order).where(Order.id == order_id))
        order = order_res.scalar_one_or_none()
        if not order:
            raise ValueError(f"Order '{order_id}' not found.")

        dest_city = "Karachi"
        address_str = "Customer Address"
        if isinstance(order.shipping_address, dict):
            dest_city = order.shipping_address.get("city", "Karachi")
            address_str = order.shipping_address.get("address1", "Street Address")

        # 3. Determine Winning Courier: Via Manual Override or LangGraph Optimization
        chosen_courier_code = preferred_courier_code
        decision_reason = "Manual operator dispatch selection."

        if not chosen_courier_code:
            eval_result = await evaluate_shipping_for_order(
                order_id=order.id,
                destination_city=dest_city,
                destination_address=address_str,
                weight_kg=0.8,
                cod_amount=float(order.total_price),
                total_order_price=float(order.total_price)
            )

            if eval_result.get("status") == "EXCEPTION_REQUIRES_HUMAN" or not eval_result.get("selected_courier"):
                raise ValueError(f"Shipping evaluation exception: {eval_result.get('decision_reason')}")

            chosen_courier_code = eval_result["selected_courier"].courier_code
            decision_reason = eval_result.get("decision_reason", "Optimized by Shipping LangGraph.")

        adapter = courier_registry.get(chosen_courier_code)
        if not adapter:
            raise ValueError(f"Courier adapter '{chosen_courier_code}' not supported.")

        # 4. Dispatch Booking Request to Courier Adapter
        booking_payload = BookingRequest(
            order_id=order.id,
            courier_code=chosen_courier_code,
            customer_name="Valued Customer",
            customer_phone="+923001234567",
            delivery_address=address_str,
            destination_city=dest_city,
            cod_amount=float(order.total_price),
            weight_kg=0.8
        )

        booking_res = await adapter.book_shipment(booking_payload)
        if not booking_res.success:
            raise RuntimeError(f"Courier {adapter.name} failed booking: {booking_res.error_message}")

        # 5. Persist Shipment Record in PostgreSQL
        new_shipment = Shipment(
            order_id=order.id,
            courier_code=chosen_courier_code,
            awb_number=booking_res.awb_number,
            tracking_url=booking_res.tracking_url,
            status=ShipmentStatus.BOOKED.value,
            shipping_cost=booking_res.shipping_cost,
            cod_amount=float(order.total_price),
            destination_city=dest_city,
            label_url=booking_res.label_url,
            courier_payload={"decision_reason": decision_reason}
        )
        db.add(new_shipment)
        await db.flush()

        # 6. Synchronize Fulfillment to Shopify Admin GraphQL
        fulfillment_info = await self.shopify_client.create_fulfillment(
            order_id=order.id,
            tracking_number=booking_res.awb_number,
            tracking_company=adapter.name,
            tracking_url=booking_res.tracking_url
        )
        if fulfillment_info and isinstance(fulfillment_info, dict):
            new_shipment.shopify_fulfillment_id = fulfillment_info.get("id")

        await db.commit()
        await db.refresh(new_shipment)

        return {
            "success": True,
            "shipment_id": new_shipment.id,
            "order_id": new_shipment.order_id,
            "awb_number": new_shipment.awb_number,
            "courier_code": new_shipment.courier_code,
            "courier_name": adapter.name,
            "tracking_url": new_shipment.tracking_url,
            "shipping_cost": new_shipment.shipping_cost,
            "destination_city": new_shipment.destination_city,
            "decision_reason": decision_reason,
            "status": new_shipment.status,
            "shopify_fulfillment_id": new_shipment.shopify_fulfillment_id
        }

    async def list_shipments(self, db: AsyncSession, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch latest booked consignments."""
        result = await db.execute(
            select(Shipment).order_by(Shipment.booked_at.desc()).limit(limit)
        )
        shipments = result.scalars().all()
        return [
            {
                "id": s.id,
                "order_id": s.order_id,
                "courier_code": s.courier_code,
                "awb_number": s.awb_number,
                "tracking_url": s.tracking_url,
                "status": s.status,
                "shipping_cost": s.shipping_cost,
                "cod_amount": s.cod_amount,
                "destination_city": s.destination_city,
                "booked_at": s.booked_at.isoformat() if s.booked_at else None,
                "label_url": s.label_url,
                "shopify_fulfillment_id": s.shopify_fulfillment_id
            }
            for s in shipments
        ]


# Singleton instance
shipment_service = ShipmentService()
