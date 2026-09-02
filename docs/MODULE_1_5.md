# Module 1.5 — Confirmation LangGraph and Workflow Tasks

## What we built

Module 1.5 adds the durable backend foundation for COD order confirmation. A
newly inserted Shopify order schedules one `attempt_confirmation_call` task in
PostgreSQL. A LangGraph state machine maps the order's confirmation state to a
safe next action.

This module does **not** place a real call. Retell/Plivo integration belongs to
Module 1.6; interpreting the provider's final call webhook belongs to Module
1.8.

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

## Concepts and decisions

### LangGraph is the decision layer

LangGraph represents a workflow as explicit state and transitions. Here it is
a small, deterministic state machine, not an in-call chatbot or an LLM.

**Use it when:** the workflow branches, retries, waits, or needs explicit
terminal states.

**Avoid it when:** work is one linear function with no meaningful state.

**Where it lives:** `backend/services/workflow/confirmation_graph.py`.

`backend/services/workflow/confirmation_service.py` is the integration seam:
it invokes the graph and moves only an eligible order from
`pending_confirmation` to `calling`. Module 1.6 will attach the Retell call
creation to that same transaction boundary.

### PostgreSQL workflow tasks are the durability layer

`workflow_tasks` records work to do later. Its idempotency key prevents the
same business event from creating duplicate tasks. The worker claim query uses
`FOR UPDATE SKIP LOCKED`, so concurrent workers do not claim the same task.

**Use it when:** a modest number of delayed jobs must survive API restarts.

**Reconsider it when:** volume or fan-out needs a dedicated broker; that is
when Celery/Redis becomes a justified future choice.

**Where it lives:** `backend/models/order.py` and
`backend/services/workflow/tasks.py`.

## Current state transitions

- `pending_confirmation` -> `schedule_call`
- `calling` -> `wait_for_call_outcome`
- `no_answer` or `busy` -> `schedule_retry`
- `callback_scheduled` -> `wait_for_callback`
- `confirmed` -> `start_shipping`
- `rejected`, `escalated`, or `unreachable` -> `stop`
- unknown states -> `needs_review` (never a call)

## Verification

Run the pure workflow tests with:

```powershell
py -3.11 -m pytest tests/test_confirmation_graph.py
```

The tests include an intentional invalid-status case. It proves an unexpected
provider state cannot accidentally schedule a customer call. They also verify
that duplicate idempotent inserts report no new task and that the PostgreSQL
claim query contains `FOR UPDATE SKIP LOCKED`.

## What comes next

Module 1.6 will add a worker action that turns an `attempt_confirmation_call`
task into a Retell outbound call through Plivo. Module 1.8 will feed the call
outcome back into this state machine to schedule retries, confirm, or escalate.
