import pytest
from backend.agents.shipping.graph import evaluate_shipping_for_order


@pytest.mark.asyncio
async def test_standard_urban_order_selects_lowest_cost():
    """Verify that a standard order in an urban hub chooses the lowest cost courier."""
    result = await evaluate_shipping_for_order(
        order_id="#10501",
        destination_city="Lahore",
        destination_address="House 12, Gulberg III",
        weight_kg=0.8,
        cod_amount=3500.0,
        total_order_price=3500.0
    )

    assert result["status"] == "READY_TO_BOOK"
    assert result["selected_courier"] is not None
    # BlueEX should win on price for standard inter-city delivery
    assert result["selected_courier"].courier_code == "blueex"
    assert "most economical carrier" in result["decision_reason"]
    assert len(result["eligible_quotes"]) == 3


@pytest.mark.asyncio
async def test_high_value_order_prioritizes_tcs():
    """Verify that an order with COD >= 10,000 PKR prioritizes TCS for high security and low returns."""
    result = await evaluate_shipping_for_order(
        order_id="#10502",
        destination_city="Lahore",
        destination_address="House 44, DHA Phase 5",
        weight_kg=1.0,
        cod_amount=15000.0,
        total_order_price=15000.0
    )

    assert result["status"] == "READY_TO_BOOK"
    assert result["selected_courier"] is not None
    # TCS must be selected due to high-value safeguard policy
    assert result["selected_courier"].courier_code == "tcs"
    assert "High-value parcel" in result["decision_reason"]


@pytest.mark.asyncio
async def test_remote_city_falls_back_to_tcs():
    """Verify that a destination not serviced by PostEx/BlueEX falls back to TCS."""
    result = await evaluate_shipping_for_order(
        order_id="#10503",
        destination_city="CHITRAL",
        destination_address="Main Airport Road",
        weight_kg=0.5,
        cod_amount=4000.0,
        total_order_price=4000.0
    )

    assert result["status"] == "READY_TO_BOOK"
    assert result["selected_courier"] is not None
    assert result["selected_courier"].courier_code == "tcs"
    assert len(result["eligible_quotes"]) == 1


@pytest.mark.asyncio
async def test_unserviceable_destination_routes_to_human_exception():
    """Verify that an unserviceable destination routes to human exception queue."""
    result = await evaluate_shipping_for_order(
        order_id="#10504",
        destination_city="ASTORE",
        destination_address="Zero Point Valley",
        weight_kg=1.2,
        cod_amount=2500.0,
        total_order_price=2500.0
    )

    assert result["status"] == "EXCEPTION_REQUIRES_HUMAN"
    assert result["selected_courier"] is None
    assert "No active courier covers destination city" in result["decision_reason"]


@pytest.mark.asyncio
async def test_margin_protection_escalation():
    """Verify that if shipping cost exceeds 40% margin threshold, it flags for human review."""
    result = await evaluate_shipping_for_order(
        order_id="#10505",
        destination_city="Lahore",
        destination_address="Mall Road",
        weight_kg=4.0,  # Heavy parcel with low price
        cod_amount=1500.0,
        total_order_price=1500.0
    )

    assert result["status"] == "EXCEPTION_REQUIRES_HUMAN"
    assert result["selected_courier"] is None
    assert "exceeds 40% margin threshold" in result["decision_reason"]
