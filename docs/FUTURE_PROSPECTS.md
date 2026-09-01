# Future prospects

Ideas that are **in scope for the product eventually** but **out of the current build**. Do not implement these while Phase 1 COD confirmation is incomplete.

When we pick one up: move it into `PRD.md` / `ARCHITECTURE.md`, add a module in `memory.md`, and treat it as a new learn-by-doing loop.

---

## How to add an item

1. Name the capability.
2. Why we deferred it.
3. What must already exist before it is safe to start.
4. Rough shape (not a spec).

---

## Payment / confirmation

### Prepaid / already-paid orders

**Deferred because:** Phase 1 is COD-only. Confirmation on a call must prove **address**, **amount**, and **intent to receive**. Prepaid orders are already financially captured; calling them is a different script (thank-you, address check, delivery window) and different Shopify financial states.

**Start only after:** COD confirmation is in production: webhooks, retries, `confirm_order` rules, React queue.

**Likely shape:**

- Detect `financial_status` / gateway (paid vs pending COD).
- Skip COD amount confirmation; still verify address if needed.
- Optional: shorter call or SMS instead of a full voice loop.
- Do not auto-ship prepaid without the same address/intent rules the business wants.

### Other payment methods

Bank transfer, wallets, partial payments, abandoned checkout recovery — not designed yet.

---

## Voice / channels

### Vapi

**Dropped.** Processing-flow diagram leftover. Do not add a second voice vendor unless Retell cannot place calls in a required region.

### WhatsApp / SMS as primary support

PRD Phase 4. Same FastAPI tools + same RAG (`search_knowledge`). New channel adapter only.

### In-call LangGraph (replace Retell’s LLM)

Only if Retell tool-calling or latency blocks us. Default remains: Retell = spoken turns; LangGraph = lifecycle + shipping.

---

## Infrastructure

### Celery + Redis / RabbitMQ

**Deferred because:** Postgres `workflow_tasks` is enough for confirmation retries.

**Start only after:** the worker cannot keep up, or we need complex fan-out/rate limits across many stores.

### Redis cache

Do not add “for later.” Add when we have a measured hot path (Shopify rate limits, embeddings cache).

### Multi-store / multi-tenant

Config should not hard-code one shop domain, but full tenant isolation, billing, and per-store prompts are later.

---

## Shipping & support extras

### Extra couriers beyond TCS / PostEx / BlueEX

Adapter protocol should make this additive. Do not build a fourth adapter until three work.

### Advanced courier optimization

ML on historical cost/time; after we have booking data.

### Partial refunds, exchanges, RMA portal

Support Phase 3 is voice + tools + rules. A customer-facing returns portal is later.

---

## Product / UI

### Full analytics dashboard

Phase 1 React is **ops lists** (queue, attempts, escalations). Charts, confirmation-rate trends, courier cost dashboards wait until events are logged reliably (LangSmith + our tables).

### Automated marketing / abandoned cart

Out of the three-agent ops scope unless product goal expands.

---

## Parking lot (one-liners)

- Human live-monitor / barge-in on calls
- Number pooling / caller-ID reputation
- Local embeddings vs hosted embeddings (decide at RAG module)
- Vector DB choice (pgvector vs dedicated) — decide at RAG module, prefer pgvector if it fits Postgres
- Evaluation datasets in LangSmith for confirmation transcripts
- **Shopify Webhook Schema Expansion**: Phase 1 schemas for the webhook ingest only extract fields needed for confirmation (Customer Name/Phone/Email, Order ID/Total/Currency/Address). Future phases (Shipping, Returns) will require expanding the Pydantic models to include line items, product variants, weights, and fulfillment statuses.
