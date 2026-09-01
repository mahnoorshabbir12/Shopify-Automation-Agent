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
- Created `FUTURE_PROSPEcripts.md` (prepaid, Celery, WhatsApp, Vapi, analytics, …).

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

| Module | Status | Notes |
|---|---|---|
| Docs: architecture / stack / memory / PRD v1.1 / prospects | done | 2026-08-31 |
| 1.1 FastAPI skeleton | done | Monorepo structure, Vite frontend |
| 1.2 PostgreSQL order models | done | Alembic migrations created and applied |
| 1.3 Shopify webhook ingest | done | HMAC validation and Idempotent DB upserts |
| 1.4 Shopify Admin read | done | Implemented async client with httpx |
| 1.5 Confirmation LangGraph + workflow_tasks | not started | |
| 1.6 Retell + Plivo outbound | not started | |
| 1.7 Confirmation tool APIs incl. search_knowledge | not started | |
| 1.8 Retry on no-answer | not started | |
| 1.9 Our LangChain RAG | not started | |
| 1.10 React confirmation queue | not started | |
| 1.11 LangSmith | not started | |

---

## Lessons learned

_(Fill after we implement and after we break things on purpose, per `rules.md`.)_
