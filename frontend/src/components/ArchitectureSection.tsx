import React, { useEffect, useState } from "react";

interface LayerData {
  id: number;
  badge: string;
  title: string;
  tagline: string;
  metric: string;
  accent: string;
  bgLight: string;
  details: string[];
}

const LAYERS: LayerData[] = [
  {
    id: 1,
    badge: "Source of Commerce",
    title: "Shopify Webhooks",
    tagline: "HMAC SHA-256 Verified Ingest",
    metric: "< 85ms ingest",
    accent: "var(--shopify-green)",
    bgLight: "var(--shopify-green-light)",
    details: ["Raw body HMAC signature validation", "Idempotent event absorption", "Zero unauthorized payload leakage"]
  },
  {
    id: 2,
    badge: "Control Plane",
    title: "FastAPI Gateway",
    tagline: "Owns Side Effects & Validation",
    metric: "Sub-200ms API tools",
    accent: "#0284C7",
    bgLight: "#E0F2FE",
    details: ["Pre-shared secret authentication", "3-Point COD agreement validation", "Exposes /tools/* to Retell AI"]
  },
  {
    id: 3,
    badge: "Orchestration",
    title: "LangGraph Engine",
    tagline: "Deterministic Routing & RAG",
    metric: "Pure state machine",
    accent: "#0D9488",
    bgLight: "#CCFBF1",
    details: ["Eliminates infinite looping", "Qdrant vector cosine retrieval", "Calculates 2h/24h/48h backoff delays"]
  },
  {
    id: 4,
    badge: "Persistence & I/O",
    title: "PostgreSQL + Retell",
    tagline: "SKIP LOCKED Queue + Plivo Outbound",
    metric: "100% ACID durable",
    accent: "#6366F1",
    bgLight: "#EEF2FF",
    details: ["Single-transaction order + job writes", "FOR UPDATE SKIP LOCKED worker claims", "Automatic escalation to UNREACHABLE"]
  }
];

export const ArchitectureSection: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);

  // Auto-cycle simulation if not manually paused
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLayer((prev) => (prev >= LAYERS.length ? 1 : prev + 1));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const triggerSimulation = () => {
    setIsSimulating(true);
    let step = 1;
    setActiveLayer(1);
    const stepInterval = setInterval(() => {
      step += 1;
      if (step <= LAYERS.length) {
        setActiveLayer(step);
      } else {
        clearInterval(stepInterval);
        setIsSimulating(false);
      }
    }, 700);
  };

  return (
    <section id="architecture" style={{
      scrollMarginTop: "90px",
      padding: "6rem 0",
      backgroundColor: "var(--bg-main)",
      borderBottom: "1px solid var(--border-subtle)",
      position: "relative",
      overflow: "hidden"
    }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div className="section-tag" style={{ justifyContent: "center" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} className="anim-pulse" />
            System Architecture
          </div>
          <h2 className="section-title">Engineered for Zero Data Loss</h2>
          <p className="section-desc" style={{ margin: "0 auto 1.75rem auto" }}>
            How our enterprise architecture ensures that orders, voice confirmations, and courier bookings remain strictly consistent without dual-write race conditions.
          </p>

          {/* Interactive Simulation CTA */}
          <button
            onClick={triggerSimulation}
            disabled={isSimulating}
            className="btn btn-secondary"
            style={{
              padding: "0.55rem 1.35rem",
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
              backgroundColor: isSimulating ? "var(--shopify-green)" : "var(--ai-cyan)"
            }} className={isSimulating ? "anim-pulse" : ""} />
            {isSimulating ? "Simulating Live Transaction Pipeline..." : "▶ Simulate Data Ingest Pulse"}
          </button>
        </div>

        {/* Visual Architecture Card */}
        <div style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "16px",
          padding: "3.5rem 2.5rem",
          boxShadow: "var(--shadow-md)",
          position: "relative"
        }}>
          {/* Animated Connecting SVG Stream Beam (Desktop) */}
          <div style={{ position: "relative", marginBottom: "3.5rem" }}>
            <svg
              style={{
                position: "absolute",
                top: "50%",
                left: "5%",
                width: "90%",
                height: "24px",
                transform: "translateY(-50%)",
                zIndex: 1,
                pointerEvents: "none"
              }}
              viewBox="0 0 1000 24"
              fill="none"
            >
              <line
                x1="20"
                y1="12"
                x2="980"
                y2="12"
                stroke="var(--border-subtle)"
                strokeWidth="3"
                strokeDasharray="8 8"
              />
              {/* Traveling Glowing Stream Particle */}
              <circle r="6" fill="var(--shopify-green)">
                <animate
                  attributeName="cx"
                  from="20"
                  to="980"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.2; 1; 1; 0.2"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Secondary Traveling Glow */}
              <circle r="4" fill="#0284C7">
                <animate
                  attributeName="cx"
                  from="20"
                  to="980"
                  dur="2.8s"
                  begin="1.4s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>

            {/* The 4 Architectural Layer Cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.5rem",
              position: "relative",
              zIndex: 2
            }}>
              {LAYERS.map((layer) => {
                const isActive = layer.id === activeLayer;

                return (
                  <div
                    key={layer.id}
                    onClick={() => setActiveLayer(layer.id)}
                    style={{
                      padding: "1.75rem 1.5rem",
                      borderRadius: "14px",
                      backgroundColor: isActive ? "#FFFFFF" : "var(--bg-main)",
                      border: isActive ? `2px solid ${layer.accent}` : "1px solid var(--border-subtle)",
                      boxShadow: isActive ? `0 16px 32px -6px rgba(15, 23, 42, 0.12), 0 0 0 4px ${layer.bgLight}` : "var(--shadow-sm)",
                      transform: isActive ? "translateY(-8px) scale(1.02)" : "translateY(0px)",
                      transition: "all 0.35s var(--ease-spring)",
                      cursor: "pointer",
                      position: "relative"
                    }}
                  >
                    {/* Non-overlapping Two-Row Header */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      marginBottom: "1rem"
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.5rem"
                      }}>
                        <span style={{
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--text-muted)"
                        }}>
                          LAYER 0{layer.id}
                        </span>

                        <span style={{
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          color: layer.accent,
                          fontFamily: "var(--font-mono)",
                          backgroundColor: layer.bgLight,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          border: `1px solid ${isActive ? layer.accent : "transparent"}`,
                          whiteSpace: "nowrap"
                        }}>
                          {layer.metric}
                        </span>
                      </div>

                      <div>
                        <span style={{
                          display: "inline-block",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "4px",
                          backgroundColor: isActive ? layer.bgLight : "var(--bg-surface)",
                          color: isActive ? layer.accent : "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)"
                        }}>
                          {layer.badge}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: "1.1875rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
                      {layer.title}
                    </div>

                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                      {layer.tagline}
                    </div>

                    {/* Feature Details list */}
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {layer.details.map((item, idx) => (
                        <li key={idx} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                          <span style={{ color: layer.accent, fontWeight: 800 }}>•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technical Explanations Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2rem",
            paddingTop: "2.5rem",
            borderTop: "1px solid var(--border-subtle)"
          }}>
            <div style={{
              padding: "1rem",
              borderRadius: "8px",
              transition: "background-color 0.2s"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  backgroundColor: "var(--shopify-green-light)",
                  color: "var(--shopify-green)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 800
                }}>1</span>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>
                  No Dual-Write Race Conditions
                </div>
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Shopify orders and their confirmation tasks are stored together in a single PostgreSQL transaction. Even if the worker restarts, tasks remain durable.
              </div>
            </div>

            <div style={{
              padding: "1rem",
              borderRadius: "8px",
              transition: "background-color 0.2s"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  backgroundColor: "var(--ai-cyan-light)",
                  color: "var(--ai-cyan)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 800
                }}>2</span>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>
                  Sub-200ms Voice Tool Latency
                </div>
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Retell AI queries our FastAPI tools directly using pre-shared secrets. In-process vector indexing ensures immediate answers during phone conversations.
              </div>
            </div>

            <div style={{
              padding: "1rem",
              borderRadius: "8px",
              transition: "background-color 0.2s"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  backgroundColor: "#EEF2FF",
                  color: "#6366F1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 800
                }}>3</span>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>
                  Idempotent Retry Engine
                </div>
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
