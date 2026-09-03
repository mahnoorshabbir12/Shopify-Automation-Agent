# Module 2.3 — Automated Booking, AWB Generation, Shopify Fulfillment Sync & Ops Console Dispatch

## What we built
Module 2.3 completes **Phase 2 (Agent 3: Autonomous Shipping Agent)**.
It bridges the LangGraph courier decision engine directly into active fulfillment: executing parcel consignments, generating unique Air Waybill (AWB) tracking numbers, synchronizing tracking back to Shopify Admin GraphQL, and exposing a live Dispatch console in the React UI.

Key accomplishments:
1. **Shipment Coordination Service (`backend/services/shipment_service.py`):**
   - Implemented `book_order_shipment()` with end-to-end atomic execution:
     - Fetches confirmed order details and validates destination city.
     - Runs the LangGraph decision engine to pick the optimal carrier (or accepts operator override).
     - Calls the chosen courier adapter (`tcs`, `postex`, or `blueex`).
     - Inserts the `Shipment` ledger record with unique `awb_number`, `shipping_cost`, and `label_url`.
     - Calls Shopify GraphQL `fulfillmentCreateV2` to mark the order as fulfilled with customer tracking.
     - Enforces strict **idempotency**: subsequent dispatch calls return the existing active consignment without duplicate bookings or wasted postage.
2. **Shopify Admin GraphQL Fulfillment Sync (`backend/integrations/shopify/client.py`):**
   - Added `create_fulfillment(order_id, tracking_number, tracking_company, tracking_url)` using Shopify's modern `fulfillmentCreateV2` mutation.
3. **Logistics & Dispatch REST APIs (`backend/api/endpoints/shipments.py`):**
   - `GET /api/v1/shipments/rates/{order_id}`: Delivers live competing quotes from all 3 couriers.
   - `POST /api/v1/shipments/dispatch/{order_id}`: Triggers autonomous or operator-selected booking.
   - `GET /api/v1/shipments`: Returns the real-time ledger of booked shipments.
   - `GET /api/v1/shipments/tracking/{courier}/{awb}`: Queries live checkpoint telemetry.
4. **Operations Console Dispatch Mode (`frontend/src/components/OperationsConsole.tsx`):**
   - Added interactive view toggle between "Order Confirmation Queue" and "Autonomous Dispatch".
   - Booked consignments table displaying courier partner badges, clickable AWB links, destination, and fee.
   - Multi-quote comparison card directly within the Order Audit Drawer with one-click AI Auto-Dispatch.
5. **Comprehensive Automated Test Suite (`tests/test_shipment_service.py`):**
   - 6 automated tests verifying competing rates discovery, standard order auto-dispatch, high-value TCS safeguard, operator override, duplicate booking idempotency, and ledger queries (all passed).

---

## Concepts and decisions

### Two-Phase E-Commerce Fulfillment (Decision vs Execution)
In amateur architectures, the system immediately tries to book a courier the second an order arrives. This creates chaos:
- Customers often cancel or change their addresses within minutes.
- Unreachable numbers result in wasted consignment fees.
Our architecture splits fulfillment into two distinct phases:
- **Phase 1 (Verification):** Phone/voice confirmation agent verifies address, amount, and intent.
- **Phase 2 (Autonomous Dispatch):** Once and only once an order is `CONFIRMED`, the shipping agent selects the optimal courier, books the parcel, and updates Shopify.

### Dual-Channel Idempotency Guard
In high-volume e-commerce, warehouse workers or automated webhooks can inadvertently fire multiple dispatch triggers for the same order.
If not guarded, multiple courier pickups will arrive for the exact same package, generating multiple tracking numbers and double-charging COD fees.
`ShipmentService` solves this via a **dual-channel idempotency check**:
1. **Application Level:** Checks `select(Shipment).where(Shipment.order_id == order_id)` before firing courier API calls.
2. **Database Level:** Unique constraint on `awb_number` in PostgreSQL guarantees that even concurrent threads cannot insert duplicate consignments.

---

## Architecture Flow

```text
       ┌───────────────────────────────┐
       │   Customer Confirmed Order    │
       └───────────────┬───────────────┘
                       │
                       ▼
       ┌───────────────────────────────┐
       │     Shipment Service          │
       └───────┬───────────────┬───────┘
               │               │
       (Idempotency Check)     │ (Calls Shipping LangGraph)
               │               ▼
               │       ┌───────────────┐
               │       │ TCS / PostEx  │
               │       │  / BlueEX     │
               │       └───────┬───────┘
               │               │
               ▼               ▼
       ┌───────────────────────────────┐
       │   Unique AWB Number Issued    │
       └───────┬───────────────┬───────┘
               │               │
               ▼               ▼
  ┌─────────────────────┐  ┌────────────────────────────────────┐
  │ PostgreSQL Database │  │   Shopify Admin GraphQL            │
  │ (Shipment Table)    │  │   (fulfillmentCreateV2 Mutation)   │
  └─────────────────────┘  └────────────────────────────────────┘
```

---

## Approach Used & Why

### Chosen Approach: Centralized Orchestration Service with GraphQL Mutation Sync
- **Why this approach:**
  1. **Direct Customer Transparency:** Syncing the AWB and tracking URL back to Shopify via `fulfillmentCreateV2` immediately triggers Shopify's native SMS and email tracking notifications to the customer, drastically reducing "Where is my order?" (WISMO) support inquiries.
  2. **Auditability & Traceability:** The store owner can inspect exactly which courier was selected, what the cost was, and why that decision was made.
  3. **Operational Flexibility:** Operators can let the AI optimizer dispatch in 1 click, or override and select a specific carrier if local warehouse operations demand it.

### Pros & Cons
| Pros | Cons |
|---|---|
| Zero manual data entry between Shopify and courier booking portals. | Requires courier API tokens and credentials in environment settings. |
| Eliminates duplicate courier consignments via atomic idempotency checks. | Courier network downtime requires retry queues for offline bookings. |
| Customer automatically receives tracking links via Shopify's notification pipeline. | Shipping address typos must be corrected before booking. |

---

## Transferable Real-World Use Cases

### Where to Implement This Approach
1. **Multi-Carrier 3PL Logistics Hubs:** Automated pick-and-pack routing for third-party logistics warehouses managing orders for dozens of retail brands.
2. **Ride-Hailing & On-Demand Delivery Dispatch:** Selecting between Uber Direct, DoorDash Drive, and in-house fleet couriers based on real-time driver proximity and surge pricing.
3. **Cross-Border Customs Clearance:** Generating international airway bills and filing electronic customs declarations across DHL Express, FedEx International, and UPS.

### When NOT to Use This Approach
- Digital-only or dropshipping stores where the third-party manufacturer (e.g. Printful, AliExpress) manages 100% of physical fulfillment and provides their own tracking numbers directly.

---

## Code Pointers
- `backend/services/shipment_service.py`: `ShipmentService` core booking, idempotency, and Shopify sync logic.
- `backend/integrations/shopify/client.py`: `create_fulfillment` GraphQL mutation.
- `backend/api/endpoints/shipments.py`: REST endpoints for dispatching, quotes, and ledger.
- `frontend/src/components/OperationsConsole.tsx`: Autonomous dispatch tab and drawer quote comparator.
- `tests/test_shipment_service.py`: Automated test suite (all 6 tests passing).
