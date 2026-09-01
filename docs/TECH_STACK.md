# Tech Stack

**Status:** Living document. Choices below are **locked** unless moved to `FUTURE_PROSPECTS.md`.  
**User-requested core:** React, FastAPI, LangChain, LangGraph, LangSmith.  
**From PRD + architecture diagrams:** Shopify, PostgreSQL, Retell AI, Plivo, TCS / PostEx / BlueEX.

---

## How to read this file

For each technology: **what it is**, **what problem it solves here**, **when it is a bad fit**, **what we would use instead**, **where it will live**.

That is the `rules.md` standard: never pick a library only because it is popular.

---

## 1. Application layers

### FastAPI (Python) — **locked**

**What:** Async Python web framework. Routes, dependency injection, Pydantic validation, OpenAPI.

**Problem it solves here:** One control plane for Shopify webhooks, Retell tool calls, React, courier APIs, and business rules.

**Use when:** You need an HTTP API with typed request/response models and many integrations.

**Avoid when:** The app is a simple script with no HTTP surface.

**Instead:** Django if you want batteries-included admin first; Node/Express if the team is JS-only. We are Python-first because the agents are Python (LangGraph).

**Where:** `backend/` — the only process allowed to mutate operational data.

---

### React — **locked (Phase 1 ops UI)**

**What:** UI library for the operations dashboard.

**Problem it solves here:** Humans need to see confirmation queues, retries, and escalations. FastAPI alone is not a usable ops desk.

**Use when:** Interactive internal UIs with polling/live lists.

**Avoid when:** A one-off script with no operators.

**Instead we did not choose:** HTMX/Jinja (thinner but not the agreed stack); Shopify admin only (cannot show our call attempts).

**Where:** `frontend/` talking only to FastAPI.

**Scope:** Phase 1 = order list + attempt history + escalation queue. Full analytics stays in `FUTURE_PROSPECTS.md`.

---

### PostgreSQL — **locked (PRD)**

**What:** Relational database. Our system of record for automation state.

**Problem it solves here:** Orders, call attempts, shipments, and workflow tasks need transactions, unique constraints, and idempotency keys.

**Use when:** Strong consistency and relational data matter (orders → items → calls).

**Avoid when:** You only need a cache or a document dump.

**Instead:** SQLite for local spike only; Mongo if the model were unstructured (it is not).

**Where:** `backend/database/` + Alembic (or equivalent) migrations.

---

## 2. Agent / LLM layer (user-requested)

### LangChain — **locked as the toolkit**

**What:** Building blocks for LLM apps: prompts, tools, document loaders, retrievers, output parsers.

**Problem it solves here:** Shared tool definitions, RAG ingestion for policies, structured outputs for shipping recommendations.

**Use when:** You compose LLM calls with tools and retrieval.

**Avoid when:** A single `chat.completions` call would suffice and you would only be wrapping it.

**Instead:** Direct OpenAI/Anthropic SDK for a one-shot prompt.

**Where:** Prompt templates, retrievers, tool schemas used by graphs.

**Mental model:** LangChain is the *parts bin*. LangGraph is the *assembly line* that runs those parts in a stateful graph.

---

### LangGraph — **locked for workflow agents**

**What:** Graph orchestration for agents: nodes, edges, state, checkpoints, human-in-the-loop, cycles (retries).

**Problem it solves here:** Confirmation retries and shipping courier choice are **state machines with branches**, not `prompt → answer`.

**Use when:** Explicit state, branching, cycles, resumability, or HITL.

**Avoid when:** The flow is `load → retrieve → generate → return` with no retries or approval.

**Instead:** Plain Python functions / FastAPI BackgroundTasks for a linear pipeline.

**Why this project:** Confirmation: no-answer → wait → retry. Shipping: compare couriers → recommend → rules → book or escalate. Both need durable state.

**Where:** `backend/agents/confirmation/`, `backend/agents/shipping/`, later `support/`.

**Phase 1 nuance:** Spoken dialogue stays on Retell. LangGraph orchestrates *call lifecycle and outcomes* on our side. Shipping (Phase 2) is a full LangGraph decision agent.

---

### LangSmith — **locked for agent observability**

**What:** Tracing, evaluation, and dataset tooling for LangChain/LangGraph runs.

**Problem it solves here:** PRD success metrics (tool failures, escalations, confirmation rate) need traces, not only print logs.

**Use when:** You must debug multi-step agent runs and compare prompt/graph versions.

**Avoid when:** There is no LLM/graph yet (then structured logs are enough).

**Instead:** Application logs + OpenTelemetry only. We still want those; LangSmith is extra for LLM graphs.

**Where:** Env `LANGCHAIN_TRACING_V2` / LangSmith project; wrap graph invocations.

---

## 3. Voice (from PRD + confirmation/support diagrams)

### Retell AI — **locked for voice agents**

**What:** Voice-agent platform: STT → LLM → TTS, barge-in, outbound/inbound calls, tool-calling webhooks, optional knowledge base.

**Problem it solves here:** Phone confirmation and inbound support. Building telephony + turn-taking ourselves would stall Phase 1.

**Use when:** Production voice UX matters more than owning the audio stack.

**Avoid when:** The agent is text-only (shipping).

**Instead:** Vapi (**dropped** — ignore it on the processing-flow diagram), or raw Plivo + custom STT/TTS (much more work).

**Where:** Confirmation + Support agents. FastAPI creates calls and exposes tools Retell invokes.

---

### Plivo — **locked as telephony (PRD)**

**What:** PSTN/SIP carrier. The phone network under Retell.

**Problem it solves here:** Actually ringing Pakistani (and other) mobile numbers.

**Use when:** You need real phone calls.

**Avoid when:** Dev-only: use Retell’s test/web call if available, no Plivo spend.

**Instead:** Twilio (common alternative). Stick to Plivo unless numbers/coverage fail.

**Where:** Configured in Retell; we do not send raw audio from FastAPI.

---

## 4. Commerce and logistics

### Shopify Admin API + Webhooks — **locked**

**What:** External system of record for the store.

**Events (Phase 1 start):** `orders/create`, later `orders/updated`, `orders/cancelled`, `refunds/create`.

**Where:** `backend/integrations/shopify/`. HMAC on every webhook.

---

### Courier APIs — TCS, PostEx, BlueEX — **Phase 2**

**What:** Pakistan-oriented last-mile APIs.

**Rule:** Only the Courier Integration Service (FastAPI) calls them. LangGraph outputs a recommendation object.

**Where:** `backend/integrations/couriers/{tcs,postex,blueex}/` behind one protocol.

---

## 5. RAG — **locked: our corpus + `search_knowledge`**

**What:** LangChain loaders → chunk → embed → retrieve. Retell calls FastAPI `search_knowledge(query)` and speaks from the returned snippets.

**Why this project:** Voice (confirmation/support) and later WhatsApp/text must share **one** policy/FAQ corpus. A Retell-only KB would duplicate and drift.

**Use this when:** Multiple channels need the same static knowledge.

**Avoid/reconsider when:** Voice latency from the extra tool hop is unacceptable — then we may *cache* snippets into the Retell prompt, still sourced from our store, not a second KB.

**Never put live orders, inventory, or tracking in the vector store.**

---

## 6. Jobs, cache, auth

| Piece | Choice | Notes |
|---|---|---|
| Delayed jobs | **Locked:** Postgres `workflow_tasks` + worker | Celery is a future prospect |
| Cache | Redis **only if** we later add Celery or shared rate-limits | Do not add Redis “for later” |
| Auth | JWT for React users; API keys/JWT for Retell tool callbacks | PRD: JWT/API auth |
| Migrations | Alembic | Standard with SQLAlchemy |
| HTTP client | httpx | Async Shopify/Retell/courier calls |

---

## 7. What we are deliberately not choosing (yet)

- **Vapi** — dropped. Diagram leftover only.
- **Celery + RabbitMQ** — not Phase 1; see `FUTURE_PROSPECTS.md`.
- **Retell Knowledge Base** — would duplicate our RAG.
- **Prepaid confirmation** — future; Phase 1 is COD-only.
- **WhatsApp** — Phase 4 / prospects.
- **Direct LLM → Shopify** — violates the control-plane rule.
- **Replacing Retell with LangGraph for the spoken turn loop in Phase 1** — wrong layer.

---

## 8. Phase 1 stack (what we actually install first)

```text
frontend:  React
backend: FastAPI, Pydantic, SQLAlchemy, Alembic, httpx
db:       PostgreSQL
agents:   LangChain, LangGraph, LangSmith
voice:    Retell + Plivo
commerce: Shopify Admin API + webhooks
jobs:     PostgreSQL workflow_tasks
rag:      LangChain retriever + search_knowledge tool
```

Phase 2 adds courier adapters. Phase 3 reuses voice + the same RAG tool. Later work is listed in `FUTURE_PROSPECTS.md`.
