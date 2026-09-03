# Project memory

Append-only working memory for this repo. Newest entries at the bottom of each section. Read this at the start of a session.

---

## How to use this file

- Record **decisions**, **open questions**, **what was built**, and **gotchas**.
- Do not duplicate the full architecture — point to `ARCHITECTURE.md`.
- After each module: what we learned + what must not be forgotten.

---

## Session log

### 2026-08-31 — Bootstrap (docs only, no code)

**Done**

- Read `rules.md` (learn-by-doing: one module at a time; teach What → Why → Where → Alternatives → Implement → Verify → Connect).
- Read `PRD.md` v1.0 and all four diagrams under `Architecture/`.
- Created `ARCHITECTURE.md`, `TECH_STACK.md`, `memory.md`.
- Did not edit PRD until the user answered the seven alignment questions.

**Build order:** Order Confirmation Agent first.

### 2026-08-31 — PRD v1.1 locked

**User answers**

1. React = yes (Phase 1 ops UI).
2. LangChain / LangGraph / LangSmith = yes.
3. RAG = our corpus + `search_knowledge` (shared with later text).
4. Drop Vapi.
5. Jobs = PostgreSQL `workflow_tasks`.
6. Shipping-as-Retell on the processing-flow diagram = mistake.
7. Phase 1 confirmation = COD-only (address, amount, intent to receive). Prepaid → future file.

**Done**

- Updated `PRD.md` to v1.1.
- Updated `ARCHITECTURE.md` and `TECH_STACK.md` to match.
- Created `FUTURE_PROSPECTS.md` (prepaid, Celery, WhatsApp, Vapi, analytics, …).

### 2026-08-31 — Monorepo Restructure & Modules 1.1/1.2

**Done**
- **Restructured** into a polyglot monorepo (`frontend/`, `backend/`, `docs/`).
- Initialized **React/Vite** dashboard in `frontend/`.
- Created **FastAPI** skeleton in `backend/` using `pydantic-settings`.
- Set up **PostgreSQL** in `docker-compose.yml`.
- Created **SQLAlchemy** models for `Order` and `Customer`.
- Set up **Alembic** migrations and applied them successfully to the database.

**Next:** Module **1.4 Shopify Admin read** or **1.5 Confirmation LangGraph**

---

## Decisions (accepted)

| ID | Decision | Why |
|---|---|---|
| D1 | FastAPI is the only executor of side effects | PRD core principle; agents request, backend validates |
| D2 | PostgreSQL is our operational system of record; Shopify remains commerce source of truth | We own calls/shipments/workflows |
| D3 | RAG is static knowledge only; live order/tracking/inventory via tools | Stale RAG would mislead customers |
| D4 | One missed call never rejects an order | PRD + confirmation architecture |
| D5 | Shipping agent is not a voice agent; AI must not call courier APIs directly | PRD; processing-flow Retell box is a diagram error (D12) |
| D6 | Teach-while-building per `rules.md` | User learning objective |
| D7 | Stack: React + FastAPI + LangChain + LangGraph + LangSmith | User instruction |
| D8 | React in Phase 1: confirmation queue, attempts, escalations — not full analytics | Agreed 2026-08-31 |
| D9 | Voice turns stay on Retell; LangGraph owns call lifecycle + shipping | Right layer for each problem |
| D10 | Single RAG: LangChain corpus + `search_knowledge` tool; no Retell KB | One corpus for voice and later text |
| D11 | Vapi is out | Extra vendor; diagram leftover |
| D12 | Ignore “Retell” on the shipping box in Order Processing Logic Flow | Diagram mistake |
| D13 | Workflow = PostgreSQL `workflow_tasks` + worker | Lean; Celery is a prospect |
| D14 | Phase 1 confirms **COD only**: address + amount + intent to receive | Business risk is unconfirmed COD |
| D15 | Prepaid and other deferred work live in `FUTURE_PROSPECTS.md` | Do not mix into Phase 1 modules |

---

## Open questions (need user)

| ID | Topic | Notes |
|---|---|---|
| Q9 | Vector store at RAG module: pgvector vs dedicated | Prefer pgvector if it fits; decide when we build 1.9 |
| Q10 | Embedding model / hosted vs local | Decide at module 1.9 |
| Q11 | LangSmith project name | Decide when first graph runs |

*(Q1–Q8 resolved 2026-08-31.)*

---

## Things to remember later

- Webhooks must be **idempotent** (Shopify retries).
- `confirm_order` and shipment booking must be **idempotent**.
- `confirm_order` for Phase 1 must persist evidence of address + amount + intent — not a bare boolean.
- Tool endpoints need auth; Retell must not get DB credentials.
- Minimize PII in prompts.
- Human queue: warm transfer if call is live, else ticket.
- Courier adapters: protocol + three implementations (TCS, PostEx, BlueEX).
- Multi-store is later but do not hard-code a single shop domain — use config.
- Pakistan couriers + COD are first-class.
- `search_knowledge` is the only static-knowledge path for Retell.
- `Architecture/Order Processing Logic Flow-*.png`: ignore Vapi and shipping-as-Retell.
- Prepaid scripts must not be bolted onto the COD prompt later without a payment-status branch.

---

## Module tracker

| Module | Status | Documentation & Notes |
|---|---|---|
| Docs: architecture / stack / memory / PRD v1.1 / prospects | done | 2026-08-31 |
| 1.1 FastAPI skeleton | done | [`docs/MODULE_1_1.md`](MODULE_1_1.md) — Polyglot monorepo structure, Pydantic BaseSettings, Vite React frontend. |
| 1.2 PostgreSQL order models | done | [`docs/MODULE_1_2.md`](MODULE_1_2.md) — SQLAlchemy 2.0 Async ORM, 3-point COD schema, Alembic migrations. |
| 1.3 Shopify webhook ingest | done | [`docs/MODULE_1_3.md`](MODULE_1_3.md) — HMAC-SHA256 signature verification and idempotent PostgreSQL upserts. |
| 1.4 Shopify Admin read | done | [`docs/MODULE_1_4.md`](MODULE_1_4.md) — Async GraphQL client with Client Credentials token exchange. |
| 1.5 Confirmation LangGraph + workflow_tasks | implemented | [`docs/MODULE_1_5.md`](MODULE_1_5.md) — Pure LangGraph state graph, dual-write elimination, `FOR UPDATE SKIP LOCKED`. |
| 1.6 Retell + Plivo outbound | implemented | [`docs/MODULE_1_6.md`](MODULE_1_6.md) — Async worker loop with lightweight HTTPX client for outbound telephony. |
| 1.7 Confirmation tool APIs incl. search_knowledge | implemented | [`docs/MODULE_1_7.md`](MODULE_1_7.md) — Constant-time auth `/tools/*`, 3-point COD confirmation, callbacks, human escalation. |
| 1.8 Retry on no-answer | implemented | [`docs/MODULE_1_8.md`](MODULE_1_8.md) — Tiered exponential backoff (2h/24h/48h), idempotent call-ended webhook, `UNREACHABLE` handling. |
| 1.9 Our LangChain RAG | implemented | [`docs/MODULE_1_9.md`](MODULE_1_9.md) — Qdrant vector database (Docker + in-memory fallback), dense semantic embeddings, policy docs. |
| 1.10 React confirmation queue | implemented | [`docs/MODULE_1_10.md`](MODULE_1_10.md) — Sleek light-mode SaaS UI, 3D interactive pipeline, live activity feed, audit drawer. |
| 1.11 LangSmith Evaluation & Benchmarking | done | [`docs/MODULE_1_11.md`](MODULE_1_11.md) — Golden datasets, guardrail evaluators (3-pt COD, 7-day refund, courier optimization), and regression test suite. |
| 2.1 Courier Domain Models & Adapters | implemented | [`docs/MODULE_2_1.md`](MODULE_2_1.md) — PostgreSQL shipment schema, `CourierAdapter` protocol, TCS/PostEx/BlueEX adapters and registry. |
| 2.2 Shipping LangGraph Decision Engine | implemented | [`docs/MODULE_2_2.md`](MODULE_2_2.md) — Pure LangGraph multi-courier selection, cost/SLA optimization, and exception routing. |
| 2.3 Automated Booking & Shopify Sync | implemented | [`docs/MODULE_2_3.md`](MODULE_2_3.md) — Courier booking execution, AWB persistence, Shopify fulfillment sync, and Dispatch UI tab. |
| 3.1 Support Models & Live Tool APIs | implemented | [`docs/MODULE_3_1.md`](MODULE_3_1.md) — Support tickets, complaints, 7-day refund guardrails, live tracking and inventory tools. |
| 3.2 Support LangGraph Conversational Engine | implemented | [`docs/MODULE_3_2.md`](MODULE_3_2.md) — Dual-knowledge router (static policy RAG vs live tools), sentiment analysis, and escalation. |
| 3.3 Support Helpdesk & Live Simulator | implemented | [`docs/MODULE_3_3.md`](MODULE_3_3.md) — React Support & Complaints desk tab and interactive web chat/voice customer simulator. |
| 4.1 Multi-Channel Messaging & Alerts | implemented | [`docs/MODULE_4_1.md`](MODULE_4_1.md) — WhatsApp Cloud API & SMS fallback, automated dispatch alerts with tracking links, two-way reply confirmation. |
| 4.2 Executive Analytics & Intelligence | implemented | [`docs/MODULE_4_2.md`](MODULE_4_2.md) — Real-time confirmation funnels, courier SLA/cost benchmarks, margin health, and support FCR. |
| 4.3 End-to-End Lifecycle Orchestrator | implemented | [`docs/MODULE_4_3.md`](MODULE_4_3.md) — Autonomous event cascade across Confirmation, Shipping, and Support + LangSmith observability. |
| 5.1 Interactive WhatsApp Two-Way Engine | done | [`docs/MODULE_5_1.md`](MODULE_5_1.md) — Meta Cloud API interactive buttons, webhook challenge, 3-branch reply routing (confirm/reschedule/cancel). |

---

## Lessons learned

_(Fill after we implement and after we break things on purpose, per `rules.md`.)_
