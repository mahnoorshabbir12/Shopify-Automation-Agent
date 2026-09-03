# Module 1.6 — Retell + Plivo Outbound Call

## What we built

Module 1.6 introduces the background worker and API integration required to actually place the outbound COD confirmation phone call. We added:
1. `RetellClient`: A lightweight async HTTP client using `httpx` to trigger a call via Retell API.
2. `worker.py`: A long-running process that claims due PostgreSQL workflow tasks, verifies eligibility via the LangGraph state machine, and places the call.

## Architecture flow

```text
Shopify webhook
  -> HMAC validation
  -> idempotent order insert
  -> workflow_tasks row (attempt 1)
  [NEW] -> worker.py loop wakes up
  [NEW] -> claim_due_workflow_tasks (FOR UPDATE SKIP LOCKED)
  [NEW] -> LangGraph decides next action (schedule_call)
  [NEW] -> RetellClient POST to api.retellai.com/v2/create-phone-call
```

## Concepts and decisions

### The Custom Worker Loop vs. Celery

We built a simple `while True` loop in `worker.py` that relies on `claim_due_workflow_tasks` rather than introducing a message broker like Redis + Celery.

**Use it when:** task volume is moderate, you want to avoid dual-write inconsistencies, and you already rely heavily on a relational database (PostgreSQL) for transactional integrity.
**Avoid it when:** you need massive fan-out, heavy computation (e.g., long machine learning jobs), or rate-limiting across thousands of distributed workers. Here, we would introduce Celery/Redis.

### HTTPX Async Client vs. Vendor SDK

We opted to write a small `RetellClient` using `httpx` rather than installing the official `retell-sdk`.

**Use it when:** the API surface area you are interacting with is tiny (just one endpoint `create-phone-call`), you want strict control over timeouts and async execution, and you want to minimize your dependency tree.
**Avoid it when:** the vendor SDK handles complex authentication logic (like OAuth refresh tokens), difficult pagination, or automatic retry logic that you don't want to maintain.

## Configuration

For this to work in production, three environment variables were added:
- `RETELL_API_KEY`: The API key from your Retell dashboard.
- `RETELL_AGENT_ID`: The ID of the specific Voice Agent configured in Retell.
- `PLIVO_PHONE_NUMBER`: The outbound phone number (configured via Plivo and connected to Retell).

## Verification

Run the pure logic tests for the worker and Retell client with:

```powershell
set PYTHONPATH=. && py -3.11 -m pytest tests/test_worker.py
```

The tests use mocking to verify that:
1. Eligible orders successfully trigger `retell_client.create_phone_call`.
2. Ineligible orders (e.g., already `confirmed`) bypass the API call and immediately fail/complete the task, preventing accidental spam calls to customers.

## What comes next

Module 1.7 will introduce the endpoints that the Retell Voice Agent will call *during* the conversation, specifically the tool APIs including `search_knowledge` (RAG).
