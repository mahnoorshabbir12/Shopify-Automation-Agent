import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: "var(--bg-surface)",
      borderTop: "1px solid var(--border-subtle)",
      padding: "4rem 0 3rem 0"
    }}>
      <div className="container" style={{
        display: "flex",
        flexDirection: "column",
        gap: "2.5rem"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5rem"
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--text-primary)" }}>
              Shopify<span style={{ color: "var(--shopify-green)" }}>AI</span> Ops
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Autonomous Order Confirmation, Customer Support & Logistics Orchestration
            </div>
          </div>

          <div style={{ display: "flex", gap: "2rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            <a href="#pipeline" style={{ color: "inherit", textDecoration: "none" }}>Pipeline</a>
            <a href="#agents" style={{ color: "inherit", textDecoration: "none" }}>AI Agents</a>
            <a href="#console" style={{ color: "inherit", textDecoration: "none" }}>Operations Console</a>
            <a href="#architecture" style={{ color: "inherit", textDecoration: "none" }}>Architecture</a>
          </div>
        </div>

        <div style={{
          paddingTop: "2rem",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div>
            © 2026 Shopify Automation Agent. Built with FastAPI, LangGraph, Qdrant, and React.
          </div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <span>Module 1.10 Phase 1 Complete</span>
            <span>● All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
