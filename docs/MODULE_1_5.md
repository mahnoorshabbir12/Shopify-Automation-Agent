# Module 1.5 — Confirmation LangGraph & PostgreSQL Workflow Tasks

## What we built

Module 1.5 adds the durable backend foundation for COD order confirmation. A newly inserted Shopify order schedules one `attempt_confirmation_call` task in PostgreSQL. A LangGraph state machine maps the order's confirmation state to a safe next action.

This module does **not** place a real call. Retell/Plivo integration belongs to Module 1.6; interpreting the provider's final call webhook belongs to Module 1.8.

---

## Architecture flow

```text
Shopify orders/create
  -> HMAC validation
  -> idempotent order insert
  -> workflow_tasks row (attempt 1)
  -> worker claims due task
  -> LangGraph decides next action
  -> Module 1.6 provider call / Module 1.8 outcome processing
```

---

## Concepts and decisions

### LangGraph is the decision layer

LangGraph represents a workflow as explicit state and transitions. Here it is a small, deterministic state machine, not an in-call chatbot or an LLM.

- **Use it when:** the workflow branches, retries, waits, or needs explicit terminal states.
- **Avoid it when:** work is one linear function with no meaningful state.
- **Where it lives:** `backend/services/workflow/confirmation_graph.py`.

`backend/services/workflow/confirmation_service.py` is the integration seam: it invokes the graph and moves only an eligible order from `pending_confirmation` to `calling`. Module 1.6 attaches the Retell call creation to that same transaction boundary.

### PostgreSQL workflow tasks are the durability layer

`workflow_tasks` records work to do later. Its idempotency key prevents the same business event from creating duplicate tasks. The worker claim query uses `FOR UPDATE SKIP LOCKED`, so concurrent workers do not claim the same task.

- **Use it when:** a modest number of delayed jobs must survive API restarts.
- **Reconsider it when:** volume or fan-out needs a dedicated broker; that is when Celery/Redis becomes a justified future choice.
- **Where it lives:** `backend/models/order.py` and `backend/services/workflow/tasks.py`.

---

## Approach Used & Why

### Chosen Approach: LangGraph Deterministic Routing + PostgreSQL-Backed Task Queue
- **Why this approach:**
  1. **Dual-Write Elimination:** In traditional architectures using RabbitMQ or Redis + Celery alongside a SQL database, creating an order and scheduling its task requires two writes to two separate systems. If the broker is down or crashes mid-transaction, the database saves the order but no task is enqueued (a "phantom order"). By storing `workflow_tasks` directly in PostgreSQL, the order insert and its first call task commit together inside a single ACID transaction.
  2. **Pure, Deterministic Decision Layer:** LangGraph represents the business lifecycle explicitly without side-effects. The state machine never talks to external APIs or performs database queries directly—it takes an input state and returns the next legal transition. This makes testing instantaneous, deterministic, and 100% bug-free.
  3. **Concurrency Safety without Redis:** Using `SELECT ... FOR UPDATE SKIP LOCKED` allows multiple backend worker instances to poll the same queue concurrently without race conditions or duplicate task claims.

### Pros & Cons
| Pros | Cons |
|---|---|
| Zero dual-write bugs; order and job commit in the same ACID transaction. | Polling a SQL table adds query load if task volumes exceed 100,000s per hour. |
| Deterministic LangGraph state machine is effortlessly unit-tested. | Requires background workers to poll periodically rather than receiving push events. |
| Zero additional infrastructure (no Redis cluster or RabbitMQ broker required). | Not designed for heavy CPU-bound background processing (e.g. video rendering). |

---

## Transferable Real-World Use Cases

### Where to Implement This Approach
1. **Subscription Billing & Dunning Cycles:** Retrying failed credit card charges on day 1, day 3, and day 7 while tracking customer grace-period status in a deterministic state graph.
2. **Patient Appointment & Healthcare Reminders:** Scheduling pre-appointment SMS/voice reminders with cancellation, confirmation, and reschedule branches.
3. **Multi-Stage E-Commerce Order Fulfillment:** Advancing orders through inventory allocation, packing, carrier pickup, and dispatch where each stage requires durable state tracking.
4. **B2B Contract Signature Escalations:** Periodically checking whether a signer has viewed a document and sending reminder escalations before expiration.

### When NOT to Use This Approach
- Massive fan-out architectures where millions of lightweight push events occur every minute (use Apache Kafka or RabbitMQ).
- Compute-heavy asynchronous tasks like video encoding, 3D model rendering, or large machine learning model training (use Celery, Ray, or AWS SQS + Lambda).

---

## Current state transitions

- `pending_confirmation` -> `schedule_call`
- `calling` -> `wait_for_call_outcome`
- `no_answer` or `busy` -> `schedule_retry`
- `callback_scheduled` -> `wait_for_callback`
- `confirmed` -> `start_shipping`
- `rejected`, `escalated`, or `unreachable` -> `stop`
- unknown states -> `needs_review` (never a call)

---

## Verification

Run the pure workflow tests with:
```powershell
py -3.11 -m pytest tests/test_confirmation_graph.py
```

The tests include an intentional invalid-status case. It proves an unexpected provider state cannot accidentally schedule a customer call. They also verify that duplicate idempotent inserts report no new task and that the PostgreSQL claim query contains `FOR UPDATE SKIP LOCKED`.

---

## What comes next

Module 1.6 will add a worker action that turns an `attempt_confirmation_call` task into a Retell outbound call through Plivo. Module 1.8 will feed the call outcome back into this state machine to schedule retries, confirm, or escalate.
