import React, { useEffect, useState } from "react";

interface WorkflowStage {
  id: number;
  label: string;
  subtext: string;
  actor: "Shopify" | "AI Agent" | "Customer" | "Logistics";
  iconType: string;
}

const STAGES: WorkflowStage[] = [
  { id: 1, label: "NEW ORDER", subtext: "Idempotent Webhook Received", actor: "Shopify", iconType: "order" },
  { id: 2, label: "Confirmation Agent", subtext: "Intelligent State Routing", actor: "AI Agent", iconType: "agent" },
  { id: 3, label: "Customer Call", subtext: "Conversational Voice Turn", actor: "Customer", iconType: "phone" },
  { id: 4, label: "CONFIRMED", subtext: "Address + Amount + Intent", actor: "AI Agent", iconType: "check" },
  { id: 5, label: "Shipping Agent", subtext: "Carrier Rules Engine", actor: "AI Agent", iconType: "truck" },
  { id: 6, label: "Courier Selected", subtext: "TCS / PostEx / BlueEX", actor: "Logistics", iconType: "routing" },
  { id: 7, label: "Shipment Booked", subtext: "AWB Generated Instantly", actor: "Logistics", iconType: "barcode" },
  { id: 8, label: "Tracking Updated", subtext: "Fulfillment Sync to Shopify", actor: "Shopify", iconType: "sync" },
];

export const WorkflowSection: React.FC = () => {
  const [activeStage, setActiveStage] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev >= STAGES.length ? 1 : prev + 1));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="pipeline" style={{
      scrollMarginTop: "90px",
      padding: "3.5rem 0",
      backgroundColor: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)"
    }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="section-tag" style={{ justifyContent: "center" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} />
            Autonomous Pipeline
          </div>
          <h2 className="section-title">Automation in Action</h2>
          <p className="section-desc" style={{ margin: "0 auto" }}>
            Watch an order progress seamlessly from a Shopify webhook, through intelligent voice confirmation, to courier booking without human intervention.
          </p>
        </div>

        {/* 2.5D Workflow Interactive Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.25rem",
          position: "relative"
        }}>
          {STAGES.map((stage) => {
            const isActive = stage.id === activeStage;
            const isCompleted = stage.id < activeStage;

            return (
              <div
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                style={{
                  padding: "1.25rem 1.5rem",
                  borderRadius: "12px",
                  border: isActive ? "2px solid var(--shopify-green)" : "1px solid var(--border-subtle)",
                  backgroundColor: isActive ? "var(--shopify-green-light)" : "var(--bg-main)",
                  boxShadow: isActive ? "var(--shadow-lg)" : "var(--shadow-sm)",
                  transform: isActive ? "translateY(-6px) scale(1.02)" : "translateY(0px)",
                  transition: "all 0.35s var(--ease-spring)",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Active Glowing Pulse Bar */}
                {isActive && (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "var(--shopify-green)"
                  }} />
                )}

                {/* Stage Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "4px",
                    backgroundColor: isActive ? "#FFFFFF" : "var(--bg-surface)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-subtle)"
                  }}>
                    STEP 0{stage.id}
                  </span>

                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: isActive ? "var(--shopify-green)" : isCompleted ? "#0D9488" : "var(--text-muted)"
                  }}>
                    {isCompleted ? "✓ Completed" : isActive ? "● Active Step" : "Pending"}
                  </span>
                </div>

                {/* Stage Name */}
                <div style={{
                  fontSize: "1.0625rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "0.25rem"
                }}>
                  {stage.label}
                </div>

                {/* Subtext */}
                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  {stage.subtext}
                </div>

                {/* Actor badge */}
                <div style={{ marginTop: "1rem", display: "inline-block", fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)" }}>
                  LAYER: {stage.actor.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
