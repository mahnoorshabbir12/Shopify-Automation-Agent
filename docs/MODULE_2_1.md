# Module 2.1 — Courier Domain Models & Adapter Architecture (TCS, PostEx, BlueEX)

## What we built
Module 2.1 introduces the core logistics and courier abstraction layer for our platform.
It initiates **Phase 2 (Agent 3: Autonomous Shipping Agent)** by modeling courier schemas and establishing a unified, decoupled interface for interacting with Pakistan's top e-commerce couriers: **TCS Express, PostEx Logistics, and BlueEX Courier**.

Key accomplishments:
1. **Shipment Database Schema (`backend/models/shipment.py`):**
   - Added SQLAlchemy 2.0 models for `Courier`, `CourierRateRule`, `Shipment`, and `TrackingEvent`.
   - Modeled the parcel lifecycle: `BOOKED`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `RETURNED`, `CANCELLED`, `FAILED`.
   - Enforced database-level unique constraints on `awb_number` to prevent duplicate courier consignments.
2. **Pydantic API Contracts (`backend/schemas/shipment.py`):**
   - Structured contracts for `RateQuoteRequest`, `RateQuoteResponse`, `BookingRequest`, `BookingResponse`, and `TrackingStatusResponse`.
3. **Unified Courier Protocol (`backend/integrations/couriers/base.py`):**
   - Created a typed asynchronous `CourierAdapter` Python `Protocol` defining uniform methods:
     - `check_coverage(city: str) -> bool`
     - `calculate_rate(request: RateQuoteRequest) -> RateQuoteResponse`
     - `book_shipment(request: BookingRequest) -> BookingResponse`
     - `get_tracking(awb_number: str) -> TrackingStatusResponse`
4. **Concrete Courier Implementations:**
   - `TCSAdapter` (`backend/integrations/couriers/tcs.py`): Nationwide 98% coverage, premium express COD tariffs, and 11-digit consignment number generator.
   - `PostExAdapter` (`backend/integrations/couriers/postex.py`): High-density urban network, next-day COD remittance, 1.2% fee, and `PX-` tracking generator.
   - `BlueEXAdapter` (`backend/integrations/couriers/blueex.py`): Bulk e-commerce value economy, 1.0% COD fee, and `BX-` consignment generator.
5. **Central Discovery Registry (`backend/integrations/couriers/registry.py`):**
   - Registry enabling multi-quote comparison, automatic rate sorting by cost, and coverage filtering across all partners.
6. **Automated Unit Test Suite (`tests/test_courier_adapters.py`):**
   - 6 comprehensive unit tests verifying protocol conformance, urban vs remote coverage boundaries, weight tariffs, and multi-quote sorting (all passed).

---

## Concepts and decisions

### The Adapter Pattern for Logistics Providers
Third-party courier companies have incompatible REST APIs. For instance:
- PostEx expects `orderRefNumber`, `invoicePayment`, and uses Bearer token authorization.
- TCS uses `consignmentNumber`, `declaredValue`, and uses custom account number credentials.
- BlueEX expects XML/JSON payloads with customer session credentials.
If the order fulfillment pipeline calls these vendor endpoints directly, changing or adding a courier breaks the business logic.
The **Adapter Pattern** provides an identical, normalized interface (`calculate_rate`, `check_coverage`, `book_shipment`, `get_tracking`) across all couriers. The shipping agent talks exclusively to the `CourierAdapter` abstraction, completely isolated from vendor idiosyncrasies.

### Structural Subtyping (`typing.Protocol`) vs Abstract Base Classes
Rather than forcing couriers to inherit from a shared class hierarchy (`class TCSAdapter(BaseCourier)`), we use Python's `typing.Protocol` with `@runtime_checkable`.
This adheres to the **Interface Segregation Principle**:
- Concrete adapters are decoupled, standalone modules.
- Adapters can be mocked or swapped dynamically during testing with zero inheritance baggage.
- Static type checkers (mypy/IDE) verify method signatures at compile time.

---

## Architecture Flow

```text
               Shopify Confirmed Order
                         │
                         ▼
        ┌──────────────────────────────────┐
        │  Shipping Agent / Dispatcher     │
        └─────────────────┬────────────────┘
                          │ RateQuoteRequest (City, Weight, COD)
                          ▼
        ┌──────────────────────────────────┐
        │       Courier Registry           │
        └─────────────────┬────────────────┘
                          │ Queries all active adapters simultaneously
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
  ┌───────────┐     ┌───────────┐     ┌───────────┐
  │    TCS    │     │  PostEx   │     │  BlueEX   │
  │  Adapter  │     │  Adapter  │     │  Adapter  │
  └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │ Competing Quotes [Sorted by Cost / SLA]
                          ▼
            [Selection Decision Engine]
                          │
                          ▼
              (Module 2.2 LangGraph)
```

---

## Approach Used & Why

### Chosen Approach: Direct Adapter Protocol with Native Sandbox Simulation
- **Why this approach:**
  1. **Domestic Logistics Reality:** Global shipping aggregators (like EasyPost or ShipEngine) do not support domestic couriers in Pakistan (TCS, PostEx, BlueEX). Building native, direct adapters gives our platform 100% control, zero middleman aggregator fees, and sub-millisecond local quoting.
  2. **100% Offline Testability:** Courier test sandboxes often require pre-approved sandbox merchant accounts and static IP whitelisting. By incorporating high-fidelity sandbox simulation directly within each adapter, unit tests and CI pipelines execute locally in milliseconds without network failures or expired tokens.
  3. **Extensibility for Additional Couriers:** Onboarding a new courier (e.g. Leopard, CallCourier, Trax) only requires writing one file conforming to `CourierAdapter` and registering it in `CourierRegistry`.

### Pros & Cons
| Pros | Cons |
|---|---|
| Zero vendor lock-in; swapping or adding a courier requires touching only one isolated file. | Each courier API schema, error status codes, and webhook payload must be mapped manually. |
| Deterministic offline testing without external network dependencies. | City names must be normalized (e.g. "KHI" -> "Karachi") across different courier taxonomies. |
| Unified multi-quote comparison sorted automatically by lowest cost or SLA. | Requires maintaining domestic rate rule tables in PostgreSQL for fallback pricing. |

---

## Transferable Real-World Use Cases

### Where to Implement This Approach
1. **Multi-Carrier E-Commerce Dispatch:** Routing shipments dynamically between DHL, FedEx, UPS, and local last-mile couriers depending on parcel weight and destination zip code.
2. **Multi-Gateway Payment Orchestration:** Normalizing Stripe, PayPal, Razorpay, and EasyPaisa behind a single `PaymentAdapter` protocol (`authorize`, `capture`, `refund`).
3. **SMS & Voice Telephony Fallbacks:** Switching seamlessly between Plivo, Twilio, and Sinch depending on regional routing costs and delivery rates.

### When NOT to Use This Approach
- When integrating with a unified international market where a single standard aggregator (e.g., Stripe for payments or EasyPost for US postage) covers 100% of your operational needs. Adding custom adapters on top of an aggregator adds unnecessary indirection.

---

## Code Pointers
- `backend/models/shipment.py`: Database models for Couriers, Rates, Shipments, and Tracking Events.
- `backend/schemas/shipment.py`: Pydantic contracts for rate requests, bookings, and telemetry.
- `backend/integrations/couriers/base.py`: The `CourierAdapter` protocol.
- `backend/integrations/couriers/tcs.py`: TCS Express implementation.
- `backend/integrations/couriers/postex.py`: PostEx Logistics implementation.
- `backend/integrations/couriers/blueex.py`: BlueEX Courier implementation.
- `backend/integrations/couriers/registry.py`: Central registry and multi-quote comparison engine.
- `tests/test_courier_adapters.py`: Complete unit test coverage (all passing).
