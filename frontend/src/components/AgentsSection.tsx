import React, { useState } from "react";

export const AgentsSection: React.FC = () => {
  const [activeSync, setActiveSync] = useState(false);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  const triggerSync = () => {
    setActiveSync(true);
    setTimeout(() => setActiveSync(false), 2400);
  };

  return (
    <section id="agents" style={{
      scrollMarginTop: "90px",
      padding: "3.5rem 0",
      backgroundColor: "var(--bg-main)",
      borderBottom: "1px solid var(--border-subtle)",
      position: "relative",
      overflow: "hidden"
    }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div className="section-tag" style={{ justifyContent: "center" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--ai-cyan)" }} className="anim-pulse" />
            Specialized Neural Agents
          </div>
          <h2 className="section-title">Three Specialized AI Agents</h2>
          <p className="section-desc" style={{ margin: "0 auto 1.25rem auto" }}>
            Purpose-built agents designed for e-commerce reliability. Each agent delivers automated precision across the customer lifecycle.
          </p>

          {/* Interactive 3D Sync Trigger */}
          <button
            onClick={triggerSync}
            className="btn btn-secondary"
            style={{
              padding: "0.45rem 1.2rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              gap: "0.5rem",
              borderRadius: "9999px"
            }}
          >
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: activeSync ? "var(--shopify-green)" : "var(--ai-cyan)"
            }} className="anim-pulse" />
            {activeSync ? "Synchronizing Neural Mesh..." : "⚡ Pulse Neural Agent Sync"}
          </button>
        </div>

        {/* 3D Holographic AI Orchestration Core & Laser Conduits */}
        <div style={{
          position: "relative",
          width: "100%",
          height: "170px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: "1200px"
        }}>
          {/* Ambient Glow */}
          <div style={{
            position: "absolute",
            width: "380px",
            height: "140px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(2, 132, 199, 0.15) 0%, rgba(0, 128, 96, 0.1) 50%, transparent 70%)",
            filter: "blur(30px)",
            zIndex: 1,
            pointerEvents: "none"
          }} />

          {/* SVG Animated Conduits Downward to the 3 Cards */}
          <svg style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            zIndex: 2,
            pointerEvents: "none"
          }} viewBox="0 0 1000 170" fill="none">
            {/* Conduit 1: Center Core to Card 1 (Left: x=170, y=170) */}
            <path
              d="M 500 85 C 380 85, 260 110, 170 170"
              stroke="#008060"
              strokeWidth={hoveredAgent === "voice" || activeSync ? "2.5" : "1.75"}
              strokeDasharray="5 5"
              opacity={hoveredAgent === "voice" || activeSync ? "0.95" : "0.4"}
            />
            <circle r="4" fill="#008060">
              <animateMotion
                path="M 500 85 C 380 85, 260 110, 170 170"
                dur={activeSync ? "1s" : "2.6s"}
                repeatCount="indefinite"
              />
            </circle>

            {/* Conduit 2: Center Core to Card 2 (Center: x=500, y=170) */}
            <path
              d="M 500 85 L 500 170"
              stroke="#0284C7"
              strokeWidth={hoveredAgent === "support" || activeSync ? "2.5" : "1.75"}
              strokeDasharray="5 5"
              opacity={hoveredAgent === "support" || activeSync ? "0.95" : "0.4"}
            />
            <circle r="4" fill="#0284C7">
              <animateMotion
                path="M 500 85 L 500 170"
                dur={activeSync ? "0.9s" : "2.2s"}
                repeatCount="indefinite"
              />
            </circle>

            {/* Conduit 3: Center Core to Card 3 (Right: x=830, y=170) */}
            <path
              d="M 500 85 C 620 85, 740 110, 830 170"
              stroke="#0D9488"
              strokeWidth={hoveredAgent === "shipping" || activeSync ? "2.5" : "1.75"}
              strokeDasharray="5 5"
              opacity={hoveredAgent === "shipping" || activeSync ? "0.95" : "0.4"}
            />
            <circle r="4" fill="#0D9488">
              <animateMotion
                path="M 500 85 C 620 85, 740 110, 830 170"
                dur={activeSync ? "1s" : "2.8s"}
                repeatCount="indefinite"
              />
            </circle>
          </svg>

          {/* Central Static Round AI Core Globe */}
          <div style={{
            position: "relative",
            width: "140px",
            height: "140px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3
          }}>
            {/* Subtle Static Outer Ambient Ring */}
            <div style={{
              position: "absolute",
              width: "108px",
              height: "108px",
              borderRadius: "50%",
              border: "1.5px solid rgba(2, 132, 199, 0.15)",
              backgroundColor: "rgba(224, 242, 254, 0.3)"
            }} />

            {/* Static Clean Round AI Globe */}
            <div
              style={{
                width: "76px",
                height: "76px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0284C7 0%, #008060 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                boxShadow: "0 8px 24px rgba(2, 132, 199, 0.22), 0 0 0 5px rgba(255, 255, 255, 0.95)",
                textAlign: "center",
                position: "relative",
                zIndex: 2
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span style={{ fontSize: "0.5625rem", fontWeight: 800, letterSpacing: "0.06em", marginTop: "0.2rem" }}>
                AI CORE
              </span>
            </div>
          </div>
        </div>

        {/* 3 Premium Agent Cards with 3D Elevation & Micro-Widgets */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "2rem",
          marginTop: "0.5rem"
        }}>
          {/* Card 1: Order Confirmation Agent */}
          <div
            className="surface-card"
            style={{
              padding: "2.5rem 2rem",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "all 0.3s ease",
              transform: hoveredAgent === "voice" || activeSync ? "translateY(-8px) scale(1.015)" : "translateY(0px)",
              boxShadow: hoveredAgent === "voice" || activeSync ? "0 16px 36px rgba(0, 128, 96, 0.18)" : "var(--shadow-sm)",
              border: hoveredAgent === "voice" || activeSync ? "1px solid var(--shopify-green)" : "1px solid var(--border-subtle)"
            }}
            onMouseEnter={() => setHoveredAgent("voice")}
            onMouseLeave={() => setHoveredAgent(null)}
          >
            <div>
              {/* Header Icon, 3D Waveform Indicator & Tag */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
                  {/* Miniature Animated Equalizer Bars */}
                  <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "18px" }}>
                    {[0.3, 0.8, 1.0, 0.6, 0.4].map((h, i) => (
                      <span
                        key={i}
                        style={{
                          width: "3px",
                          height: `${h * 18}px`,
                          backgroundColor: "var(--shopify-green)",
                          borderRadius: "1px",
                          animation: `soundBarPulse ${0.6 + i * 0.25}s ease-in-out infinite alternate`
                        }}
                      />
                    ))}
                  </div>
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
                  Automatically dials customers via AI Voice Telephony
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
              CAPABILITY: CONVERSATIONAL VOICE + WORKFLOW ORCHESTRATION
            </div>
          </div>

          {/* Card 2: Customer Support Agent */}
          <div
            className="surface-card"
            style={{
              padding: "2.5rem 2rem",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "all 0.3s ease",
              transform: hoveredAgent === "support" || activeSync ? "translateY(-8px) scale(1.015)" : "translateY(0px)",
              boxShadow: hoveredAgent === "support" || activeSync ? "0 16px 36px rgba(2, 132, 199, 0.18)" : "var(--shadow-sm)",
              border: hoveredAgent === "support" || activeSync ? "1px solid var(--ai-cyan)" : "1px solid var(--border-subtle)"
            }}
            onMouseEnter={() => setHoveredAgent("support")}
            onMouseLeave={() => setHoveredAgent(null)}
          >
            <div>
              {/* Header Icon, 3D Vector Emblem & Tag */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
                  {/* Miniature 3D Rotating Vector Node */}
                  <div className="anim-spin-slow" style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid var(--ai-cyan)",
                    borderRadius: "3px",
                    transform: "rotate(45deg)"
                  }} />
                </div>
                <span className="pill pill-calling">
                  ● Neural Knowledge RAG
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
                  Uses unified enterprise policy knowledge base
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
              CAPABILITY: SEMANTIC SEARCH + REAL-TIME STORE ACTIONS
            </div>
          </div>

          {/* Card 3: Shipping Agent */}
          <div
            className="surface-card"
            style={{
              padding: "2.5rem 2rem",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "all 0.3s ease",
              transform: hoveredAgent === "shipping" || activeSync ? "translateY(-8px) scale(1.015)" : "translateY(0px)",
              boxShadow: hoveredAgent === "shipping" || activeSync ? "0 16px 36px rgba(13, 148, 136, 0.18)" : "var(--shadow-sm)",
              border: hoveredAgent === "shipping" || activeSync ? "1px solid var(--ai-teal)" : "1px solid var(--border-subtle)"
            }}
            onMouseEnter={() => setHoveredAgent("shipping")}
            onMouseLeave={() => setHoveredAgent(null)}
          >
            <div>
              {/* Header Icon, 3D Radar Scanner & Tag */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
                      <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                  {/* Miniature Radar Scanner */}
                  <div style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: "1.5px solid var(--ai-teal)",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <div className="anim-radar" style={{
                      width: "100%",
                      height: "1px",
                      background: "linear-gradient(90deg, transparent, var(--ai-teal))",
                      position: "absolute"
                    }} />
                  </div>
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
              CAPABILITY: MULTI-CARRIER RATE OPTIMIZATION & AUTO-BOOKING
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
