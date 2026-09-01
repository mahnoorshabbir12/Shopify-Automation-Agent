# Architectural Plan — Shopify Automation Platform

**Status:** Living document. Update this file when a decision changes.  
**Primary source diagrams:** `Architecture/`  
**Product requirements:** `PRD.md` v1.1 (agreed 2026-08-31)  
**Deferred ideas:** `FUTURE_PROSPECTS.md`  
**Build method:** `rules.md` — one capability at a time, learn → implement → test → integrate.

---

## 1. Goal

Automate the Shopify order lifecycle for a COD-heavy store:

1. **Confirm** new orders by calling the customer.
2. **Ship** confirmed orders by choosing and booking a courier.
3. **Support** customers on voice (later messaging) for status, policies, complaints, and eligible refunds.

Humans stay in the loop when the agent cannot act safely.

**Core principle (from PRD):**

> AI decides and requests actions. FastAPI validates and executes them. Agents never write the database or call Shopify/courier APIs directly.

---

## 2. System shape

Three specialized agents share one FastAPI backend and one PostgreSQL database. A React ops dashboard lets humans watch queues, retries, and escalations.

```text
                         SHOPIFY
                    (orders, catalog, fulfillment)
                            │
                    webhooks + Admin API
                            │
                            ▼
                 ┌─────────────────────┐
                 │  FastAPI backend     │
                 │  validate / execute  │
                 │  business rules      │
                 └──────────┬──────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
  Confirmation         Shipping            Support
  (voice outbound)     (LangGraph)         (voice inbound)
         │                  │                  │
      Retell             Courier APIs       Retell
      + Plivo            TCS / PostEx       + Plivo
                         / BlueEX
                            │
                            ▼
                      PostgreSQL
                   (our system of record)
```

**Mental model:** Shopify owns commerce data. We own *operational state* (call attempts, agent actions, shipment decisions, complaints, workflow tasks). We sync status back to Shopify; we do not replace Shopify.

---

## 3. Data / control flow (end-to-end)

```text
Customer places order on Shopify
        → orders/create webhook
        → FastAPI (HMAC verify, idempotent ingest)
        → persist order + items in PostgreSQL (status: pending_confirmation)
        → enqueue confirmation job
        → Order Confirmation Agent (Retell outbound via Plivo)
        → customer confirms / rejects / no-answer / escalate
        → FastAPI tool (confirm_order) validates + writes
        → Shopify tag/status update
        → if CONFIRMED: enqueue shipping job
        → Shipping Agent (LangGraph) recommends courier
        → FastAPI rules engine approves
        → Courier Integration Service books
        → AWB stored; Shopify fulfillment created
        → Support Agent handles later inbound questions using RAG (static) + tools (live)
```

---

## 4. Agent 1 — Order Confirmation (Phase 1 — build this first)

### 4.1 Why this agent exists

COD orders that ship without a live confirmation have high return rates. A missed call must **never** cancel the order. Confirmation is a multi-attempt workflow with branching (confirm, reject, callback, escalate), not a single HTTP request.

### 4.2 Trigger

```text
Shopify orders/create → FastAPI webhook → persist → schedule outbound call
```

### 4.3 Voice path

```text
FastAPI  --create outbound call-->  Retell (STT → LLM → TTS)
                                         │
                                      Plivo (SIP / PSTN)
                                         │
                                      Customer phone
```

Retell owns conversation I/O (turn-taking, barge-in, voice). FastAPI owns truth (order state, retries, Shopify writes).

### 4.4 RAG vs tools

| Question type | Source | Why |
|---|---|---|
| Return policy, store hours, product FAQ | `search_knowledge()` → our LangChain RAG | One corpus for voice and later text |
| “Is this my order? What’s the total?” | `get_order()` | Live transactional data |
| Confirm / reject | `confirm_order()` | Must pass business rules |
| Call back later | `schedule_callback()` | Workflow, not RAG |
| “I want a person” | `transfer_to_human()` | Escalation |

**Rule:** RAG never answers order status, inventory, payment, or tracking.

### 4.5 Tools (Retell → FastAPI)

- `search_knowledge(query)`
- `get_order(order_id)`
- `get_customer(customer_id)`
- `get_product(product_id)`
- `confirm_order(order_id, outcome, notes)`
- `schedule_callback(order_id, when)`
- `transfer_to_human(order_id, reason)`

Every tool: auth → input validation → current-state check → business rules → idempotency → execute → log.

### 4.6 Confirmation graph (logical states) — COD only in Phase 1

`confirm_order` succeeds only when FastAPI records agreement on **address**, **COD amount**, and **intent to receive**. Prepaid confirmation is not built yet (`FUTURE_PROSPECTS.md`).

```text
NEW (COD)
  → CALLING
      → CONFIRMED          → address + amount + intent captured → shipping
      → REJECTED           → cancel / hold per rules
      → NO_ANSWER / BUSY   → workflow_tasks retry (attempt 2, 3, …)
      → CALLBACK_SCHEDULED → wait, then CALLING
      → ESCALATED          → human queue
      → UNREACHABLE        → only after retries exhausted
```

Retry policy is **configurable** (example from diagrams: ~2 hours, 1 day, 2 days). One miss does not reject.

### 4.7 LangGraph role in Phase 1

Retell already runs the spoken dialogue. We still use **LangGraph on our backend** for the *operational* confirmation workflow: ingest → attempt call → interpret call outcome webhook → branch (retry / confirm / escalate). That graph is checkpointed, observable in LangSmith, and reusable when we add SMS/WhatsApp later.

We do **not** replace Retell’s in-call LLM with LangGraph in Phase 1 unless Retell’s tool-calling proves insufficient.

---

## 5. Agent 2 — Shipping (Phase 2)

**Not a voice agent. Not Retell.** The processing-flow diagram that draws shipping as a Retell box is a **documented mistake** — do not implement it. Triggered only after COD `CONFIRMED`.

```text
CONFIRMED
  → Shipping LangGraph
      → load order + address + items
      → fetch rates (TCS, PostEx, BlueEX) via FastAPI integration layer
      → compare cost, time, COD, coverage, business prefs
      → emit RecommendedCourier (not a booking)
      → FastAPI Business Rules Engine (must pass)
      → Courier Integration Service books
      → persist AWB + tracking
      → Shopify fulfillment
      → notify customer
```

**AI never calls courier APIs.** Failures (no courier, AI cannot decide, rules fail, invalid address, API error) go to **Human Review Queue**.

Courier adapter pattern: one interface, one adapter per courier, so adding a fourth courier does not rewrite the graph.

---

## 6. Agent 3 — Customer Support (Phase 3)

Inbound voice: Customer → Plivo → Retell Support Agent.

Same split:

- Static policy/product → `search_knowledge()` (same corpus as confirmation)
- Live order/tracking/refund → FastAPI tools + Shopify/courier

Tools: `get_customer`, `get_order`, `get_order_status`, `get_tracking_info`, `get_product`, `get_inventory`, `create_complaint`, `request_refund`, `transfer_to_human`.

Refunds and Shopify mutations always go through the rules engine.

---

## 7. FastAPI backend (control plane)

FastAPI is the only component allowed to:

- verify Shopify HMAC webhooks
- mutate PostgreSQL operational tables
- call Shopify Admin API
- call courier APIs
- create Retell outbound calls
- enforce authn/authz on agent tools

Suggested layout (from PRD, kept):

```text
backend/
├── api/            # HTTP: shopify, agents, orders, shipments, support, dashboard
├── agents/         # LangGraph graphs: confirmation, shipping, support
├── integrations/   # shopify, retell, plivo, couriers/{tcs,postex,blueex}
├── services/       # order, shipment, support, workflow
├── models/ schemas/ database/ core/
└── main.py
```

React talks only to FastAPI, never to Shopify or Retell directly.

---

## 8. Persistence

**Shopify:** source of truth for catalog, checkout, and merchant-facing order/fulfillment.

**PostgreSQL:** system of record for automation:

- users, customers (cached/synced)
- orders, order_items, products (synced snapshots)
- calls, call_attempts, call_events
- complaints, refunds
- shipments, couriers, courier_rates, tracking_events
- agent_sessions, agent_actions
- workflow_tasks

Idempotency keys on webhooks and on `confirm_order` / `book_shipment` so retries cannot double-confirm or double-book.

---

## 9. Workflow / jobs

**Agreed:** PostgreSQL `workflow_tasks` + a worker that claims due rows. Survives process restarts; no Redis/Celery in Phase 1.

**Use this when:** Delayed retries and a small number of workers.

**Avoid/reconsider when:** Task volume or fan-out needs a dedicated broker — then Celery (`FUTURE_PROSPECTS.md`).

**Not choosing:** FastAPI BackgroundTasks (lost on restart); Celery on day one (ops cost we do not need yet).

---

## 10. React ops UI (Phase 1 — agreed)

Purpose: humans need a queue, not only APIs. Dashboard calls FastAPI only.

Phase 1 screens:

- Orders awaiting confirmation + attempt history
- Live/recent calls
- Escalation / human queue
- Retry configuration (read, later edit)

Later: shipment exceptions, support tickets, analytics (PRD Phase 4).

---

## 11. Observability

- Application logs (FastAPI)
- Agent traces (LangSmith) for LangGraph nodes and tool calls
- Call outcomes from Retell webhooks (duration, no-answer, transcript pointer)
- Shopify and courier API failure counters

---

## 12. Security (non-negotiable)

- Secrets in env, never in prompts or the repo
- Shopify webhook HMAC on every request
- Agent tool endpoints authenticated (API key / JWT)
- Role-based access for the React dashboard
- Agents cannot hold DB credentials
- Minimize PII in LLM prompts (order id + needed fields, not full dumps)

---

## 13. Human escalation

Escalate when: customer asks; low confidence; angry customer; refund over limit; courier refusal; API failure; rules require approval; anything sensitive.

Warm transfer when a live call is in progress; otherwise a ticket in the human queue.

---

## 14. Build sequence (learn-by-doing modules)

Do not skip a module until it can be explained: what, why, alternatives, what breaks if removed.

### Phase 1 — Order Confirmation

| Module | Capability |
|---|---|
| 1.1 | FastAPI app skeleton + config/secrets pattern |
| 1.2 | PostgreSQL + order/customer models |
| 1.3 | Shopify webhook ingest (`orders/create`) + HMAC + idempotency |
| 1.4 | Shopify Admin API read (order, customer, product) |
| 1.5 | Confirmation LangGraph states + workflow_tasks |
| 1.6 | Retell outbound call + Plivo |
| 1.7 | Tool APIs for the voice agent |
| 1.8 | Call-ended webhook → retry / confirm / escalate |
| 1.9 | Our LangChain RAG + `search_knowledge` |
| 1.10 | React: confirmation queue + escalation list |
| 1.11 | LangSmith tracing |

### Phase 2 — Shipping

Courier adapters, LangGraph decision, rules engine, book, AWB, Shopify fulfillment, human review queue.

### Phase 3 — Support

Inbound Retell agent, same RAG tool, live tools, complaints/refunds.

### Phase 4 — Advanced

See `FUTURE_PROSPECTS.md`: WhatsApp, prepaid, analytics, multi-store, Celery if needed.

---

## 15. Agreed decisions (2026-08-31)

1. React Phase 1 ops UI — yes.
2. LangChain / LangGraph / LangSmith — yes. Voice turns stay on Retell; graphs own lifecycle and shipping.
3. RAG = our corpus + `search_knowledge` — no Retell KB, no dual store.
4. Vapi — dropped. Ignore it on the processing-flow diagram.
5. Jobs = PostgreSQL `workflow_tasks`.
6. Shipping as Retell on that diagram — mistake; shipping is LangGraph only.
7. Phase 1 confirmation is **COD-only** (address, amount, intent to receive). Prepaid → `FUTURE_PROSPECTS.md`.

---

## 16. Where this file is used

Before any implementation session: read this file + `memory.md` + `PRD.md` + the relevant `Architecture/` diagram. After a decision: update section 15 and the matching agent section.
