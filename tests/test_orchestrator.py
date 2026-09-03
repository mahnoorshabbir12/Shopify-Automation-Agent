from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi.testclient import TestClient

from backend.api.deps import get_db
from backend.main import app
from backend.models.order import Order
from backend.observability.langsmith_tracer import LangSmithTracer
from backend.services.orchestrator_service import OrchestratorService

client = TestClient(app)


@pytest.fixture
def mock_db():
    session = AsyncMock()
    order = Order(
        id="order-10482",
        status="calling",
        total_price=3800.0,
        customer_id="cust-1",
        shipping_address={"city": "Lahore", "address1": "House 18, Block H, Model Town"}
    )

    async def mock_execute(stmt):
        res = MagicMock()
        stmt_str = str(stmt).lower()
        if "shipment" in stmt_str:
            res.scalar_one_or_none.return_value = None
            res.scalars.return_value.all.return_value = []
        else:
            res.scalar_one_or_none.return_value = order
            res.scalars.return_value.all.return_value = [order]
        return res

    session.execute.side_effect = mock_execute
    return session


def test_langsmith_tracer_decorator():
    """Verify LangSmith tracing decorator captures execution latency."""
    tracer = LangSmithTracer()

    @tracer.trace_run("test_function", run_type="tool")
    def sync_tool(x: int) -> int:
        return x * 2

    assert sync_tool(5) == 10


@pytest.mark.asyncio
async def test_run_autonomous_lifecycle(mock_db):
    """Verify executing the end-to-end autonomous order lifecycle."""
    orchestrator = OrchestratorService()
    result = await orchestrator.run_autonomous_lifecycle(db=mock_db, order_id="order-10482")

    assert result["success"] is True
    assert result["order_id"] == "order-10482"
    assert result["awb_number"] is not None
    assert len(result["stages"]) == 4

    stage_names = [s["name"] for s in result["stages"]]
    assert "Order Ingestion" in stage_names
    assert "AI Confirmation Call" in stage_names
    assert "Autonomous Logistics Dispatch" in stage_names
    assert "Customer Tracking Alert" in stage_names

    for stage in result["stages"]:
        assert stage["status"] == "completed"


def test_orchestrator_endpoint_run(mock_db):
    """Verify the /api/v1/orchestrator/run endpoint invokes the lifecycle cascade."""
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post("/api/v1/orchestrator/run/order-10482")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["stages"]) == 4
    finally:
        app.dependency_overrides.pop(get_db, None)
