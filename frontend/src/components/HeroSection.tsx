import React, { useState } from "react";

export const HeroSection: React.FC = () => {
  const [activeHoverNode, setActiveHoverNode] = useState<string | null>(null);

  return (
    <section style={{
      position: "relative",
      padding: "5rem 0 6rem 0",
      overflow: "hidden",
      borderBottom: "1px solid var(--border-subtle)",
      background: "radial-gradient(circle at 80% 20%, rgba(224, 242, 254, 0.4) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(230, 244, 234, 0.35) 0%, transparent 40%)"
    }}>
      <div className="container" style={{
        display: "grid",
        gridTemplateColumns: "1.05fr 1.15fr",
        gap: "3.5rem",
        alignItems: "center"
      }}>
        {/* Left Copy Area */}
        <div>
          {/* Eyebrow badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.35rem 0.85rem",
            borderRadius: "9999px",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "1.5rem"
          }}>
            <span style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "var(--shopify-green)"
            }} className="anim-pulse" />
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)" }}>
              Phase 1 Live • Autonomous COD Verification
            </span>
          </div>

          <h1 style={{
            fontSize: "3.5rem",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.035em",
            color: "var(--text-primary)",
            marginBottom: "1.5rem"
          }}>
            Automate Your Shopify Operations <span style={{
              background: "linear-gradient(135deg, var(--shopify-green) 0%, #0D9488 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>With AI.</span>
          </h1>

          <p style={{
            fontSize: "1.1875rem",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            marginBottom: "2.5rem",
            maxWidth: "540px"
          }}>
            AI agents that confirm orders, support customers, and automate shipping — so your team can focus on growth.
          </p>

          {/* Action CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <a href="#console" className="btn btn-green" style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}>
              Start Automating
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
            <a href="#pipeline" className="btn btn-secondary" style={{ padding: "0.9rem 1.75rem", fontSize: "1rem" }}>
              See How It Works
            </a>
          </div>

          {/* Trust Metric Badges */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
            marginTop: "3.5rem",
            paddingTop: "2rem",
            borderTop: "1px solid var(--border-subtle)"
          }}>
            <div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                94.8%
              </div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)", marginTop: "0.15rem" }}>
                Auto-Confirmed
              </div>
            </div>
            <div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                &lt; 2.5 min
              </div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)", marginTop: "0.15rem" }}>
                Call Placement Speed
              </div>
            </div>
            <div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                -42%
              </div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)", marginTop: "0.15rem" }}>
                Courier RTO Losses
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: 3D Interactive Automation Pipeline Visualization */}
        <div style={{
          position: "relative",
          width: "100%",
          height: "540px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: "1200px"
        }}>
          {/* Ambient Glow Circles */}
          <div style={{
            position: "absolute",
            width: "360px",
            height: "360px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, rgba(0, 128, 96, 0.08) 50%, transparent 70%)",
            filter: "blur(40px)",
            zIndex: 1
          }} />

          {/* SVG Animated Flow Path */}
          <svg style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            zIndex: 2,
            pointerEvents: "none"
          }} viewBox="0 0 600 500" fill="none">
            <path
              d="M 90 250 C 160 140, 240 180, 300 250 C 360 320, 440 280, 510 250"
              stroke="#E2E8F0"
              strokeWidth="2.5"
              strokeDasharray="6 6"
            />
            {/* Animated Travelling Particle 1 */}
            <circle r="4.5" fill="#008060">
              <animateMotion
                path="M 90 250 C 160 140, 240 180, 300 250 C 360 320, 440 280, 510 250"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Animated Travelling Particle 2 */}
            <circle r="4" fill="#0284C7">
              <animateMotion
                path="M 90 250 C 160 140, 240 180, 300 250 C 360 320, 440 280, 510 250"
                dur="4s"
                begin="2s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>

          {/* Floating Node 1: Shopify Order Card */}
          <div
            className="surface-card anim-float"
            onMouseEnter={() => setActiveHoverNode("order")}
            onMouseLeave={() => setActiveHoverNode(null)}
            style={{
              position: "absolute",
              top: "205px",
              left: "20px",
              padding: "1rem",
              width: "160px",
              zIndex: 3,
              transform: activeHoverNode === "order" ? "scale(1.08) translateY(-10px)" : undefined,
              transition: "transform 0.3s var(--ease-spring)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                backgroundColor: "var(--shopify-green-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--shopify-green)"
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--shopify-green)" }}>
                NEW ORDER
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
              #10482
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              PKR 4,200 (COD)
            </div>
          </div>

          {/* Floating Node 2: Central 3D AI Neural Orb Core */}
          <div
            className="surface-card"
            style={{
              position: "absolute",
              top: "165px",
              left: "225px",
              width: "155px",
              height: "155px",
              borderRadius: "50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 4,
              border: "1.5px solid rgba(2, 132, 199, 0.35)",
              boxShadow: "0 12px 32px rgba(2, 132, 199, 0.18), 0 0 0 8px rgba(224, 242, 254, 0.55)",
              padding: "0.5rem"
            }}
          >
            {/* Spinning Outer Ring */}
            <div className="anim-spin-slow" style={{
              position: "absolute",
              width: "135px",
              height: "135px",
              borderRadius: "50%",
              border: "2px dashed #0284C7",
              opacity: 0.45
            }} />

            {/* AI Core Icon */}
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.35)",
              marginBottom: "0.35rem",
              position: "relative",
              zIndex: 2
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>

            <div style={{ textAlign: "center", position: "relative", zIndex: 2, lineHeight: 1.25 }}>
              <div style={{ fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "0.03em" }}>
                AI ORCHESTRATOR
              </div>
              <div style={{ fontSize: "0.5625rem", fontWeight: 700, color: "var(--ai-cyan)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                NEURAL CORE
              </div>
            </div>
          </div>

          {/* Floating Node 3: Customer Voice Verification Card (Top Right) */}
          <div
            className="surface-card anim-float-alt"
            style={{
              position: "absolute",
              top: "60px",
              right: "40px",
              padding: "0.85rem 1rem",
              width: "190px",
              zIndex: 3
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "var(--ai-cyan-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ai-cyan)"
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <span className="pill pill-confirmed" style={{ fontSize: "0.6875rem", padding: "0.15rem 0.5rem" }}>
                ✓ 3-Point Verified
              </span>
            </div>
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Zainab Tariq
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              Address & Amount Confirmed
            </div>
          </div>

          {/* Floating Node 4: Shipping Logistics & AWB (Bottom Right) */}
          <div
            className="surface-card anim-float"
            style={{
              position: "absolute",
              bottom: "70px",
              right: "30px",
              padding: "0.85rem 1rem",
              width: "190px",
              zIndex: 3
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)" }}>
                COURIER AWB
              </span>
              <span style={{
                fontSize: "0.6875rem",
                fontWeight: 800,
                color: "#1E3A8A",
                backgroundColor: "#DBEAFE",
                padding: "0.15rem 0.4rem",
                borderRadius: "4px"
              }}>
                TCS EXPRESS
              </span>
            </div>
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
              TCS-77291048
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--shopify-green)", fontWeight: 600, marginTop: "0.2rem" }}>
              ● Ready for Dispatch
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
