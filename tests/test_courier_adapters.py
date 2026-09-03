import pytest
from backend.integrations.couriers.base import CourierAdapter
from backend.integrations.couriers.blueex import BlueEXAdapter
from backend.integrations.couriers.postex import PostExAdapter
from backend.integrations.couriers.registry import CourierRegistry, courier_registry
from backend.integrations.couriers.tcs import TCSAdapter
from backend.schemas.shipment import BookingRequest, RateQuoteRequest


def test_courier_adapters_conform_to_protocol():
    """Verify that all concrete adapters satisfy the CourierAdapter protocol."""
    tcs = TCSAdapter()
    postex = PostExAdapter()
    blueex = BlueEXAdapter()

    assert isinstance(tcs, CourierAdapter)
    assert isinstance(postex, CourierAdapter)
    assert isinstance(blueex, CourierAdapter)


@pytest.mark.asyncio
async def test_courier_coverage_rules():
    """Test city coverage boundaries for urban vs remote destinations."""
    tcs = TCSAdapter()
    postex = PostExAdapter()
    blueex = BlueEXAdapter()

    # Major urban hubs are serviced by all couriers
    for city in ["Karachi", "Lahore", "Islamabad"]:
        assert await tcs.check_coverage(city) is True
        assert await postex.check_coverage(city) is True
        assert await blueex.check_coverage(city) is True

    # Remote towns are covered by TCS, but excluded by urban-only networks
    remote_city = "CHITRAL"
    assert await tcs.check_coverage(remote_city) is True
    assert await postex.check_coverage(remote_city) is False
    assert await blueex.check_coverage(remote_city) is False

    # Fully restricted outposts are rejected by TCS
    assert await tcs.check_coverage("ASTORE") is False


@pytest.mark.asyncio
async def test_rate_calculation_tiers_and_weight_increments():
    """Test base rates, incremental weights, and COD commission math."""
    tcs = TCSAdapter()
    postex = PostExAdapter()
    blueex = BlueEXAdapter()

    # 1. Same-city standard parcel (0.5kg, PKR 2000 COD)
    req_local = RateQuoteRequest(
        origin_city="Karachi",
        destination_city="Karachi",
        weight_kg=0.5,
        cod_amount=2000.0
    )
    quote_tcs_local = await tcs.calculate_rate(req_local)
    quote_postex_local = await postex.calculate_rate(req_local)
    quote_blueex_local = await blueex.calculate_rate(req_local)

    assert quote_tcs_local.is_serviceable is True
    assert quote_tcs_local.base_rate == 220.0
    assert quote_tcs_local.additional_weight_rate == 0.0
    # 1.5% of 2000 is 30, but minimum is 40
    assert quote_tcs_local.cod_fee == 40.0
    assert quote_tcs_local.total_cost == 260.0

    assert quote_postex_local.is_serviceable is True
    assert quote_postex_local.base_rate == 180.0
    assert quote_postex_local.cod_fee == 30.0  # min fee 30
    assert quote_postex_local.total_cost == 210.0

    assert quote_blueex_local.is_serviceable is True
    assert quote_blueex_local.base_rate == 160.0
    assert quote_blueex_local.cod_fee == 25.0  # min fee 25
    assert quote_blueex_local.total_cost == 185.0

    # 2. Heavy inter-city parcel (2.5kg, Karachi to Lahore, PKR 10000 COD)
    req_heavy = RateQuoteRequest(
        origin_city="Karachi",
        destination_city="Lahore",
        weight_kg=2.5,
        cod_amount=10000.0
    )
    quote_tcs_heavy = await tcs.calculate_rate(req_heavy)
    # Extra weight: 2.5 - 0.5 = 2.0kg -> 2 units * 150 = 300. Base: 290. COD: 10000 * 0.015 = 150.
    assert quote_tcs_heavy.base_rate == 290.0
    assert quote_tcs_heavy.additional_weight_rate == 300.0
    assert quote_tcs_heavy.cod_fee == 150.0
    assert quote_tcs_heavy.total_cost == 740.0


@pytest.mark.asyncio
async def test_courier_registry_multi_quote_comparison():
    """Verify registry discovers competing quotes and sorts them by lowest total cost."""
    registry = CourierRegistry()
    
    req = RateQuoteRequest(
        origin_city="Karachi",
        destination_city="Lahore",
        weight_kg=1.0,
        cod_amount=3500.0
    )
    quotes = await registry.calculate_all_quotes(req)

    assert len(quotes) == 3
    # Rates must be sorted from lowest to highest cost
    assert quotes[0].total_cost <= quotes[1].total_cost <= quotes[2].total_cost
    # BlueEX is typically the value economy leader
    assert quotes[0].courier_code == "blueex"


@pytest.mark.asyncio
async def test_shipment_booking_success_and_failure():
    """Verify that booking generates real AWBs and handles unserviceable cities cleanly."""
    tcs = TCSAdapter()
    postex = PostExAdapter()

    # Success booking for valid city
    req_valid = BookingRequest(
        order_id="#10490",
        courier_code="tcs",
        customer_name="Usman Liaquat",
        customer_phone="+923001234567",
        delivery_address="House 44-B, DHA Phase 5",
        destination_city="Lahore",
        cod_amount=4500.0,
        weight_kg=0.8
    )
    res_tcs = await tcs.book_shipment(req_valid)
    assert res_tcs.success is True
    assert len(res_tcs.awb_number) > 8
    assert "tcsexpress.com/tracking?awb=" in res_tcs.tracking_url
    assert res_tcs.shipping_cost > 0

    # Failure booking for unserviceable city with PostEx
    req_invalid = BookingRequest(
        order_id="#10491",
        courier_code="postex",
        customer_name="Mir Khan",
        customer_phone="+923339876543",
        delivery_address="Main Bazar",
        destination_city="CHITRAL",
        cod_amount=1200.0
    )
    res_postex = await postex.book_shipment(req_invalid)
    assert res_postex.success is False
    assert res_postex.awb_number == ""
    assert "does not service" in res_postex.error_message


@pytest.mark.asyncio
async def test_tracking_telemetry_checkpoints():
    """Verify that tracking query returns valid telemetry checkpoint history."""
    blueex = BlueEXAdapter()
    tracking = await blueex.get_tracking("BX-99401")

    assert tracking.awb_number == "BX-99401"
    assert tracking.courier_code == "blueex"
    assert tracking.current_status == "IN_TRANSIT"
    assert len(tracking.checkpoints) >= 2
    assert tracking.checkpoints[0].status == "BOOKED"
