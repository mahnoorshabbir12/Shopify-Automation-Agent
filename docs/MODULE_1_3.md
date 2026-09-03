# Module 1.3 — Shopify Webhook Ingest, HMAC Signature Verification & Idempotency

## What we built
Module 1.3 implements the webhook ingestion pipeline for Shopify's `orders/create` event (`POST /webhooks/shopify/orders/create`).
It verifies the `X-Shopify-Hmac-Sha256` signature using our store secret, parses the order payload, and performs an **idempotent upsert** in PostgreSQL.

---

## Architecture Flow

```text
Shopify Event: orders/create
       │
       ▼
POST /webhooks/shopify/orders/create
       │
       ├── Read Raw Bytes (before JSON parse)
       ├── Compute HMAC SHA-256 with SHOPIFY_WEBHOOK_SECRET
       ├── Compare digest with X-Shopify-Hmac-Sha256 header (secrets.compare_digest)
       │     └─► Mismatch? Return 401 Unauthorized
       │
       ▼ Valid Signature
Parse JSON Payload & Extract Order / Customer
       │
       ▼
PostgreSQL Upsert:
   INSERT INTO orders (...) VALUES (...)
   ON CONFLICT (id) DO NOTHING;
       │
       ▼
Order Created? ──► Enqueue workflow_tasks (attempt 1)
Duplicate?     ──► Return 200 OK (Idempotent acknowledge)
```

---

## Concepts and decisions

### Timing Attacks & Constant-Time Comparison
Comparing cryptographic signatures with standard Python `==` operators leaks timing information that attackers can exploit to forge valid hashes. We use `secrets.compare_digest()` which executes in strictly constant time.

### Raw Body vs. Serialized Body
Calculating HMAC signatures after FastAPI parses JSON will fail because JSON key order and whitespace serialization differ from Shopify's exact raw transmission bytes. We read `await request.body()` directly before deserialization.

---

## Approach Used & Why

### Chosen Approach: Raw Byte HMAC SHA-256 Validation + Database-Level Idempotency (`ON CONFLICT DO NOTHING`)
- **Why this approach:**
  1. **Security against Spoofing:** Anyone can send an HTTP POST request to a public webhook URL. Validating the HMAC signature computed over the raw request body with the store's shared secret mathematically proves the payload originated from Shopify and was not modified in transit.
  2. **At-Least-Once Delivery Resilience:** Webhook providers like Shopify guarantee *at least once* delivery, meaning network retries will deliver duplicate events. Handling duplicates via database constraints (`ON CONFLICT (id) DO NOTHING`) guarantees that duplicate webhooks never create duplicate orders or trigger duplicate phone calls.

### Pros & Cons
| Pros | Cons |
|---|---|
| Complete protection against webhook tampering and replay attacks. | Must capture raw bytes before body is parsed by JSON middlewares. |
| Zero duplicate records regardless of how many times Shopify retries. | Constant-time cryptographic comparison (`secrets.compare_digest`) adds microsecond overhead. |
| Transactional consistency between order upsert and workflow task creation. | Missing store secret prevents local testing unless properly mocked. |

---

## Transferable Real-World Use Cases

### Where to Implement This Approach
1. **Payment Gateways (Stripe, PayPal, PayFast):** Ingesting charge and payout webhooks where duplicate processing could result in double credits or unauthorized refunds.
2. **Third-Party Logistics (3PL) & Courier Webhooks:** Handling parcel status updates (Delivered, Out for Delivery, Returned) arriving asynchronously from courier APIs.
3. **GitHub / GitLab CI/CD Automation:** Webhook listeners that trigger automated tests or deployments upon repository push events.

### When NOT to Use This Approach
- Internal synchronous service-to-service RPC calls behind a private VPC where mutual TLS (mTLS) or IAM role authentication already secures the transport layer.
