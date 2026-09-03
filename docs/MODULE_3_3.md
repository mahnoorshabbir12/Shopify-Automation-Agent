# Module 3.3 — Customer Support Helpdesk & Interactive AI Simulator

## What we built
Module 3.3 completes **Phase 3 (Agent 2: Customer Support Agent)**.
It brings together the support database ledger, the LangGraph conversational decision engine, and the live tool APIs into an intuitive, real-time command desk for e-commerce warehouse operators:

Key accomplishments:
1. **Support & Complaints Desk in Operations Console (`frontend/src/components/OperationsConsole.tsx`):**
   - Added mode button: `3. Support & Complaints (Phase 3)` to the top switcher.
   - **Support Tickets Ledger:** Live table displaying customer ticket numbers (`TICK-#####`), categories (`WISMO`, `COMPLAINT`, `REFUND`, `PRODUCT_INQUIRY`), priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), descriptions, and status (`OPEN`, `RESOLVED`, `ESCALATED`).
   - **Operator Action Buttons:** Direct `Resolve ✓` button with instant optimistic UI update and database synchronization.
2. **Interactive AI Customer Support Simulator:**
   - Real-time conversational test environment embedded directly in the dashboard.
   - **Quick-Prompt Chips:** One-click simulation for common customer intents:
     - *"Where is order #10482?"* (WISMO Tracking)
     - *"What is your return policy?"* (Qdrant RAG Static Retrieval)
     - *"Do you have lawn suits in stock?"* (Shopify GraphQL Inventory Query)
     - *"My perfume arrived broken"* (Complaint Registration & Ticket Creation)
     - *"I want a refund for #10481"* (7-Day Policy Guardrail Validation)
     - *"Transfer to human agent"* (Sentiment Analysis & Immediate Escalation)
   - Real-time display of classified **Intent Badges**, **Active Ticket IDs**, and **Generated Speech Responses**.
3. **End-to-End Test Suite:**
   - Full regression test suite passing across all 3 phases.

---

## Concepts and decisions

### The Need for an In-Console AI Simulator in Production SaaS
When deploying conversational AI agents to production, operators and QA engineers need to test and verify how the agent will respond to various edge cases without placing actual phone calls or incurring telephony billing.
The **In-Console Simulator** directly queries the same `POST /api/v1/support/chat` endpoint and LangGraph state machine used by Retell voice webhooks.
This allows store operators to:
- Instantly verify policy changes after updating markdown policy docs.
- Test tracking resolution across different couriers (TCS vs PostEx vs BlueEX).
- Confirm that angry customers are escalated appropriately.

---

## Architecture Flow

```text
               Interactive Simulator Input (or Voice Inbound)
                                      │
                                      ▼
                       POST /api/v1/support/chat
                                      │
                                      ▼
                      Support LangGraph State Machine
                         (Classify Intent & Sentiment)
                                      │
               ┌──────────────────────┼──────────────────────┐
               ▼                      ▼                      ▼
        [Live Tool Call]       [Qdrant RAG Search]     [Human Escalation]
        (Tracking/Refund)        (Store Policies)        (Urgent Handover)
               │                      │                      │
               └──────────────────────┼──────────────────────┘
                                      │
                                      ▼
                     Support Ticket Created / Updated
                                      │
                                      ▼
                      Live Updates on Support Desk UI
```

---

## Approach Used & Why

### Chosen Approach: Unified Helpdesk Desk with Embedded Real-Time Simulator
- **Why this approach:**
  1. **Immediate Verifiability:** Operators can type or click quick test scenarios and observe the AI reasoning, intent classification, and generated ticket in sub-100ms.
  2. **Zero Telephony Tolls for QA:** Tests the full LangGraph intelligence loop without making expensive outbound phone calls.
  3. **Operational Visibility:** Support grievances, damages, and returns appear side-by-side with order confirmation and shipping dispatches in a single unified dashboard.

### Pros & Cons
| Pros | Cons |
|---|---|
| Complete conversational visibility across all three AI agents in one console. | Operators must remember to resolve tickets once replacements are sent. |
| Testable offline without active cellular networks or telephony credits. | Large ticket volumes require adding date-range filtering and search. |
| Real-time visual feedback on intent classification and sentiment scores. | Does not support live video chat. |

---

## Transferable Real-World Use Cases

### Where to Implement This Approach
1. **Multi-Tenant Customer Support SaaS (Zendesk / Gorgias Competitor):** Providing e-commerce merchants with automated resolution of 80%+ of repetitive inquiries.
2. **Internal IT Service Desk:** Categorizing employee hardware and software requests between static FAQs and automated account reset scripts.
3. **Property Management Helpdesk:** Handling tenant maintenance requests, rent payment policies, and emergency maintenance escalations.

---

## Code Pointers
- `frontend/src/components/OperationsConsole.tsx`: Support Helpdesk tab, tickets ledger, and live simulator.
- `backend/api/endpoints/support_tools.py`: `POST /api/v1/support/chat` and `/support/tickets` endpoints.
- `backend/agents/support/graph.py`: LangGraph conversational execution engine.
- `backend/services/support_service.py`: Complaint, refund, and tracking domain service.
