from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi.testclient import TestClient

from backend.api.deps import get_db
from backend.main import app
from backend.services.analytics_service import AnalyticsService

client = TestClient(app)


@pytest.fixture
def mock_db():
    session = AsyncMock()
    # Mock row returned by first query
    mock_row = MagicMock()
    mock_row.total = 150
    mock_row.confirmed = 130
    mock_row.calling = 10
    mock_row.unreachable = 10
    mock_row.secured_revenue = 560000.0
    mock_row.total_gmv = 610000.0
    mock_row.total_shipments = 125
    mock_row.avg_shipping_cost = 215.0
    mock_row.total_shipping_spend = 26875.0
    mock_row.total_tickets = 20
    mock_row.resolved_tickets = 16
    mock_row.escalated_tickets = 4

    mock_res = MagicMock()
    mock_res.first.return_value = mock_row
    session.execute.return_value = mock_res
    return session


@pytest.mark.asyncio
async def test_analytics_service_get_kpis(mock_db):
    """Verify calculating executive KPIs and savings metrics."""
    service = AnalyticsService()
    kpis = await service.get_kpis(mock_db)

    assert "total_orders" in kpis
    assert "confirmed_orders" in kpis
    assert "confirmation_rate_pct" in kpis
    assert "total_secured_revenue_pkr" in kpis
    assert "courier_ai_savings_pkr" in kpis
    assert "ai_deflection_rate_pct" in kpis

    assert kpis["total_orders"] == 150
    assert kpis["confirmed_orders"] == 130
    assert kpis["confirmation_rate_pct"] == 86.7
    assert kpis["courier_ai_savings_pkr"] > 0


@pytest.mark.asyncio
async def test_analytics_service_get_funnel(mock_db):
    """Verify 5-stage conversion funnel ordering and counts."""
    service = AnalyticsService()
    funnel = await service.get_funnel(mock_db)

    assert len(funnel) == 5
    assert funnel[0]["stage"] == "1. Ingested Orders"
    assert funnel[0]["percentage"] == 100.0
    assert funnel[1]["stage"] == "2. Outbound Call Connected"
    assert funnel[2]["stage"] == "3. 3-Point Agreement Secured"
    assert funnel[3]["stage"] == "4. Auto-Dispatched with AWB"
    assert funnel[4]["stage"] == "5. Delivered & Completed"


@pytest.mark.asyncio
async def test_courier_benchmarks(mock_db):
    """Verify courier partner comparison contains TCS, PostEx, and BlueEX."""
    service = AnalyticsService()
    couriers = await service.get_courier_performance(mock_db)

    assert len(couriers) == 3
    codes = [c["courier_code"] for c in couriers]
    assert "blueex" in codes
    assert "postex" in codes
    assert "tcs" in codes


@pytest.mark.asyncio
async def test_support_analytics(mock_db):
    """Verify support analytics returns categories and satisfaction score."""
    service = AnalyticsService()
    support_data = await service.get_support_analytics(mock_db)

    assert "categories" in support_data
    assert "customer_satisfaction_score" in support_data
    assert support_data["customer_satisfaction_score"] > 4.0


def test_api_endpoints_analytics(mock_db):
    """Verify all analytics REST endpoints return 200 OK."""
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        res_kpis = client.get("/api/v1/analytics/kpis")
        assert res_kpis.status_code == 200
        assert "total_orders" in res_kpis.json()

        res_funnel = client.get("/api/v1/analytics/funnel")
        assert res_funnel.status_code == 200
        assert len(res_funnel.json()) == 5

        res_couriers = client.get("/api/v1/analytics/couriers")
        assert res_couriers.status_code == 200
        assert len(res_couriers.json()) == 3

        res_support = client.get("/api/v1/analytics/support")
        assert res_support.status_code == 200
        assert "categories" in res_support.json()
    finally:
        app.dependency_overrides.pop(get_db, None)
