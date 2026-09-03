# Module 3.2 — Customer Support LangGraph Conversational State Machine

## What we built
Module 3.2 builds the autonomous conversational brain for **Agent 2 (The Customer Support Agent)** using a LangGraph state machine.
It fulfills PRD Requirement: **"Customer Support Agent: handles customer questions, order issues, complaints, tracking requests, and eligible refund requests... Single RAG: LangChain corpus for static policy only; live data via FastAPI tools."**

Key accomplishments:
1. **SupportGraphState (`backend/agents/support/state.py`):**
   - Typed dictionary maintaining user utterance, extracted order numbers, intent classification, sentiment & frustration scoring, tool results, active ticket IDs, and voice output.
2. **Intent Classification & Frustration Scoring (`backend/agents/support/nodes.py`):**
   - Implemented `classify_intent_node()`:
     - **Sentiment/Frustration Detector:** Catches profanity, distress keywords, or explicit demands for human escalation, setting `intent="ESCALATE"` and `is_frustrated=True`.
     - **Static Policy Inquiries:** Identifies return policy, delivery timelines, and store terms, routing to `POLICY_FAQ`.
     - **Live WISMO Queries:** Extracts order IDs (`#10482`, `10482`, `order-10482`) and routes to `WISMO_TRACKING`.
     - **Actionable Refunds & Complaints:** Routes grievances to `COMPLAINT` and return claims to `REFUND`.
     - **Inventory Queries:** Routes stock questions to `PRODUCT_INQUIRY`.
3. **Dual-Knowledge Router Action Node:**
   - **Static Path:** Invokes `KnowledgeService.search_knowledge()` over the Qdrant vector collection (`store_policies`).
   - **Dynamic Path:** Invokes live domain tools (`get_tracking_info`, `request_refund`, `create_complaint`, `get_inventory`).
   - **Escalation Path:** Generates reassuring, empathetic transfer messages.
4. **Interactive Chat Simulation Endpoint:**
   - Exposed `POST /api/v1/support/chat` allowing the React dashboard to test real-time customer support queries.
5. **Automated Test Suite (`tests/test_support_graph.py`):**
   - 8 unit tests covering regex order extraction, intent routing, frustration triggers, policy RAG resolution, and chat simulation (all passed).

---

## Concepts and decisions

### The Dual-Knowledge Architecture (RAG vs Tools)
One of the most frequent points of failure in AI agent implementations is treating all questions identically.
If an agent uses RAG for order status, it will retrieve stale or hallucinated data.
If an agent writes database tools for every general FAQ, engineering teams must endlessly code API endpoints for basic questions like *"What are your store hours?"*.
The **Dual-Knowledge Architecture** cleanly separates concerns:
- **Static Knowledge (RAG):** Store policies, warranty clauses, shipping SLAs, COD rules → served by Qdrant vector search.
- **Transactional State (Tools):** Live parcel location, current warehouse stock, order totals → served by deterministic database/API tools.

### Deterministic Sentiment & Escalation Gate
In customer service, an angry customer should never be trapped in an AI loop.
`classify_intent_node` evaluates user vocabulary and sentiment:
- If high frustration or legal/fraud keywords are detected, the graph immediately branches to `ESCALATE`.
- It stops automated bot banter and generates a polite, priority transfer response, preventing brand reputation damage.

---

## Architecture Flow

```text
                     Incoming Customer Utterance
                     ("Where is my order #10482?")
                                  │
                                  ▼
                    ┌────────────────────────────┐
                    │    classify_intent_node    │
                    └─────────────┬──────────────┘
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       │                          │                          │
 [Frustrated / Human]       [Policy / FAQ]          [Live Transactional]
       │                          │                          │
       ▼                          ▼                          ▼
 ┌───────────────┐         ┌───────────────┐          ┌───────────────┐
 │ ESCALATE Node │         │ Qdrant Vector │          │ Live Tools    │
 │ (Warm Handoff │         │ RAG Retriever │          │ (Tracking,    │
 │  to Operator) │         │ (Store Rules) │          │  Refund, Stock│
 └───────┬───────┘         └───────┬───────┘          └───────┬───────┘
         │                         │                          │
         └─────────────────────────┼──────────────────────────┘
                                   │
                                   ▼
                    ┌────────────────────────────┐
                    │   formulate_response_node  │
                    │   (Voice/Text Synthesis)   │
                    └────────────────────────────┘
```

---

## Approach Used & Why

### Chosen Approach: Pure StateGraph Router with Dynamic Action Dispatch
- **Why this approach:**
  1. **Sub-10ms Latency:** Avoids expensive multi-turn LLM reasoning chains for straightforward customer queries.
  2. **Zero Hallucinations on Live Data:** Order tracking checkpoints are pulled directly from courier APIs/PostgreSQL, not guessed by an LLM.
  3. **High-Value Escalation:** Frustrated customers are immediately routed to human intervention.

### Pros & Cons
| Pros | Cons |
|---|---|
| Eliminates voice conversational latency through direct deterministic intent routing. | Edge-case user slang or unusual phrasing may require expanding keyword mappings. |
| Clean separation between static policies (RAG) and dynamic parcels (tools). | Live stock lookup requires maintaining Shopify API connection. |
| Prevents customer rage by providing an instant human escalation path. | Does not negotiate custom discount exceptions autonomously. |

---

## Transferable Real-World Use Cases

### Where to Implement This Approach
1. **Omnichannel Retail Support:** Routing customer messages across WhatsApp, Instagram DM, and Voice between knowledge bases and inventory systems.
2. **Fintech Support Bots:** Separating general banking policies (interest rates, branch locations) from transactional state (account balance, blocked cards).
3. **Healthcare Patient Portals:** Separating hospital visiting hours (RAG) from live prescription refills and doctor appointment bookings (tools).

### When NOT to Use This Approach
- Purely conversational companionship bots where deterministic business rules and transactional databases are irrelevant.

---

## Code Pointers
- `backend/agents/support/state.py`: `SupportGraphState` TypedDict.
- `backend/agents/support/nodes.py`: Intent classifier, RAG dispatcher, and tool executor.
- `backend/agents/support/graph.py`: Compiled Support LangGraph.
- `backend/api/endpoints/support_tools.py`: `POST /api/v1/support/chat` simulation route.
- `tests/test_support_graph.py`: Automated unit test suite (all passed).
