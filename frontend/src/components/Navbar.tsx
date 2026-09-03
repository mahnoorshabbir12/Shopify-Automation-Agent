import React from "react";

interface NavbarProps {
  onOpenConsole: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenConsole }) => {
  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      backgroundColor: "rgba(255, 255, 255, 0.85)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border-subtle)",
    }}>
      <div className="container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "72px"
      }}>
        {/* Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #008060 0%, #004C3F 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0, 128, 96, 0.25)"
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.0625rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              Shopify<span style={{ color: "var(--shopify-green)" }}>AI</span> Ops
            </div>
            <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Enterprise Automation
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <a href="#pipeline" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.15s" }}>
            Pipeline
          </a>
          <a href="#agents" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.15s" }}>
            AI Agents
          </a>
          <a href="#console" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.15s" }}>
            Live Operations
          </a>
          <a href="#architecture" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.15s" }}>
            Architecture
          </a>
        </nav>

        {/* Right CTA Area */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "0.35rem 0.75rem",
            borderRadius: "9999px",
            backgroundColor: "var(--shopify-green-light)",
            color: "var(--shopify-green)"
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} className="anim-pulse" />
            Active Operations
          </div>
          <button onClick={onOpenConsole} className="btn btn-primary" style={{ padding: "0.55rem 1.1rem", fontSize: "0.875rem" }}>
            Launch Console
          </button>
        </div>
      </div>
    </header>
  );
};
