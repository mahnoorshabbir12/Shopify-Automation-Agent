# Module 1.6 — Retell + Plivo Outbound Call

## What we built

Module 1.6 introduces the background worker and API integration required to actually place the outbound COD confirmation phone call. We added:
1. `RetellClient`: A lightweight async HTTP client using `httpx` to trigger a call via Retell API (`backend/integrations/retell/client.py`).
2. `worker.py`: A long-running process that claims due PostgreSQL workflow tasks, verifies eligibility via the LangGraph state machine, and places the call.

---

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

---

## Concepts and decisions

### The Custom Worker Loop vs. Celery

We built a simple `while True` loop in `worker.py` that relies on `claim_due_workflow_tasks` rather than introducing a message broker like Redis + Celery.

- **Use it when:** task volume is moderate, you want to avoid dual-write inconsistencies, and you already rely heavily on a relational database (PostgreSQL) for transactional integrity.
- **Avoid it when:** you need massive fan-out, heavy computation (e.g., long machine learning jobs), or rate-limiting across thousands of distributed workers. Here, we would introduce Celery/Redis.

### HTTPX Async Client vs. Vendor SDK

We opted to write a small `RetellClient` using `httpx` rather than installing the official `retell-sdk`.

- **Use it when:** the API surface area you are interacting with is tiny (just one endpoint `create-phone-call`), you want strict control over timeouts and async execution, and you want to minimize your dependency tree.
- **Avoid it when:** the vendor SDK handles complex authentication logic (like OAuth refresh tokens), difficult pagination, or automatic retry logic that you don't want to maintain.

---

## Approach Used & Why

### Chosen Approach: Custom Asyncio Worker Loop + Lightweight HTTPX Client
- **Why this approach:**
  1. **Zero External Broker Dependency:** Instead of introducing a complex Redis + Celery or RabbitMQ cluster, our lightweight `worker.py` polls `workflow_tasks` using `FOR UPDATE SKIP LOCKED`. This keeps development and deployment simple, eliminates broker licensing/hosting costs, and guarantees that work is driven directly by our single source of truth (PostgreSQL).
  2. **Lean HTTPX Client over Heavy SDKs:** The Retell API interaction requires only one endpoint (`POST /v2/create-phone-call`). Writing a focused 50-line async client with `httpx` gives us total control over connection timeouts, header formatting, and unit test mocking without pulling in unnecessary third-party dependencies.

### Pros & Cons
| Pros | Cons |
|---|---|
| Zero additional infrastructure overhead (no Redis, Celery, or RabbitMQ to manage). | Polling interval introduces a small configurable delay (e.g. 2–5 seconds). |
| Minimal dependency footprint; zero vulnerability exposure from unused SDK features. | Does not provide automatic distributed rate limiting out-of-the-box. |
| Clean separation between the web API service and the background worker process. | Requires running a second process (`python -m backend.worker`). |

---

## Transferable Real-World Use Cases

### Where to Implement This Approach
1. **SMS & Push Notification Dispatchers:** Polling scheduled promotional or transactional notifications and delivering them via Twilio, AWS SNS, or Firebase Cloud Messaging.
2. **Transactional Email Workers:** Sending welcome emails, password reset links, or invoice PDFs via SendGrid or Postmark with retry tracking.
3. **Third-Party Webhook Fan-Out:** Forwarding incoming platform events to external subscriber webhooks with exponential backoff on failure.
4. **IoT Firmware Update Checkers:** Device telemetry gateways that check for overdue pings or trigger diagnostic commands.

### When NOT to Use This Approach
- Highly distributed systems with thousands of worker nodes requiring dynamic auto-scaling and complex priority queuing (use Celery, Temporal, or AWS SQS).
- Scenarios where immediate microsecond latency execution is strictly required (use an in-memory event bus or WebSocket stream).

---

## Configuration

For this to work in production, three environment variables are configured:
- `RETELL_API_KEY`: The API key from your Retell dashboard.
- `RETELL_AGENT_ID`: The ID of the specific Voice Agent configured in Retell.
- `PLIVO_PHONE_NUMBER`: The outbound phone number (configured via Plivo and connected to Retell).

---

## Verification

Run the pure logic tests for the worker and Retell client with:
```powershell
set PYTHONPATH=. && py -3.11 -m pytest tests/test_worker.py -v
```

The tests verify that:
1. Eligible orders successfully trigger `retell_client.create_phone_call`.
2. Ineligible orders (e.g., already `confirmed`) bypass the API call and immediately complete the task, preventing accidental spam calls to customers.

---

## What comes next

Module 1.7 introduces the endpoints that the Retell Voice Agent invokes *during* the conversation, specifically the tool APIs including `search_knowledge` (RAG).
