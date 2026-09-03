import React from "react";

export const AgentsSection: React.FC = () => {
  return (
    <section id="agents" style={{
      padding: "6rem 0",
      backgroundColor: "var(--bg-main)",
      borderBottom: "1px solid var(--border-subtle)"
    }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "4.5rem" }}>
          <div className="section-tag" style={{ justifyContent: "center" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--ai-cyan)" }} />
            Specialized Neural Agents
          </div>
          <h2 className="section-title">Three Specialized AI Agents</h2>
          <p className="section-desc" style={{ margin: "0 auto" }}>
            Purpose-built agents designed for e-commerce reliability. Each agent owns a critical phase of the customer lifecycle.
          </p>
        </div>

        {/* 3 Premium Agent Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "2rem"
        }}>
          {/* Card 1: Order Confirmation Agent */}
          <div className="surface-card" style={{
            padding: "2.5rem 2rem",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              {/* Header Icon & Tag */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  backgroundColor: "var(--shopify-green-light)",
                  color: "var(--shopify-green)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0, 128, 96, 0.15)"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <span className="pill pill-confirmed">
                  ● Voice AI Agent
                </span>
              </div>

              <h3 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
                Order Confirmation Agent
              </h3>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                Autonomously calls customers within minutes of placing an order to confirm delivery details, eliminating fake COD bookings.
              </p>

              {/* Feature Checklist */}
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--shopify-green)", fontWeight: 800 }}>✓</span>
                  Automatically dials customers via Retell & Plivo
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--shopify-green)", fontWeight: 800 }}>✓</span>
                  Confirms COD address, amount & intent to receive
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--shopify-green)", fontWeight: 800 }}>✓</span>
                  Smart exponential backoff retry on no-answer
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--shopify-green)", fontWeight: 800 }}>✓</span>
                  Real-time status updates synced back to Shopify
                </li>
              </ul>
            </div>

            <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
              POWERED BY: RETELL AI + LANGGRAPH ORCHESTRATOR
            </div>
          </div>

          {/* Card 2: Customer Support Agent */}
          <div className="surface-card" style={{
            padding: "2.5rem 2rem",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              {/* Header Icon & Tag */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  backgroundColor: "var(--ai-cyan-light)",
                  color: "var(--ai-cyan)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(2, 132, 199, 0.15)"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span className="pill pill-calling">
                  ● Qdrant RAG
                </span>
              </div>

              <h3 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
                Customer Support Agent
              </h3>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                Provides instant, grounded answers to customer inquiries about store policies, shipping charges, and delivery timelines.
              </p>

              {/* Feature Checklist */}
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--ai-cyan)", fontWeight: 800 }}>✓</span>
                  Answers customer questions with zero hallucination
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--ai-cyan)", fontWeight: 800 }}>✓</span>
                  Uses single unified LangChain + Qdrant policy corpus
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--ai-cyan)", fontWeight: 800 }}>✓</span>
                  Handles order status queries via live tools
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--ai-cyan)", fontWeight: 800 }}>✓</span>
                  Escalates complex disputes to human support
                </li>
              </ul>
            </div>

            <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
              POWERED BY: QDRANT VECTOR SEARCH + FASTAPI TOOLS
            </div>
          </div>

          {/* Card 3: Shipping Agent */}
          <div className="surface-card" style={{
            padding: "2.5rem 2rem",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              {/* Header Icon & Tag */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  backgroundColor: "var(--ai-teal-light)",
                  color: "var(--ai-teal)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(13, 148, 136, 0.15)"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <span className="pill" style={{ backgroundColor: "#F1F5F9", color: "#334155" }}>
                  ● Autonomous Logistics
                </span>
              </div>

              <h3 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
                Shipping Agent
              </h3>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                Evaluates courier performance and rates to select the best carrier and automatically book consignments upon order confirmation.
              </p>

              {/* Feature Checklist */}
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--ai-teal)", fontWeight: 800 }}>✓</span>
                  Evaluates rates across TCS, PostEx, and BlueEX
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--ai-teal)", fontWeight: 800 }}>✓</span>
                  Books consignment shipments via API automatically
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--ai-teal)", fontWeight: 800 }}>✓</span>
                  Generates tracking numbers & downloadable AWBs
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--ai-teal)", fontWeight: 800 }}>✓</span>
                  Tracks parcel delivery updates until destination
                </li>
              </ul>
            </div>

            <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
              POWERED BY: COURIER API PROTOCOLS + DECISION GRAPH
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
