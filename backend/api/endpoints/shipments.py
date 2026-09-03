import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_db
from backend.integrations.couriers.registry import courier_registry
from backend.schemas.shipment import RateQuoteResponse, TrackingStatusResponse
from backend.services.shipment_service import shipment_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/shipments", tags=["Shipments & Logistics"])


class DispatchRequest(BaseModel):
    preferred_courier_code: Optional[str] = None


@router.get("", response_model=List[Dict[str, Any]])
async def list_shipments(
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve the recent ledger of booked shipments with AWB numbers and courier details."""
    return await shipment_service.list_shipments(db, limit=limit)


@router.get("/rates/{order_id}", response_model=List[RateQuoteResponse])
async def get_competing_rates_for_order(
    order_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Fetch live multi-courier competing rate quotes (TCS vs PostEx vs BlueEX) for an order."""
    try:
        return await shipment_service.get_quotes_for_order(db, order_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching quotes for {order_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate shipping quotes.")


@router.post("/dispatch/{order_id}")
async def dispatch_order_shipment(
    order_id: str,
    payload: Optional[DispatchRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger shipment booking for a confirmed order.
    If preferred_courier_code is provided, uses that courier; otherwise, the LangGraph
    shipping agent selects the optimal courier automatically.
    """
    preferred_code = payload.preferred_courier_code if payload else None
    try:
        result = await shipment_service.book_order_shipment(
            db=db,
            order_id=order_id,
            preferred_courier_code=preferred_code
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to dispatch shipment for order {order_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tracking/{courier_code}/{awb_number}", response_model=TrackingStatusResponse)
async def get_shipment_tracking(
    courier_code: str,
    awb_number: str
):
    """Query live tracking telemetry for an AWB number from the courier partner."""
    adapter = courier_registry.get(courier_code)
    if not adapter:
        raise HTTPException(status_code=404, detail=f"Courier '{courier_code}' not supported.")
    
    return await adapter.get_tracking(awb_number)
