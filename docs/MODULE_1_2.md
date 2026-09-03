# Module 1.2 — PostgreSQL Relational Schema & Alembic Migrations

## What we built
Module 1.2 implements the persistent relational schema for orders and customers in PostgreSQL using **SQLAlchemy 2.0 Async ORM** and version-controlled database migrations with **Alembic**.

We created:
- `Customer` model: Tracks customer ID, name, verified phone number, and email.
- `Order` model: Stores order ID, price, currency, address JSONB, confirmation status, timestamps, and the 3-point COD audit flags (`is_address_confirmed`, `is_amount_confirmed`, `intent_to_receive`).
- Alembic migration environment for reversible schema evolution.

---

## Architecture Flow

```text
Customer Table (id, name, phone, email)
      │ 1
      │
      ▼ N
Order Table (id, customer_id, total_price, status,
             is_address_confirmed, is_amount_confirmed, intent_to_receive,
             shipping_address JSONB)
      │ 1
      │
      ▼ N
WorkflowTask Table (id, order_id, task_type, run_at, idempotency_key, status)
```

---

## Concepts and decisions

### Relational Customer & Order Linkage
Orders are strongly linked via foreign keys to `customers`. This allows the platform to build historical customer reliability profiles (e.g. lifetime confirmed orders vs. delivery rejections).

### Address Storage as JSONB
While core order states are normalized, shipping address fields (address lines, city, province, postal code) are stored in a PostgreSQL `JSONB` column, allowing flexible Pakistani address payloads without schema migrations.

---

## Approach Used & Why

### Chosen Approach: Declarative SQLAlchemy 2.0 Async Models with Alembic Version Control
- **Why this approach:**
  1. **Transactional Integrity:** In e-commerce, losing an order or recording a corrupt status creates severe financial loss. PostgreSQL guarantees ACID transaction safety.
  2. **Auditability & Traceability:** Rather than treating confirmation as a simple boolean flag, our schema stores separate booleans for Address, Amount, and Intent, plus timestamps and attempt counts.
  3. **Zero Downtime Migrations:** Alembic provides tracked, reversible migration files committed to Git so database migrations can run predictably in CI/CD and staging environments.

### Pros & Cons
| Pros | Cons |
|---|---|
| Strong relational constraints and foreign key integrity. | Requires migration discipline before deploying schema changes. |
| Native JSONB support for flexible shipping address payloads. | Slightly more boilerplate compared to schema-less document databases. |
| Fully asynchronous I/O via `asyncpg` prevents event loop blocking. | Must manage connection pool limits under high concurrency. |

---

## Transferable Real-World Use Cases

### Where to Implement This Approach
1. **Financial Ledger & Billing Systems:** Applications where every credit, debit, and transaction state transition must be recorded durably with explicit timestamps.
2. **Order Management & Logistics Platforms:** Systems that track parcels moving through distinct operational states (New → Confirmed → Booked → In Transit → Delivered).
3. **Multi-Stage Approval Workflows:** Enterprise processes requiring signed evidence across multiple checkpoints (e.g. loan approval, insurance claim verification).

### When NOT to Use This Approach
- Highly unstructured, rapidly changing document data where no relational links exist (use MongoDB or DynamoDB).
- Ephemeral time-series telemetry metrics where raw insert speed overrides relational integrity (use TimescaleDB or ClickHouse).
