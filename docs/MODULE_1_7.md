# Module 1.7 — Voice Agent Tool APIs & Static Knowledge

## What we built

Module 1.7 adds the HTTP endpoints that the Retell AI voice agent invokes during a live telephone call. These endpoints allow the voice agent to:
1. Fetch live order and customer details (`POST /tools/get-order`).
2. Strictly enforce Phase 1 COD confirmation rules (`POST /tools/confirm-order`).
3. Schedule a follow-up callback task (`POST /tools/schedule-callback`).
4. Escalate complex or disputed calls to a human agent (`POST /tools/transfer-to-human`).
5. Answer customer store and policy questions using static knowledge (`POST /tools/search-knowledge`).

All tool endpoints are protected by `verify_tool_api_key` using constant-time comparison on the `X-Tool-Api-Key` or `Authorization: Bearer <key>` header.

---

## Architectural decisions & tradeoffs

### Decision 1: Dedicated REST Endpoints vs. Single Webhook Dispatcher
- **Approach Chosen:** Dedicated endpoints under `/tools/*` (`/tools/get-order`, `/tools/confirm-order`, etc.).
- **Pros:** Full OpenAPI schema self-documentation, native FastAPI & Pydantic request/response validation, explicit HTTP status codes, straightforward isolated unit testing.
- **Cons:** Requires configuring individual tool URLs in Retell dashboard instead of one single catch-all URL.
- **Why this was chosen:** Retell supports per-tool endpoint URLs. Having explicit Pydantic models provides immediate type safety, informative validation errors returned to the LLM, and avoids complex dispatcher boilerplate.

### Decision 2: Authentication via Header-based API Key
- **Approach Chosen:** Static shared secret passed via `X-Tool-Api-Key` or Bearer header, checked using `secrets.compare_digest`.
- **Pros:** Sub-millisecond validation time, zero database queries for auth, robust against timing attacks, aligns with Retell's custom tool header configuration.
- **Cons:** Secret rotation requires updating `.env` and Retell tool config.
- **Why this was chosen:** Retell has strict real-time audio latency requirements (<300ms per turn). Dynamic OAuth handshakes would add unacceptable voice turn latency mid-call.

### Decision 3: Multi-attribute COD Evidence vs. Bare Boolean
- **Approach Chosen:** Multi-attribute evidence capture (`is_address_confirmed`, `is_amount_confirmed`, `intent_to_receive`).
- **Pros:** Guarantees that an order is only marked `CONFIRMED` if the customer explicitly confirmed all three dimensions. Prevents LLM hallucinations from creating unverified courier shipments, directly protecting against costly Return-to-Origin (RTO) expenses.
- **Cons:** Requires the voice prompt on Retell to instruct the agent to verify each dimension.
- **Why this was chosen:** High courier RTO is the greatest risk in Pakistani COD e-commerce. Storing explicit evidence on the `Order` record ensures auditability and operational safety.

### Decision 4: Modular KnowledgeService Interface
- **Approach Chosen:** Implemented `KnowledgeService` with structured policy retrieval for `/tools/search-knowledge`.
- **Pros:** Makes the tool immediately functional for voice calls. In Module 1.9, the internal implementation will be upgraded to LangChain RAG vector embeddings without changing the API contract or Retell tool definition.
- **Cons:** Initial matching uses keyword/token heuristics rather than dense vector cosine similarity.
- **Why this was chosen:** Preserves the phased roadmap (1.7 = Tool APIs, 1.9 = LangChain RAG) while ensuring zero contract churn later.

---

## Transferable Real-World Use Cases

### Where to Implement This Approach
1. **AI Voice Banking & Funds Transfer:** Verifying phone banking transactions where the voice agent must explicitly confirm the recipient account, transfer amount, and customer authorization before invoking the core banking ledger API.
2. **Medical & Telehealth Prescription Dispatch:** Confirming patient delivery address, medication dosage confirmation, and explicit patient consent before dispatching sensitive pharmaceuticals.
3. **High-Value B2B Freight Logistics:** Voice verification of warehouse loading bay availability, consignment weight limits, and driver pickup appointments.

### When NOT to Use This Approach
- Low-stakes conversational chatbots (e.g. casual small-talk bots) where strict structured attribute verification is unnecessary.
- Systems requiring public unauthenticated access where static header-based keys cannot be kept confidential.

---

## Architecture Flow

```text
Retell AI Voice Call
  │
  ├── Customer asks: "What is your return policy?"
  │     └─► POST /tools/search-knowledge ──► KnowledgeService ──► Snippets returned
  │
  ├── Agent asks: "Is your address House 12, DHA Phase 5?"
  │     └─► POST /tools/get-order ─────────► ToolService ───────► Live Order Data
  │
  ├── Customer confirms address, COD amount, and intent to receive:
  │     └─► POST /tools/confirm-order ─────► ToolService ───────► Status: CONFIRMED
  │                                                               (is_address_confirmed=True)
  │                                                               (is_amount_confirmed=True)
  │                                                               (intent_to_receive=True)
  │
  ├── Customer says: "I'm driving, call me in 2 hours":
  │     └─► POST /tools/schedule-callback ─► ToolService ───────► Status: CALLBACK_SCHEDULED
  │                                                               (+ WorkflowTask enqueued)
  │
  └── Customer is hostile or disputes price:
        └─► POST /tools/transfer-to-human ─► ToolService ───────► Status: ESCALATED
```

---

## Verification

Run the dedicated test suite:
```powershell
set PYTHONPATH=. && py -3.11 -m pytest tests/test_tool_apis.py -v
```

All 13 tests verify:
- Authentication rejection on missing/invalid keys and acceptance of valid keys.
- Accurate retrieval of live order details.
- 3-point COD confirmation validation, rejection handling, address correction, and idempotency.
- Callback scheduling with durable `WorkflowTask` creation.
- Human escalation marking status `ESCALATED`.
- Knowledge search returning relevant policy snippets.

---

## What comes next

**Module 1.8 — Retry on no-answer**: Processing Retell's call-ended webhook, handling unanswered/busy calls, calculating backoff delays, and scheduling retry call attempts in PostgreSQL until the attempt limit is reached.
