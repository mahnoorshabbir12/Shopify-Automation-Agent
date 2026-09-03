# Module 1.1 — FastAPI Polyglot Monorepo & Configuration Foundation

## What we built
Module 1.1 establishes the polyglot monorepo structure combining a high-performance **FastAPI backend** (`backend/`) and a **Vite React frontend** (`frontend/`) in a single repository with shared configuration and documentation (`docs/`).
We configured environment variable loading and validation using `pydantic-settings`.

---

## Architecture Flow

```text
Root Monorepo
  ├── backend/          (FastAPI, SQLAlchemy, LangGraph, Qdrant)
  ├── frontend/         (React 19, Vite, Vanilla CSS Design System)
  ├── docs/             (Living Architectural & Module Documentation)
  ├── tests/            (Pytest Regression Suite)
  └── docker-compose.yml (PostgreSQL + Qdrant Services)
```

---

## Concepts and decisions

### The Monorepo Boundary
Keeping the Python AI/database layers and the React presentation layer in one repository simplifies developer onboarding: one `git clone` contains the entire system.

### Fail-Fast Configuration Loading
Using `pydantic-settings.BaseSettings` ensures that if a developer launches the application without `SHOPIFY_WEBHOOK_SECRET` or `DATABASE_URL`, the server crashes instantly with an informative error rather than failing hours later during live traffic.

---

## Approach Used & Why

### Chosen Approach: Decoupled Polyglot Monorepo with Pydantic BaseSettings
- **Why this approach:**
  Our system consists of an asynchronous Python backend (handling telephony, database transactions, and LangGraph/RAG orchestration) and a modern React operator frontend. Housing both in a single repository ensures:
  1. Atomic version control: Backend API changes and frontend operator interfaces are updated, reviewed, and tested in the exact same commit.
  2. Strongly-typed configuration: `pydantic-settings` validates environment variables (`DATABASE_URL`, `SHOPIFY_WEBHOOK_SECRET`, `RETELL_API_KEY`) at server boot time, failing fast if credentials are missing.

### Pros & Cons
| Pros | Cons |
|---|---|
| Single PR & commit history for end-to-end features. | Requires both Python and Node.js toolchains in development. |
| Zero drift between backend API routes and frontend client code. | CI/CD pipelines must check changed directories before triggering builds. |
| Compile-time & boot-time environment validation via Pydantic. | Slightly larger initial git repository checkout. |

---

## Transferable Real-World Use Cases

### Where to Implement This Approach
1. **AI / ML SaaS Platforms:** Systems where heavy AI workflows (LangChain, LangGraph, vector search) are written in Python, while the user-facing web app is in React or TypeScript.
2. **FinTech Control Planes:** Microservices requiring a high-throughput API gateway with an accompanying internal compliance/operations dashboard.
3. **E-commerce Ops Consoles:** Internal merchant tooling that interfaces with external platforms (Shopify, Amazon, couriers) while exposing an administration portal for support staff.

### When NOT to Use This Approach
- Pure static marketing websites with no backend computation (use a static site generator like Astro/Next.js).
- Giant enterprise organizations where backend and frontend teams belong to separate departments with strictly independent deployment schedules and permissions.
