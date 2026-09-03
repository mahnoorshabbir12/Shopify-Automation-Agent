from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.deps import get_db
from backend.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Executive Analytics"])


@router.get("/kpis", response_model=Dict[str, Any])
async def get_executive_kpis(db: AsyncSession = Depends(get_db)):
    """Retrieve high-level business and operational KPIs."""
    return await analytics_service.get_kpis(db)


@router.get("/funnel", response_model=List[Dict[str, Any]])
async def get_conversion_funnel(db: AsyncSession = Depends(get_db)):
    """Retrieve 5-stage confirmation, dispatch, and delivery conversion funnel."""
    return await analytics_service.get_funnel(db)


@router.get("/couriers", response_model=List[Dict[str, Any]])
async def get_courier_benchmarks(db: AsyncSession = Depends(get_db)):
    """Retrieve courier partner cost, speed, and reliability benchmarks."""
    return await analytics_service.get_courier_performance(db)


@router.get("/support", response_model=Dict[str, Any])
async def get_support_intelligence(db: AsyncSession = Depends(get_db)):
    """Retrieve customer support ticket distribution and resolution analytics."""
    return await analytics_service.get_support_analytics(db)
