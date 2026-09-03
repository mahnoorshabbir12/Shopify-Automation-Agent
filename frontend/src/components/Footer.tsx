import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer style={{ position: "relative", overflow: "hidden" }}>
      {/* Shaped Top Border (Smooth Wave Contour) with Subtle Animated Shimmer Beam */}
      <div style={{ position: "relative", width: "100%", overflow: "hidden", lineHeight: 0 }}>
        <svg
          viewBox="0 0 1440 54"
          fill="none"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "46px", display: "block" }}
        >
          <defs>
            <linearGradient id="waveGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.95">
                <animate attributeName="offset" values="0;1;0" dur="5s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {/* Wave fill using the website's Shopify Green */}
          <path
            d="M 0,26 C 360,48 720,4 1080,28 C 1260,38 1380,16 1440,22 L 1440,54 L 0,54 Z"
            fill="var(--shopify-green)"
          />
          {/* Animated Wave Crest Line */}
          <path
            d="M 0,26 C 360,48 720,4 1080,28 C 1260,38 1380,16 1440,22"
            stroke="url(#waveGlow)"
            strokeWidth="3"
            fill="none"
          />
        </svg>
      </div>

      {/* Main Footer Body (Vibrant Shopify Green Matching Website Theme) */}
      <div style={{
        background: "linear-gradient(180deg, var(--shopify-green) 0%, #006E52 100%)",
        color: "#E6F4EA",
        padding: "1.75rem 0 1.75rem 0",
        position: "relative"
      }}>
        {/* Subtle Ambient Radial Highlight */}
        <div style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "140px",
          background: "radial-gradient(ellipse at top, rgba(255, 255, 255, 0.15) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />

        <div className="container">
          {/* Compact 3-Column Layout */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gap: "2.5rem",
            marginBottom: "1.75rem",
            alignItems: "start"
          }}>
            {/* Column 1: Brand & Purpose */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--shopify-green)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div style={{ fontWeight: 800, fontSize: "1.125rem", color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                  Shopify<span style={{ color: "#A7F3D0" }}>AI</span> Ops
                </div>
              </div>

              <p style={{
                fontSize: "0.8125rem",
                lineHeight: 1.6,
                color: "#E6F4EA",
                marginBottom: "1rem",
                maxWidth: "340px"
              }}>
                Autonomous COD confirmation calls, intelligent 3PL carrier dispatch, and 24/7 AI helpdesk engineered for high-growth e-commerce brands.
              </p>

              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.3rem 0.75rem",
                borderRadius: "9999px",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                fontSize: "0.75rem",
                color: "#FFFFFF",
                fontWeight: 700
              }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#34D399" }} className="anim-pulse" />
                All Systems Operational (99.99% Uptime)
              </div>
            </div>

            {/* Column 2: Capabilities */}
            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#FFFFFF", marginBottom: "0.75rem" }}>
                Capabilities
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem" }}>
                <li>
                  <a href="#console" style={{ color: "#E6F4EA", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")} onMouseLeave={(e) => (e.currentTarget.style.color = "#E6F4EA")}>
                    Voice Confirmation AI
                  </a>
                </li>
                <li>
                  <a href="#console" style={{ color: "#E6F4EA", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")} onMouseLeave={(e) => (e.currentTarget.style.color = "#E6F4EA")}>
                    Autonomous 3PL Logistics Router
                  </a>
                </li>
                <li>
                  <a href="#console" style={{ color: "#E6F4EA", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")} onMouseLeave={(e) => (e.currentTarget.style.color = "#E6F4EA")}>
                    Customer Support Helpdesk
                  </a>
                </li>
                <li>
                  <a href="#pipeline" style={{ color: "#E6F4EA", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")} onMouseLeave={(e) => (e.currentTarget.style.color = "#E6F4EA")}>
                    Autonomous Order Pipeline
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Carrier Protocols & Trust */}
            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#FFFFFF", marginBottom: "0.75rem" }}>
                Carrier Protocols
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem", color: "#E6F4EA" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <span style={{ color: "#34D399", fontWeight: 800 }}>✓</span> BlueEX, PostEx & TCS Express
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <span style={{ color: "#34D399", fontWeight: 800 }}>✓</span> Shopify & Shopify Plus Webhooks
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <span style={{ color: "#34D399", fontWeight: 800 }}>✓</span> SOC 2 Type II Compliant
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <span style={{ color: "#34D399", fontWeight: 800 }}>✓</span> End-to-End PII Encryption
                </li>
              </ul>
            </div>
          </div>

          {/* Compact Bottom Bar */}
          <div style={{
            paddingTop: "1.25rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.75rem",
            color: "#CCFBF1",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div>
              © 2026 ShopifyAI Ops Inc. All rights reserved.
            </div>

            <div style={{ display: "flex", gap: "1.5rem" }}>
              <span style={{ cursor: "pointer", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")} onMouseLeave={(e) => (e.currentTarget.style.color = "#CCFBF1")}>Privacy Policy</span>
              <span style={{ cursor: "pointer", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")} onMouseLeave={(e) => (e.currentTarget.style.color = "#CCFBF1")}>Terms of Service</span>
              <span style={{ cursor: "pointer", transition: "color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")} onMouseLeave={(e) => (e.currentTarget.style.color = "#CCFBF1")}>Security</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
