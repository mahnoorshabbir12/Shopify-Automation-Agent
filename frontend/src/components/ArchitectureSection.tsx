import React from "react";

export const ArchitectureSection: React.FC = () => {
  return (
    <section id="architecture" style={{
      padding: "6rem 0",
      backgroundColor: "var(--bg-main)",
      borderBottom: "1px solid var(--border-subtle)"
    }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div className="section-tag" style={{ justifyContent: "center" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} />
            System Architecture
          </div>
          <h2 className="section-title">Engineered for Zero Data Loss</h2>
          <p className="section-desc" style={{ margin: "0 auto" }}>
            How our enterprise architecture ensures that orders, voice confirmations, and courier bookings remain strictly consistent without dual-write race conditions.
          </p>
        </div>

        {/* Visual Architecture Flow Diagram */}
        <div style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "16px",
          padding: "3.5rem 2rem",
          boxShadow: "var(--shadow-md)"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            alignItems: "center",
            position: "relative"
          }}>
            {/* Layer 1: Ingestion */}
            <div style={{
              padding: "1.5rem",
              borderRadius: "12px",
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border-subtle)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--shopify-green)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                Source of Commerce
              </div>
              <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Shopify Webhooks
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                HMAC SHA-256 Verified Ingest (orders/create)
              </div>
            </div>

            {/* Connecting Arrow */}
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "1.5rem" }}>
              →
            </div>

            {/* Layer 2: Control Plane */}
            <div style={{
              padding: "1.5rem",
              borderRadius: "12px",
              backgroundColor: "var(--bg-main)",
              border: "1.5px solid var(--shopify-green)",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0, 128, 96, 0.08)"
            }}>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--shopify-green)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                API Gateway
              </div>
              <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                FastAPI Gateway
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Owns Side Effects & Business Validation
              </div>
            </div>

            {/* Connecting Arrow */}
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "1.5rem" }}>
              →
            </div>

            {/* Layer 3: AI Agents & Graph */}
            <div style={{
              padding: "1.5rem",
              borderRadius: "12px",
              backgroundColor: "var(--bg-main)",
              border: "1.5px solid var(--ai-cyan)",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.08)"
            }}>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--ai-cyan)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                Orchestration
              </div>
              <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                LangGraph Engine
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Deterministic Routing + Qdrant Policy RAG
              </div>
            </div>

            {/* Connecting Arrow */}
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "1.5rem" }}>
              →
            </div>

            {/* Layer 4: Storage & Telephony */}
            <div style={{
              padding: "1.5rem",
              borderRadius: "12px",
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border-subtle)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                Persistence & I/O
              </div>
              <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                PostgreSQL + Retell
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                SKIP LOCKED Queue + Plivo Outbound
              </div>
            </div>
          </div>

          {/* Technical Explanations */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2rem",
            marginTop: "3rem",
            paddingTop: "2.5rem",
            borderTop: "1px solid var(--border-subtle)"
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                1. No Dual-Write Race Conditions
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Shopify orders and their confirmation tasks are stored together in a single PostgreSQL transaction. Even if the worker restarts, tasks remain durable.
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                2. Sub-200ms Voice Tool Latency
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Retell AI queries our FastAPI tools directly using pre-shared secrets. In-process vector indexing ensures immediate answers during phone conversations.
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                3. Idempotent Retry Engine
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Duplicate webhooks from Shopify or Retell are safely deduplicated using database row-level unique constraint keys.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
