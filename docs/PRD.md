# Product Requirements Document (PRD)

## AI-Powered Shopify E-Commerce Automation Platform

**Version:** 1.1
**Status:** Agreed (2026-08-31)
**Primary Backend:** FastAPI
**Ops UI:** React
**Database:** PostgreSQL
**AI Architecture:** Three Specialized Agents (LangGraph workflows + Retell voice)
**Deferred work:** See `FUTURE_PROSPECTS.md` (prepaid confirmation, WhatsApp, Celery, Vapi, etc.)

---

## 1. Product Overview

The platform automates the manual operational workflow of a Shopify-based e-commerce business using three specialized AI agents:

1. **Order Confirmation Agent** — automatically calls customers to confirm newly placed orders.
2. **Customer Support Agent** — handles customer questions, order issues, complaints, tracking requests, and eligible refund requests.
3. **Shipping Agent** — processes confirmed orders, evaluates courier options, books shipments, and manages shipment information.

All three agents share a centralized **FastAPI backend and PostgreSQL database**. Operators use a **React dashboard** (confirmation queue, retries, escalations). Prepaid checkout confirmation is out of Phase 1 — see `FUTURE_PROSPECTS.md`.

---

# 2. Problem Statement

The current business workflow requires multiple employees to manually:

* Call customers after they place Shopify orders.
* Repeatedly attempt calls when customers do not answer.
* Answer customer questions through WhatsApp/phone.
* Confirm orders.
* Contact courier companies individually.
* Negotiate/check shipping costs.
* Book shipments.
* Enter parcel/AWB information manually.
* Follow up with couriers about delayed or missing shipments.
* Handle customer complaints.
* Process refunds and update records.

This process is time-consuming, inconsistent, difficult to scale, and prone to human error.

---

# 3. Product Goal

Build an AI-powered automation platform that can handle the majority of these operations automatically while keeping humans involved when an AI agent cannot safely resolve an issue.

### Core principle

> **AI decides and requests actions; our backend validates and executes them.**

The AI must never directly modify the database or execute sensitive transactions without backend validation.

---

# 4. System Architecture

```text
                         SHOPIFY
                            │
                     Orders / Webhooks
                            │
                            ▼
                    ┌───────────────┐
                    │    FASTAPI    │
                    │ Central Backend│
                    └───────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   ORDER CONFIRMATION    CUSTOMER SUPPORT    SHIPPING
        AGENT                AGENT             AGENT
          │                   │                 │
       Retell              Retell              LLM
          │                   │                 │
       Plivo                Plivo          Courier APIs
          │                   │            ┌────┼────┐
          ▼                   ▼           TCS PostEx BlueEX
       Customer            Customer
          
                    ┌───────────────┐
                    │  PostgreSQL   │
                    └───────────────┘
```

---

# 5. Technology Stack

| Component            | Technology |
| -------------------- | ---------- |
| E-commerce           | Shopify |
| Ops dashboard        | React (talks only to FastAPI) |
| Backend              | FastAPI / Python |
| Database             | PostgreSQL |
| Voice AI             | Retell AI only (**not Vapi**) |
| Telephony            | Plivo |
| RAG                  | Our LangChain corpus + `search_knowledge()` tool |
| Agent workflows      | LangGraph (confirmation lifecycle, shipping decisions) |
| LLM toolkit          | LangChain |
| Agent observability  | LangSmith + application logs |
| Shipping AI          | LangGraph backend agent (not voice) |
| Courier integrations | TCS, PostEx, BlueEX |
| Workflow             | PostgreSQL `workflow_tasks` + worker (not Celery in Phase 1) |
| Authentication       | JWT (React users) / API auth (Retell tools) |

---

# 6. Agent 1 — Order Confirmation Agent

## Objective

Automatically contact customers after a **COD** Shopify order is created and obtain explicit confirmation of **address**, **order amount**, and **intent to receive** the parcel.

Prepaid / already-paid orders are a future prospect (`FUTURE_PROSPECTS.md`), not Phase 1.

### Trigger

```text
Shopify Order Created
        ↓
Shopify Webhook
        ↓
FastAPI
        ↓
Order Confirmation Agent
```

### Responsibilities

* Call the customer (outbound Retell → Plivo).
* Identify the order.
* Confirm **delivery address**, **order amount**, and **intent to receive** (COD).
* Confirm products when the customer asks.
* Answer basic product/store questions via `search_knowledge()` (our RAG), never via a second Retell-only KB.
* Detect customer intent (confirm, reject, callback, human).
* Confirm or reject the order through FastAPI tools.
* Handle unanswered calls through PostgreSQL-backed retries.
* Escalate complicated cases to humans.

### Voice Stack

```text
Retell AI
    ↓
Plivo
    ↓
Customer Phone
```

### Knowledge Base (single corpus)

Static knowledge lives in **our** LangChain RAG store (chunked policies/FAQs/product copy). The voice agent does **not** use Retell’s built-in Knowledge Base as a second source of truth.

The Retell agent retrieves via the FastAPI tool:

```text
search_knowledge(query)
```

Corpus includes:

* Product information (static copy, not live inventory)
* FAQs
* Return / exchange / shipping / refund / warranty policies
* Store information

Live order, address, amount, and inventory always come from tools (`get_order`, etc.), never from the vector store.

### Backend Tools

The agent can call:

```text
search_knowledge()
get_order()
get_customer()
get_product()
confirm_order()
schedule_callback()
transfer_to_human()
```

### COD confirmation (Phase 1)

An order may be marked **CONFIRMED** only after the customer has clearly agreed on:

1. **Address** — delivery location is correct (or a corrected address is captured and validated by FastAPI).
2. **Amount** — they accept the COD payable amount.
3. **Intent to receive** — they will accept the parcel when the courier arrives.

Anything short of that (unsure, wrong address unresolved, disputes amount, hostile, or asks for a human) must not auto-confirm.

### Confirmation Flow

```text
New Order
   ↓
Create Call
   ↓
Retell
   ↓
Plivo
   ↓
Customer
   ↓
Customer confirms
   ↓
confirm_order()
   ↓
FastAPI validation
   ↓
Shopify + PostgreSQL
   ↓
CONFIRMED
```

### No-Answer Flow

The system must **not reject an order after one unanswered call**.

```text
Call Attempt 1
      ↓
No Answer
      ↓
Workflow Scheduler
      ↓
Retry
      ↓
Call Attempt 2
      ↓
Retry if necessary
```

Retry strategy should be configurable.

---

# 7. Agent 2 — Customer Support Agent

## Objective

Provide automated customer support through voice and eventually messaging channels.

### Responsibilities

* Product questions
* Order status
* Tracking information
* Delivery issues
* Complaints
* Returns
* Exchanges
* Refund requests
* Shipping questions
* Human escalation

### Architecture

```text
Customer
   ↓
Plivo
   ↓
Retell Support Agent
   ├── search_knowledge() → our LangChain RAG (static only)
   └── FastAPI Tools (live data + mutations)
```

### RAG handles

```text
"What is your return policy?"
"Can I exchange this?"
"How long does delivery take?"
"Is this product available in another size?"
```

### Tools handle live information

```text
search_knowledge()
get_order()
get_order_status()
get_tracking_info()
get_product()
get_inventory()
create_complaint()
request_refund()
transfer_to_human()
```

### Important rule

RAG should **not** be used for live transactional information.

For example:

> "Where is my order?"

must query Shopify/database/courier information rather than relying on the knowledge base.

---

# 8. Agent 3 — Shipping Agent

## Objective

Automate shipment selection and booking after an order has been confirmed.

Unlike the first two agents, the Shipping Agent is **not a voice agent**. It is a **LangGraph** decision workflow on the backend. A box labeled “Retell” on the order-processing diagram is a **diagram mistake** — ignore it.

### Trigger

```text
Order Confirmed
      ↓
Shipping Agent
```

### Responsibilities

* Retrieve order details.
* Determine shipment requirements.
* Evaluate courier options.
* Compare shipping costs.
* Consider delivery time and coverage.
* Select the appropriate courier.
* Request shipment booking.
* Store AWB/tracking information.
* Update Shopify.

### Courier Integrations

Initial target integrations:

* TCS
* PostEx
* BlueEX

Architecture must allow additional couriers later.

### Shipping Flow

```text
CONFIRMED ORDER
      ↓
Shipping Agent
      ↓
Get Courier Options
      ↓
Compare:
 ├── Cost
 ├── Delivery Time
 ├── Coverage
 ├── COD
 └── Business Rules
      ↓
Select Courier
      ↓
FastAPI Validation
      ↓
Courier API
      ↓
Shipment Created
      ↓
AWB / Tracking ID
      ↓
PostgreSQL
      ↓
Shopify
```

### Critical Architecture Rule

The AI must **not directly call courier APIs**.

Instead:

```text
AI Agent
   ↓
Recommendation / Action Request
   ↓
FastAPI
   ↓
Business Rules + Validation
   ↓
Courier Integration Service
   ↓
Courier API
```

---

# 9. Shopify Integration

Shopify is the primary e-commerce data source.

### Required integration

* Shopify Admin API
* Shopify Webhooks

### Important events

Initially:

```text
orders/create
orders/updated
orders/cancelled
refunds/create
```

The exact webhook set can expand as requirements evolve.

### Shopify data used

* Orders
* Customers
* Products
* Variants
* Inventory
* Order status
* Financial status
* Fulfillment information

---

# 10. FastAPI Backend

FastAPI is the **central control layer** of the entire system.

### Responsibilities

* Shopify integration
* React dashboard APIs
* Agent tool endpoints
* Authentication
* Authorization
* Business rules
* Database access
* Workflow management
* Courier integrations
* Webhooks
* Agent event processing
* Logging
* Error handling

### Suggested service structure

```text
backend/
│
├── api/
│   ├── shopify/
│   ├── agents/
│   ├── orders/
│   ├── dashboard/
│   ├── shipments/
│   └── support/
│
├── agents/
│   ├── confirmation/
│   ├── support/
│   └── shipping/
│
├── integrations/
│   ├── shopify/
│   ├── retell/
│   ├── plivo/
│   └── couriers/
│       ├── tcs/
│       ├── postex/
│       └── blueex/
│
├── services/
│   ├── order_service.py
│   ├── shipment_service.py
│   ├── support_service.py
│   └── workflow_service.py
│
├── models/
├── schemas/
├── database/
├── core/
└── main.py
```

---

# 11. PostgreSQL

PostgreSQL stores operational state and system history.

### Core entities

```text
users
customers

orders
order_items
products

calls
call_attempts
call_events

complaints
refunds

shipments
couriers
courier_rates
tracking_events

agent_sessions
agent_actions

workflow_tasks
```

### Important principle

PostgreSQL is the **system of record for our automation platform**.

Shopify remains the source of truth for Shopify-owned e-commerce data.

---

# 12. Workflow Engine

The workflow layer manages asynchronous processes.

### Examples

#### Call retries

```text
No Answer
   ↓
Schedule Retry
   ↓
Retry Call
```

#### Shipment processing

```text
Order Confirmed
   ↓
Create Shipping Task
   ↓
Shipping Agent
```

#### Support follow-up

```text
Complaint Created
   ↓
Follow-up Task
   ↓
Check Status
   ↓
Notify Customer
```

**Implementation (agreed):** PostgreSQL table `workflow_tasks` plus a worker process that polls due tasks. This supports delayed call retries, shipment kickoff, and later support follow-ups without Redis/Celery in Phase 1.

Celery/RabbitMQ remains a scale-up option in `FUTURE_PROSPECTS.md`.

The workflow system must support delayed jobs, retries, failure handling, and idempotency.

---

# 13. Agent Tool Layer

Agents should never directly access internal services.

Instead:

```text
Retell / AI Agent
       ↓
Agent Tool
       ↓
FastAPI
       ↓
Business Logic
       ↓
Database / Shopify / Courier
```

Example:

```text
search_knowledge(query)
confirm_order(order_id)
get_order_status(order_id)
get_tracking_info(order_id)
create_complaint(...)
request_refund(...)
book_shipment(...)
```

Every tool must validate:

* Authentication
* Authorization
* Input
* Current entity state
* Business rules
* Idempotency

---

# 14. Human Escalation

Humans remain part of the system.

Escalation should occur when:

* Customer explicitly requests a human.
* Agent confidence is insufficient.
* Customer becomes highly dissatisfied.
* Refund exceeds configured limits.
* Courier refuses shipment.
* API failures prevent resolution.
* Business rules require manual approval.
* Sensitive or exceptional cases occur.

---

# 15. End-to-End Business Flow

## Stage 1 — Order

```text
Customer places Shopify order
          ↓
Shopify Webhook
          ↓
FastAPI
          ↓
PostgreSQL
```

## Stage 2 — Confirmation

```text
FastAPI
   ↓
Order Confirmation Agent
   ↓
Retell
   ↓
Plivo
   ↓
Customer
```

## Stage 3 — Confirmation Result

```text
Customer confirms
       ↓
FastAPI
       ↓
Shopify + PostgreSQL
       ↓
CONFIRMED
```

## Stage 4 — Shipping

```text
CONFIRMED
    ↓
Shipping Agent
    ↓
Courier comparison
    ↓
Business validation
    ↓
Courier API
    ↓
Shipment booked
    ↓
AWB / Tracking ID
    ↓
Shopify + PostgreSQL
```

## Stage 5 — Support

```text
Customer issue
      ↓
Support Agent
      ↓
RAG / FastAPI Tools
      ↓
Resolution
```

---

# 16. Non-Functional Requirements

### Reliability

* Failed API requests must be retried.
* Webhooks must be idempotent.
* Agent actions must be logged.
* Duplicate shipment/order actions must be prevented.

### Security

* Secure Shopify credentials.
* Secure Retell/Plivo credentials.
* API authentication.
* Role-based authorization.
* No direct database access from AI agents.
* Sensitive information must not be exposed in prompts unnecessarily.

### Scalability

The architecture should allow:

* Multiple Shopify stores.
* Multiple customers.
* Multiple concurrent calls.
* Additional courier integrations.
* Additional AI agents.
* Additional communication channels.

### Observability

LangSmith traces LangGraph runs and tool-level LLM steps. FastAPI logs cover HTTP, Shopify, and courier failures.

Track:

* Agent calls
* Call duration
* Call outcome
* Tool calls
* Tool failures
* Shopify API failures
* Courier API failures
* Retry attempts
* Escalations
* Shipment status

---

# 17. MVP Scope

### Phase 1

**COD Order Confirmation**

* Shopify integration (`orders/create` and related)
* FastAPI control plane + PostgreSQL
* PostgreSQL `workflow_tasks` worker (retries)
* LangGraph confirmation lifecycle
* Retell outbound agent + Plivo (**not Vapi**)
* LangChain RAG + `search_knowledge()`
* FastAPI tools (`get_order`, `confirm_order`, …)
* COD gates: address, amount, intent to receive
* React ops UI: confirmation queue + call history + escalations
* LangSmith tracing

### Phase 2

**Shipping**

* Shipping LangGraph agent (not voice / not Retell)
* Courier integration abstraction
* TCS / PostEx / BlueEX
* Courier selection + FastAPI rules + booking
* AWB / tracking storage + Shopify fulfillment
* Human review queue for exceptions

### Phase 3

**Support**

* Retell inbound Support Agent
* Same RAG corpus via `search_knowledge()`
* Order / tracking tools
* Complaint management
* Refund workflow (rules engine)
* Human escalation

### Phase 4

**Advanced Automation**

* WhatsApp support
* Prepaid order handling (`FUTURE_PROSPECTS.md`)
* Advanced courier optimization
* Analytics dashboard (beyond Phase 1 ops lists)
* Multi-store support
* Agent performance analytics
* Automated follow-ups
* Celery/Redis if `workflow_tasks` saturates

---

# 18. Success Metrics

### Order Confirmation

* Confirmation rate (COD orders)
* Share of confirms that captured address + amount + intent
* Average calls per confirmed order
* Average time to confirmation
* No-answer recovery rate
* Human escalation rate

### Shipping

* Average shipping cost
* Shipment booking success rate
* Booking time
* Courier selection accuracy
* API failure rate

### Support

* First-contact resolution rate
* Human escalation rate
* Average resolution time
* Customer satisfaction
* Refund processing time

### Overall

* Percentage of operations automated
* Human workload reduction
* Cost per order
* System failure rate
* Agent task success rate

---

# 19. Final Product Vision

The final platform should function as an **AI operations team for a Shopify business**:

```text
                    SHOPIFY
                       │
                       ▼
               ┌───────────────┐     React ops UI
               │   FASTAPI     │◄──── confirmation / escalations
               │ Orchestrator  │
               └───────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   CONFIRMATION     SUPPORT       SHIPPING
   LangGraph+Retell  Retell       LangGraph
        │              │              │
      Plivo          Plivo        Couriers
        │              │              │
        └──────────────┼──────────────┘
                       ▼
              POSTGRESQL + our RAG
```

The platform should automate the **entire order lifecycle**, while maintaining strict backend control over transactional operations and providing human escalation whenever automation is unsafe or insufficient.
