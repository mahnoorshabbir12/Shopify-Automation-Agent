# Module 1.4 — Shopify Admin Read Client (GraphQL & Client Credentials)

## What we built
Module 1.4 implements `ShopifyAdminClient` (`backend/integrations/shopify/client.py`), an asynchronous client that communicates with Shopify's Admin API using **GraphQL** and dynamic OAuth token exchange via the **Client Credentials grant**.

---

## Architecture Flow

```text
FastAPI / Backend Worker
       │
       ▼
ShopifyAdminClient (backend/integrations/shopify/client.py)
       │
       ├── Check Token Cache (is valid & not expired?)
       │     └─► Expired? Request token via POST /admin/oauth/access_token
       │
       ▼
POST https://{shop_domain}/admin/api/2024-01/graphql.json
Query:
  query getOrder($id: ID!) {
    order(id: $id) {
      id name totalPriceSet { ... }
      customer { displayName phone email }
      shippingAddress { address1 city province }
    }
  }
       │
       ▼
Return Structured Order & Customer Pydantic Objects
```

---

## Concepts and decisions

### Token Caching & Lazy Exchange
Rather than requesting a fresh OAuth access token on every GraphQL query, `ShopifyAdminClient` caches the token in memory alongside an expiration timestamp, refreshing only when the token is within 60 seconds of expiry.

### Single Round-Trip Order & Customer Hydration
In REST, fetching an order and its full customer contact profile often requires two distinct network requests (`/admin/api/orders/{id}.json` and `/admin/api/customers/{id}.json`). GraphQL combines both into a single network round-trip.

---

## Approach Used & Why

### Chosen Approach: Async GraphQL Client with Dynamic Token Exchange
- **Why this approach:**
  1. **Precise Field Selection (No Over-fetching):** Shopify REST endpoints return massive JSON objects (thousands of lines for a single order containing shipping lines, tax lines, refunds, line items). With GraphQL, we query *only* the exact fields we need (customer phone, address, total price set), reducing network payload size by ~85%.
  2. **Modern OAuth Client Credentials:** Supports modern headless and private app authentication without manual token copy-pasting.

### Pros & Cons
| Pros | Cons |
|---|---|
| Dramatically reduced JSON payload and deserialization overhead. | Requires writing GraphQL queries instead of standard REST endpoints. |
| Single round-trip to fetch order + nested customer details. | Must handle GraphQL error arrays (`errors`) in addition to HTTP status codes. |
| Async HTTP connection pooling via `httpx.AsyncClient`. | Access tokens expire and require lazy refreshing. |

---

## Transferable Real-World Use Cases

### Where to Implement This Approach
1. **ERP & Warehouse Inventory Synchronization:** Regularly pulling order and product catalog updates into SAP or NetSuite where bandwidth and rate-limiting are major concerns.
2. **Salesforce / HubSpot CRM Integration:** Synchronizing contact information and purchase history into CRM records using GraphQL queries.
3. **Multi-Vendor Marketplaces:** Fetching selective product variant details across thousands of SKUs in e-commerce aggregators.

### When NOT to Use This Approach
- Simple public third-party APIs that only offer basic REST endpoints.
- Quick script prototypes where a pre-existing vendor SDK with high-level helpers is sufficient.
