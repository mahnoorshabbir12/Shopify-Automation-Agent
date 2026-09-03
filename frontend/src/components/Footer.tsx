import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: "#0B1120",
      color: "#94A3B8",
      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      position: "relative",
      padding: "3.5rem 0 2rem 0",
      overflow: "hidden"
    }}>
      {/* Subtle Top Gradient Ambient Light */}
      <div style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "600px",
        height: "1px",
        background: "linear-gradient(90deg, transparent, var(--shopify-green), #0284C7, transparent)",
        opacity: 0.8
      }} />

      <div className="container">
        {/* Main Footer Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2.5rem",
          marginBottom: "3rem"
        }}>
          {/* Column 1: Brand & Purpose */}
          <div style={{ gridColumn: "span 1", minWidth: "240px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #008060 0%, #004C3F 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0, 128, 96, 0.4)"
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div style={{ fontWeight: 800, fontSize: "1.125rem", letterSpacing: "-0.02em", color: "#FFFFFF" }}>
                Shopify<span style={{ color: "var(--shopify-green)" }}>AI</span> Ops
              </div>
            </div>

            <p style={{
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "#94A3B8",
              marginBottom: "1.25rem"
            }}>
              Autonomous COD confirmation, intelligent 3PL carrier dispatch, and 24/7 AI customer service engineered for high-volume commerce brands.
            </p>

            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(0, 128, 96, 0.12)",
              border: "1px solid rgba(0, 128, 96, 0.3)",
              fontSize: "0.75rem",
              color: "#34D399",
              fontWeight: 600
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981" }} className="anim-pulse" />
              Enterprise Platform
            </div>
          </div>

          {/* Column 2: Platform Capabilities */}
          <div>
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#F8FAFC", marginBottom: "1rem" }}>
              Capabilities
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.875rem" }}>
              <li>
                <a href="#console" style={{ color: "inherit", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")} onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}>
                  Voice Order Confirmation
                </a>
              </li>
              <li>
                <a href="#console" style={{ color: "inherit", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")} onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}>
                  Autonomous 3PL Dispatch
                </a>
              </li>
              <li>
                <a href="#console" style={{ color: "inherit", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")} onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}>
                  Customer Support Helpdesk
                </a>
              </li>
              <li>
                <a href="#pipeline" style={{ color: "inherit", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")} onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}>
                  Self-Driving Workflow Pipeline
                </a>
              </li>
              <li>
                <a href="#console" style={{ color: "inherit", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")} onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}>
                  Real-Time Operational Telemetry
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Logistics & Integrations */}
          <div>
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#F8FAFC", marginBottom: "1rem" }}>
              Integrations
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.875rem" }}>
              <li>Shopify & Shopify Plus</li>
              <li>BlueEX Logistics</li>
              <li>PostEx Express</li>
              <li>TCS Express Courier</li>
              <li>Leopard & Trax Logistics</li>
              <li>WhatsApp Business Cloud API</li>
            </ul>
          </div>

          {/* Column 4: Enterprise Trust & Security */}
          <div>
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#F8FAFC", marginBottom: "1rem" }}>
              Trust & Security
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.875rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ color: "var(--shopify-green)" }}>✓</span> SOC 2 Type II Certified
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ color: "var(--shopify-green)" }}>✓</span> 99.99% Operational SLA
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ color: "var(--shopify-green)" }}>✓</span> Zero Data Loss Guarantee
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ color: "var(--shopify-green)" }}>✓</span> End-to-End Encryption
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ color: "var(--shopify-green)" }}>✓</span> Idempotent Event Delivery
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Live System Status */}
        <div style={{
          paddingTop: "1.75rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.8125rem",
          color: "#64748B",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div>
            © 2026 ShopifyAI Ops Inc. All rights reserved. Built for high-growth e-commerce operations.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.75rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10B981",
                boxShadow: "0 0 8px #10B981"
              }} className="anim-pulse" />
              <span style={{ color: "#E2E8F0", fontWeight: 600 }}>All Systems Operational (99.99% Uptime)</span>
            </div>

            <div style={{ display: "flex", gap: "1.25rem" }}>
              <span style={{ cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#CBD5E1")} onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}>Privacy Policy</span>
              <span style={{ cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#CBD5E1")} onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}>Terms of Service</span>
              <span style={{ cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#CBD5E1")} onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}>Security Disclosures</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
