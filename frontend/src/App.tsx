import React from "react";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { WorkflowSection } from "./components/WorkflowSection";
import { AgentsSection } from "./components/AgentsSection";
import { OperationsConsole } from "./components/OperationsConsole";
import { ArchitectureSection } from "./components/ArchitectureSection";
import { Footer } from "./components/Footer";

export const App: React.FC = () => {
  const scrollToConsole = () => {
    const el = document.getElementById("console");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navigation */}
      <Navbar onOpenConsole={scrollToConsole} />

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {/* 1. Hero Section with 3D Automation Pipeline */}
        <HeroSection />

        {/* 2. Automation in Action 2.5D Workflow */}
        <WorkflowSection />

        {/* 3. Three Specialized AI Agents */}
        <AgentsSection />

        {/* 4. Real-Time Operations Section & Live Order Queue */}
        <OperationsConsole />

        {/* 5. Clean Visual Architecture Section */}
        <ArchitectureSection />
      </main>

      {/* Enterprise Footer */}
      <Footer />
    </div>
  );
};

export default App;
