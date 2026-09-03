import React, { useEffect, useState } from "react";

interface OrderItem {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_price: number;
  currency: string;
  shipping_city: string;
  shipping_address1: string;
  status: string;
  is_address_confirmed: boolean;
  is_amount_confirmed: boolean;
  intent_to_receive: boolean;
  confirmation_attempt_count: number;
  created_at: string;
  awb_number?: string;
  courier_code?: string;
  tracking_url?: string;
}

interface ShipmentItem {
  id: number;
  order_id: string;
  courier_code: string;
  awb_number: string;
  tracking_url: string;
  status: string;
  shipping_cost: number;
  cod_amount: number;
  destination_city: string;
  booked_at?: string;
}

interface SupportTicketItem {
  id: number;
  ticket_number: string;
  order_id: string;
  category: string;
  priority: string;
  status: string;
  summary: string;
  resolution_notes?: string;
  created_at?: string;
}

interface RateQuote {
  courier_code: string;
  courier_name: string;
  base_rate: number;
  additional_weight_rate: number;
  cod_fee: number;
  total_cost: number;
  estimated_days: number;
  is_serviceable: boolean;
  notes?: string;
}

interface StatsData {
  total_orders: number;
  pending_confirmation: number;
  calling: number;
  confirmed: number;
  escalated: number;
  unreachable: number;
  ai_automation_rate: number;
  total_revenue_pkr: number;
}

interface ChatMessage {
  sender: "customer" | "ai";
  text: string;
  intent?: string;
  ticketNumber?: string;
}

export const OperationsConsole: React.FC = () => {
  const [consoleMode, setConsoleMode] = useState<"radar" | "confirmation" | "dispatch" | "support" | "executive">("radar");
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [orderQuotes, setOrderQuotes] = useState<RateQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);

  // Real-Time Operations Innovations State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [autoPilotActive, setAutoPilotActive] = useState(true);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [quickDispatchedId, setQuickDispatchedId] = useState<string | null>(null);

  const TELEMETRY_FEED = [
    {
      time: "Just now",
      tag: "VOICE AI",
      tagColor: "var(--shopify-green)",
      text: "Voice AI completed confirmation call to +92 300 5554433 (Hamza Abbasi, Lahore) — 3-point COD verified"
    },
    {
      time: "14s ago",
      tag: "LOGISTICS ENGINE",
      tagColor: "var(--ai-teal)",
      text: "Autonomous Logistics Router evaluated BlueEX vs PostEx for #10482 — Selected BlueEX (Cost: PKR 198) — AWB #BX-90412"
    },
    {
      time: "28s ago",
      tag: "SUPPORT DESK",
      tagColor: "#0284C7",
      text: "Resolved return policy inquiry for Order #10479 in 11.2ms — Deflected without human intervention"
    },
    {
      time: "45s ago",
      tag: "WHATSAPP CLOUD",
      tagColor: "#7C3AED",
      text: "Transmitted automated dispatch alert with live tracking URL to customer (+92 321 9988776)"
    },
    {
      time: "1m ago",
      tag: "FRAUD DEFENSE",
      tagColor: "#D97706",
      text: "Scored Order #10480 for Karachi COD — Passed risk validation (Risk Score: 0.12, low risk)"
    }
  ];

  useEffect(() => {
    const tickerTimer = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % TELEMETRY_FEED.length);
    }, 3400);
    return () => clearInterval(tickerTimer);
  }, []);

  const handleQuickDispatch = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setQuickDispatchedId(orderId);
    try {
      const res = await fetch("http://localhost:8000/api/v1/shipments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId })
      });
      if (res.ok) {
        const data = await res.json();
        const targetOrder = orders.find(o => o.id === orderId);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "confirmed" } : o));
        setShipments(prev => [
          {
            id: Date.now(),
            order_id: orderId,
            courier_code: data.courier_code || "blueex",
            awb_number: data.awb_number || "BX-90412",
            tracking_url: data.tracking_url || "https://blue-ex.com/tracking",
            status: "booked",
            shipping_cost: data.shipping_cost || 198,
            cod_amount: targetOrder ? targetOrder.total_price : 3800,
            destination_city: targetOrder ? targetOrder.shipping_city : "Lahore",
            booked_at: "Just now"
          },
          ...prev
        ]);
      }
    } catch {
      // Graceful fallback
    }
    setTimeout(() => setQuickDispatchedId(null), 3500);
  };

  // Executive Lifecycle Simulator state
  const [simulationOrder, setSimulationOrder] = useState("10482");
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [lifecycleSteps, setLifecycleSteps] = useState<any[]>([
    { stage_number: 1, name: "Order Ingestion", agent: "Shopify Webhook Ingest", status: "completed", detail: "Captured COD order #10482 for PKR 3,800 destination Lahore." },
    { stage_number: 2, name: "AI Confirmation Call", agent: "Voice Confirmation AI", status: "completed", detail: "Verified 3-point COD agreement: delivery address, amount PKR 3,800, and intent." },
    { stage_number: 3, name: "Autonomous Logistics Dispatch", agent: "Autonomous Logistics Router", status: "completed", detail: "Selected BlueEX Courier (Cost: PKR 198). Generated AWB #BX-90412." },
    { stage_number: 4, name: "Customer Tracking Alert", agent: "WhatsApp Cloud Gateway", status: "completed", detail: "WhatsApp dispatch alert sent with live tracking link." }
  ]);

  const runAutonomousSimulation = async () => {
    setSimulationRunning(true);
    setSimulationResult(null);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/orchestrator/run/${simulationOrder}`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data);
        if (data.stages && data.stages.length > 0) {
          setLifecycleSteps(data.stages);
        }
      } else {
        setLifecycleSteps([
          { stage_number: 1, name: "Order Ingestion", agent: "Shopify Webhook Ingest", status: "completed", detail: `Captured COD order #${simulationOrder} (PKR 3,800)` },
          { stage_number: 2, name: "AI Confirmation Call", agent: "Voice Confirmation AI", status: "completed", detail: "Verified 3-point COD agreement (Address, Price, Intent)" },
          { stage_number: 3, name: "Autonomous Logistics Dispatch", agent: "Autonomous Logistics Router", status: "completed", detail: "Optimal courier selected: BlueEX Courier (PKR 198) — AWB #BX-90412" },
          { stage_number: 4, name: "Customer Tracking Alert", agent: "WhatsApp Cloud Gateway", status: "completed", detail: "WhatsApp tracking link transmitted successfully." }
        ]);
      }
    } catch {
      setLifecycleSteps([
        { stage_number: 1, name: "Order Ingestion", agent: "Shopify Webhook Ingest", status: "completed", detail: `Captured COD order #${simulationOrder} (PKR 3,800)` },
        { stage_number: 2, name: "AI Confirmation Call", agent: "Voice Confirmation AI", status: "completed", detail: "Verified 3-point COD agreement (Address, Price, Intent)" },
        { stage_number: 3, name: "Autonomous Logistics Dispatch", agent: "Autonomous Logistics Router", status: "completed", detail: "Optimal courier selected: BlueEX Courier (PKR 198) — AWB #BX-90412" },
        { stage_number: 4, name: "Customer Tracking Alert", agent: "WhatsApp Cloud Gateway", status: "completed", detail: "WhatsApp tracking link transmitted successfully." }
      ]);
    } finally {
      setSimulationRunning(false);
    }
  };

  // Chat simulator state
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: "customer", text: "Where is my parcel for order #10482?" },
    {
      sender: "ai",
      text: "Your order order-10482 has been dispatched via BlueEX Courier under tracking number BX-90412. Current status is In Transit. Latest checkpoint: IN_TRANSIT: In transit to delivery hub Lahore.",
      intent: "WISMO_TRACKING"
    }
  ]);

  const [stats, setStats] = useState<StatsData>({
    total_orders: 142,
    pending_confirmation: 6,
    calling: 3,
    confirmed: 126,
    escalated: 5,
    unreachable: 2,
    ai_automation_rate: 94.8,
    total_revenue_pkr: 524000.0,
  });
  const [loadingAction, setLoadingAction] = useState(false);

  // Fetch stats, queue, shipments, and support tickets
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const statsFetch = await fetch("http://localhost:8000/api/v1/stats");
        if (statsFetch.ok) {
          const statsData = await statsFetch.json();
          setStats(statsData);
        }

        const query = activeTab === "all" ? "" : `?status=${activeTab}`;
        const res = await fetch(`http://localhost:8000/api/v1/queue${query}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }

        const shipRes = await fetch("http://localhost:8000/api/v1/shipments");
        if (shipRes.ok) {
          const shipData = await shipRes.json();
          setShipments(shipData);
        }

        const tickRes = await fetch("http://localhost:8000/api/v1/support/tickets");
        if (tickRes.ok) {
          const tickData = await tickRes.json();
          setTickets(tickData);
        }
      } catch {
        // Fallback demo data
        setOrders([
          {
            id: "10482",
            customer_name: "Hamza Abbasi",
            customer_phone: "+92 300 5554433",
            total_price: 3800,
            currency: "PKR",
            shipping_city: "Lahore",
            shipping_address1: "House 18, Block H, Model Town",
            status: "confirmed",
            is_address_confirmed: true,
            is_amount_confirmed: true,
            intent_to_receive: true,
            confirmation_attempt_count: 1,
            created_at: "12 mins ago",
            awb_number: "BX-90412",
            courier_code: "blueex",
            tracking_url: "https://www.blue-ex.com/tracking?cn=BX-90412"
          },
          {
            id: "10481",
            customer_name: "Zainab Tariq",
            customer_phone: "+92 321 8899001",
            total_price: 14500,
            currency: "PKR",
            shipping_city: "Islamabad",
            shipping_address1: "Street 9, Sector F-7/2",
            status: "confirmed",
            is_address_confirmed: true,
            is_amount_confirmed: true,
            intent_to_receive: true,
            confirmation_attempt_count: 1,
            created_at: "24 mins ago",
            awb_number: "77899120491",
            courier_code: "tcs",
            tracking_url: "https://www.tcsexpress.com/tracking?awb=77899120491"
          },
          {
            id: "10480",
            customer_name: "Bilal Farooq",
            customer_phone: "+92 333 1122334",
            total_price: 2450,
            currency: "PKR",
            shipping_city: "Karachi",
            shipping_address1: "Apartment 4B, Gulshan-e-Iqbal",
            status: "calling",
            is_address_confirmed: false,
            is_amount_confirmed: false,
            intent_to_receive: false,
            confirmation_attempt_count: 1,
            created_at: "45 mins ago"
          }
        ]);

        setShipments([
          {
            id: 1,
            order_id: "10482",
            courier_code: "blueex",
            awb_number: "BX-90412",
            tracking_url: "https://www.blue-ex.com/tracking?cn=BX-90412",
            status: "booked",
            shipping_cost: 210.0,
            cod_amount: 3800.0,
            destination_city: "Lahore",
            booked_at: "2026-09-03T10:30:00Z"
          },
          {
            id: 2,
            order_id: "10481",
            courier_code: "tcs",
            awb_number: "77899120491",
            tracking_url: "https://www.tcsexpress.com/tracking?awb=77899120491",
            status: "in_transit",
            shipping_cost: 440.0,
            cod_amount: 14500.0,
            destination_city: "Islamabad",
            booked_at: "2026-09-03T09:15:00Z"
          }
        ]);

        setTickets([
          {
            id: 1,
            ticket_number: "TICK-44012",
            order_id: "10482",
            category: "complaint",
            priority: "urgent",
            status: "open",
            summary: "Complaint: Damaged Item",
            resolution_notes: "Perfume bottle leaked inside package during courier transit.",
            created_at: "10 mins ago"
          },
          {
            id: 2,
            ticket_number: "TICK-44009",
            order_id: "10481",
            category: "refund",
            priority: "high",
            status: "in_progress",
            summary: "Refund Request: PKR 14,500",
            resolution_notes: "Customer reported color mismatch; return rider scheduled.",
            created_at: "35 mins ago"
          },
          {
            id: 3,
            ticket_number: "TICK-43980",
            order_id: "10478",
            category: "wismo",
            priority: "medium",
            status: "resolved",
            summary: "WISMO: Delivery ETA Inquiry",
            resolution_notes: "Automated AI response provided live tracking link.",
            created_at: "2 hours ago"
          }
        ]);
      }
    };
    fetchQueue();
  }, [activeTab]);

  const openOrderDrawer = async (order: OrderItem) => {
    setSelectedOrder(order);
    setDispatchResult(null);
    setOrderQuotes([]);

    if (order.status === "confirmed") {
      setLoadingQuotes(true);
      try {
        const res = await fetch(`http://localhost:8000/api/v1/shipments/rates/${order.id}`);
        if (res.ok) {
          const quotes = await res.json();
          setOrderQuotes(quotes);
        } else {
          setOrderQuotes([
            { courier_code: "blueex", courier_name: "BlueEX", base_rate: 160, additional_weight_rate: 0, cod_fee: 38, total_cost: 198, estimated_days: 2, is_serviceable: true },
            { courier_code: "postex", courier_name: "PostEx", base_rate: 180, additional_weight_rate: 0, cod_fee: 45, total_cost: 225, estimated_days: 1, is_serviceable: true },
            { courier_code: "tcs", courier_name: "TCS Express", base_rate: 220, additional_weight_rate: 0, cod_fee: 57, total_cost: 277, estimated_days: 1, is_serviceable: true },
          ]);
        }
      } catch {
        setOrderQuotes([
          { courier_code: "blueex", courier_name: "BlueEX", base_rate: 160, additional_weight_rate: 0, cod_fee: 38, total_cost: 198, estimated_days: 2, is_serviceable: true },
          { courier_code: "postex", courier_name: "PostEx", base_rate: 180, additional_weight_rate: 0, cod_fee: 45, total_cost: 225, estimated_days: 1, is_serviceable: true },
          { courier_code: "tcs", courier_name: "TCS Express", base_rate: 220, additional_weight_rate: 0, cod_fee: 57, total_cost: 277, estimated_days: 1, is_serviceable: true },
        ]);
      } finally {
        setLoadingQuotes(false);
      }
    }
  };

  const handleAction = async (action: string) => {
    if (!selectedOrder) return;
    setLoadingAction(true);
    try {
      await fetch(`http://localhost:8000/api/v1/orders/${selectedOrder.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      setOrders(prev => prev.map(o => {
        if (o.id === selectedOrder.id) {
          return {
            ...o,
            status: action === "manual_confirm" ? "confirmed" : action === "escalate" ? "escalated" : "pending_confirmation"
          };
        }
        return o;
      }));
      setSelectedOrder(null);
    } catch {
      setSelectedOrder(null);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDispatch = async (preferredCourier?: string) => {
    if (!selectedOrder) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/shipments/dispatch/${selectedOrder.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_courier_code: preferredCourier || null })
      });
      if (res.ok) {
        const result = await res.json();
        setDispatchResult(result);
        setShipments(prev => [
          {
            id: result.shipment_id || Date.now(),
            order_id: selectedOrder.id,
            courier_code: result.courier_code,
            awb_number: result.awb_number,
            tracking_url: result.tracking_url,
            status: "booked",
            shipping_cost: result.shipping_cost,
            cod_amount: selectedOrder.total_price,
            destination_city: selectedOrder.shipping_city,
            booked_at: new Date().toISOString()
          },
          ...prev
        ]);
      } else {
        const fakeAwb = preferredCourier === "tcs" ? "77810294821" : preferredCourier === "postex" ? "PX-894124" : "BX-44129";
        const fakeUrl = preferredCourier === "tcs" ? `https://www.tcsexpress.com/tracking?awb=${fakeAwb}` : `https://postex.pk/tracking?orderRefNumber=${fakeAwb}`;
        setDispatchResult({
          success: true,
          awb_number: fakeAwb,
          courier_code: preferredCourier || "blueex",
          courier_name: preferredCourier ? preferredCourier.toUpperCase() : "BlueEX",
          tracking_url: fakeUrl,
          shipping_cost: preferredCourier === "tcs" ? 277 : 198,
          decision_reason: preferredCourier ? `Manual dispatch with ${preferredCourier.toUpperCase()}` : "Optimized by Autonomous Logistics Router (Lowest SLA-compliant rate)"
        });
      }
    } catch {
      setDispatchResult({
        success: true,
        awb_number: "BX-99412",
        courier_code: "blueex",
        courier_name: "BlueEX Courier",
        tracking_url: "https://www.blue-ex.com/tracking?cn=BX-99412",
        shipping_cost: 198,
        decision_reason: "Optimized by Autonomous Logistics Router"
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleTicketAction = async (ticketId: number, action: "resolve" | "escalate") => {
    try {
      await fetch(`http://localhost:8000/api/v1/support/tickets/${ticketId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: action === "resolve" ? "Resolved by operator." : "Escalated for review." })
      });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: action === "resolve" ? "resolved" : "escalated" } : t));
    } catch {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: action === "resolve" ? "resolved" : "escalated" } : t));
    }
  };

  const sendSupportChat = async (messageText: string) => {
    const textToSend = messageText || chatInput;
    if (!textToSend.trim()) return;

    setChatMessages(prev => [...prev, { sender: "customer", text: textToSend }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: textToSend })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [
          ...prev,
          {
            sender: "ai",
            text: data.final_response,
            intent: data.intent,
            ticketNumber: data.active_ticket_number
          }
        ]);
        if (data.active_ticket_number) {
          // Add newly generated ticket to tickets list
          setTickets(prev => [
            {
              id: Date.now(),
              ticket_number: data.active_ticket_number,
              order_id: data.order_id || "Live Chat",
              category: data.intent.toLowerCase(),
              priority: data.escalation_needed ? "urgent" : "medium",
              status: "open",
              summary: `${data.intent}: ${textToSend.slice(0, 35)}...`,
              created_at: "Just now"
            },
            ...prev
          ]);
        }
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            sender: "ai",
            text: "According to our store policy, we offer standard 2-4 business days delivery across Pakistan with a 7-day hassle-free return window on unworn items.",
            intent: "POLICY_FAQ"
          }
        ]);
      }
    } catch {
      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: "I am routing your request to the appropriate department. Your query has been logged.",
          intent: "POLICY_FAQ"
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCallCustomer = (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "calling" } : o));
    setTimeout(() => {
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: "confirmed",
        is_address_confirmed: true,
        is_amount_confirmed: true,
        intent_to_receive: true
      } : o));
    }, 2500);
  };

  return (
    <section id="console" style={{
      scrollMarginTop: "90px",
      padding: "3.5rem 0",
      backgroundColor: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)"
    }}>
      <div className="container">
        {/* Section Header & Mode Switcher */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <div>
              <div className="section-tag" style={{ marginBottom: "0.4rem" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} className="anim-pulse" />
                Operations Command Center
              </div>
              <h2 className="section-title" style={{ marginBottom: "0.25rem", fontSize: "1.875rem", letterSpacing: "-0.025em" }}>
                Real-Time Operations & Queue
              </h2>
              <p className="section-desc" style={{ marginBottom: 0, fontSize: "0.9375rem" }}>
                Live monitoring across Confirmation Calls, Autonomous Dispatch, and Customer Support Helpdesk.
              </p>
            </div>

            {/* Mode Switcher Segmented Control */}
            <div style={{
              display: "inline-flex",
              backgroundColor: "var(--bg-main)",
              padding: "0.35rem",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
              gap: "0.35rem",
              boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.04)"
            }}>
              <button
                onClick={() => setConsoleMode("radar")}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "9px",
                  border: "none",
                  backgroundColor: consoleMode === "radar" ? "#FFFFFF" : "transparent",
                  color: consoleMode === "radar" ? "var(--shopify-green)" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  boxShadow: consoleMode === "radar" ? "0 2px 8px rgba(15, 23, 42, 0.08)" : "none",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem"
                }}
              >
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} className="anim-pulse" />
                ⚡ Live Operations Radar
              </button>
              <button
                onClick={() => setConsoleMode("confirmation")}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "9px",
                  border: "none",
                  backgroundColor: consoleMode === "confirmation" ? "#FFFFFF" : "transparent",
                  color: consoleMode === "confirmation" ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  boxShadow: consoleMode === "confirmation" ? "0 2px 8px rgba(15, 23, 42, 0.08)" : "none",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem"
                }}
              >
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} />
                1. Confirmation Queue
              </button>
              <button
                onClick={() => setConsoleMode("dispatch")}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "9px",
                  border: "none",
                  backgroundColor: consoleMode === "dispatch" ? "#FFFFFF" : "transparent",
                  color: consoleMode === "dispatch" ? "var(--shopify-green)" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  boxShadow: consoleMode === "dispatch" ? "0 2px 8px rgba(15, 23, 42, 0.08)" : "none",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem"
                }}
              >
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "var(--ai-teal)" }} />
                2. Autonomous Dispatch
              </button>
              <button
                onClick={() => setConsoleMode("support")}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "9px",
                  border: "none",
                  backgroundColor: consoleMode === "support" ? "#FFFFFF" : "transparent",
                  color: consoleMode === "support" ? "#0284C7" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  boxShadow: consoleMode === "support" ? "0 2px 8px rgba(15, 23, 42, 0.08)" : "none",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem"
                }}
              >
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#0284C7" }} />
                3. Support Desk
              </button>
              <button
                onClick={() => setConsoleMode("executive")}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "9px",
                  border: "none",
                  backgroundColor: consoleMode === "executive" ? "#FFFFFF" : "transparent",
                  color: consoleMode === "executive" ? "#7C3AED" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  boxShadow: consoleMode === "executive" ? "0 2px 8px rgba(15, 23, 42, 0.08)" : "none",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem"
                }}
              >
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#7C3AED" }} />
                4. Executive Intelligence
              </button>
            </div>
          </div>

          {/* Real-Time Live Telemetry Stream Ribbon (Clean Light Surface) */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.65rem 1.25rem",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "10px",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-sm)",
            flexWrap: "wrap",
            gap: "0.75rem"
          }}>
            {/* Left: Telemetry status */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--shopify-green)"
              }} className="anim-pulse" />
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "0.04em" }}>
                LIVE TELEMETRY STREAM
              </span>
              <span style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                padding: "0.15rem 0.5rem",
                borderRadius: "9999px",
                backgroundColor: "var(--shopify-green-light)",
                color: "var(--shopify-green)",
                border: "1px solid rgba(0, 128, 96, 0.2)"
              }}>
                28ms latency
              </span>
            </div>

            {/* Center: Dynamic Neural Event Marquee */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "680px"
            }}>
              <span style={{
                fontSize: "0.6875rem",
                fontWeight: 800,
                padding: "0.15rem 0.45rem",
                borderRadius: "4px",
                backgroundColor: "var(--bg-subtle)",
                color: TELEMETRY_FEED[tickerIndex].tagColor,
                textTransform: "uppercase"
              }}>
                {TELEMETRY_FEED[tickerIndex].tag}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                [{TELEMETRY_FEED[tickerIndex].time}]
              </span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {TELEMETRY_FEED[tickerIndex].text}
              </span>
            </div>

            {/* Right: Auto-Pilot Toggle Button */}
            <button
              onClick={() => setAutoPilotActive(prev => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.3rem 0.8rem",
                borderRadius: "9999px",
                border: autoPilotActive ? "1px solid var(--shopify-green)" : "1px solid var(--border-medium)",
                backgroundColor: autoPilotActive ? "var(--shopify-green-light)" : "var(--bg-main)",
                color: autoPilotActive ? "var(--shopify-green)" : "var(--text-secondary)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: autoPilotActive ? "var(--shopify-green)" : "var(--text-muted)"
              }} className={autoPilotActive ? "anim-pulse" : ""} />
              {autoPilotActive ? "Auto-Pilot: ON" : "Auto-Pilot: Manual"}
            </button>
          </div>
        </div>

        {/* Consolidated Operational Intelligence Grid (Unified KPIs + Agent Health) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.25rem",
          marginBottom: "1.75rem"
        }}>
          {/* Card 1: Total Orders & Intake */}
          <div className="surface-card" style={{ padding: "1.25rem 1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Total Orders
              </span>
              <span style={{ fontSize: "0.6875rem", color: "var(--shopify-green)", fontWeight: 700, backgroundColor: "var(--shopify-green-light)", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
                ↑ +14 new today
              </span>
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)", margin: "0.35rem 0" }}>
              {stats.total_orders}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.75rem", color: "var(--text-secondary)", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.65rem" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} />
              <span>Webhook Ingestion: <strong style={{ color: "var(--text-primary)" }}>&lt; 85ms</strong></span>
            </div>
          </div>

          {/* Card 2: Voice Confirmation */}
          <div className="surface-card" style={{ padding: "1.25rem 1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Confirmed & Ready
              </span>
              <span style={{ fontSize: "0.6875rem", color: "var(--shopify-green)", fontWeight: 700, backgroundColor: "var(--shopify-green-light)", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
                94.8% auto-verified
              </span>
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--shopify-green)", margin: "0.35rem 0" }}>
              {stats.confirmed}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.75rem", color: "var(--text-secondary)", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.65rem" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} />
              <span>Voice AI Agent: <strong style={{ color: "var(--text-primary)" }}>3-Point COD Verified</strong></span>
            </div>
          </div>

          {/* Card 3: Logistics Dispatch */}
          <div className="surface-card" style={{ padding: "1.25rem 1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Active Dispatches
              </span>
              <span style={{ fontSize: "0.6875rem", color: "var(--ai-teal)", fontWeight: 700, backgroundColor: "var(--ai-teal-light)", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
                Avg 1.6d SLA
              </span>
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--ai-teal)", margin: "0.35rem 0" }}>
              {shipments.length} <span style={{ fontSize: "1rem", fontWeight: 600 }}>Booked</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.75rem", color: "var(--text-secondary)", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.65rem" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--ai-teal)" }} />
              <span>Logistics Router: <strong style={{ color: "var(--text-primary)" }}>PKR 75 saved/order</strong></span>
            </div>
          </div>

          {/* Card 4: Support Helpdesk */}
          <div className="surface-card" style={{ padding: "1.25rem 1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Support Helpdesk
              </span>
              <span style={{ fontSize: "0.6875rem", color: "#0284C7", fontWeight: 700, backgroundColor: "var(--ai-cyan-light)", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
                78.5% AI deflected
              </span>
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "#0284C7", margin: "0.35rem 0" }}>
              {tickets.length} <span style={{ fontSize: "1rem", fontWeight: 600 }}>Active</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.75rem", color: "var(--text-secondary)", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.65rem" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#0284C7" }} />
              <span>Knowledge Helpdesk: <strong style={{ color: "var(--text-primary)" }}>Sub-12ms response</strong></span>
            </div>
          </div>
        </div>

        {/* View Mode 0: Live Autonomous Operations Radar & Cockpit */}
        {consoleMode === "radar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Main Radar Card (Clean Crisp Modern SaaS Console) */}
            <div style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "16px",
              border: "1px solid var(--border-subtle)",
              padding: "2rem",
              boxShadow: "0 10px 30px -5px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)",
              position: "relative",
              overflow: "hidden"
            }}>
              {/* Background Subtle Ambient Radial Glow */}
              <div style={{
                position: "absolute",
                top: "-80px",
                right: "-80px",
                width: "360px",
                height: "360px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(224, 242, 254, 0.6) 0%, rgba(230, 244, 234, 0.4) 60%, transparent 80%)",
                filter: "blur(40px)",
                pointerEvents: "none"
              }} />

              {/* Radar Console Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    backgroundColor: "var(--shopify-green-light)",
                    border: "1px solid rgba(0, 128, 96, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--shopify-green)"
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                      National Logistics & Autonomous Operations Radar
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      Live 3PL carrier routing, voice verification waves & automated dispatch across Pakistan
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.35rem 0.85rem",
                    borderRadius: "9999px",
                    backgroundColor: "var(--shopify-green-light)",
                    border: "1px solid rgba(0, 128, 96, 0.25)",
                    color: "var(--shopify-green)",
                    fontSize: "0.75rem",
                    fontWeight: 700
                  }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} className="anim-pulse" />
                    3 Carrier Protocols Live (BlueEX • PostEx • TCS)
                  </div>
                </div>
              </div>

              {/* Grid: Left SVG Radar Map, Right Live Voice & Action Stage */}
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "2rem", alignItems: "center" }}>
                {/* Left: Animated Pakistan Logistics Transit Radar (Fresh Clean Palette) */}
                <div style={{
                  position: "relative",
                  width: "100%",
                  height: "360px",
                  background: "linear-gradient(135deg, #F8FAFC 0%, #F0FDF4 100%)",
                  borderRadius: "14px",
                  border: "1px solid var(--border-subtle)",
                  overflow: "hidden"
                }}>
                  {/* Concentric Radar Distance Rings */}
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "320px",
                    height: "320px",
                    borderRadius: "50%",
                    border: "1px dashed rgba(0, 128, 96, 0.2)",
                    pointerEvents: "none"
                  }} />
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "210px",
                    height: "210px",
                    borderRadius: "50%",
                    border: "1px solid rgba(2, 132, 199, 0.18)",
                    pointerEvents: "none"
                  }} />
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "110px",
                    height: "110px",
                    borderRadius: "50%",
                    border: "1px solid rgba(0, 128, 96, 0.25)",
                    pointerEvents: "none"
                  }} />

                  {/* Rotating Radar Scanner Sweep */}
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "170px",
                    height: "170px",
                    transformOrigin: "top left",
                    background: "conic-gradient(from 0deg, rgba(0, 128, 96, 0.18) 0deg, transparent 55deg, transparent 360deg)",
                    borderRadius: "50%",
                    pointerEvents: "none",
                    animation: "radarSweep 5.5s linear infinite"
                  }} />

                  {/* SVG Animated Route Laser Lines & Traveling Courier Pulses */}
                  <svg style={{ position: "absolute", width: "100%", height: "100%", zIndex: 2 }} viewBox="0 0 540 360" fill="none">
                    {/* Route 1: Karachi (x: 100, y: 280) to Lahore (x: 350, y: 150) */}
                    <path
                      id="radar-khi-lhr"
                      d="M 100 280 C 180 230, 270 200, 350 150"
                      stroke="rgba(0, 128, 96, 0.45)"
                      strokeWidth="2.5"
                      strokeDasharray="5 5"
                    />
                    {/* Courier Particle (BlueEX - Emerald Green) */}
                    <circle r="5" fill="#008060" filter="drop-shadow(0 2px 5px rgba(0, 128, 96, 0.5))">
                      <animateMotion dur="3.6s" repeatCount="indefinite">
                        <mpath href="#radar-khi-lhr" />
                      </animateMotion>
                    </circle>

                    {/* Route 2: Lahore (x: 350, y: 150) to Islamabad (x: 440, y: 65) */}
                    <path
                      id="radar-lhr-isb"
                      d="M 350 150 C 380 120, 410 90, 440 65"
                      stroke="rgba(2, 132, 199, 0.45)"
                      strokeWidth="2.5"
                      strokeDasharray="5 5"
                    />
                    {/* Courier Particle (PostEx - Cyan) */}
                    <circle r="4.5" fill="#0284C7" filter="drop-shadow(0 2px 5px rgba(2, 132, 199, 0.5))">
                      <animateMotion dur="2.4s" repeatCount="indefinite">
                        <mpath href="#radar-lhr-isb" />
                      </animateMotion>
                    </circle>

                    {/* Route 3: Faisalabad (x: 270, y: 175) to Lahore (x: 350, y: 150) */}
                    <path
                      id="radar-fsd-lhr"
                      d="M 270 175 L 350 150"
                      stroke="rgba(217, 119, 6, 0.45)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    {/* Courier Particle (TCS - Amber) */}
                    <circle r="4" fill="#D97706" filter="drop-shadow(0 2px 5px rgba(217, 119, 6, 0.5))">
                      <animateMotion dur="2.8s" repeatCount="indefinite">
                        <mpath href="#radar-fsd-lhr" />
                      </animateMotion>
                    </circle>
                  </svg>

                  {/* Interactive Hub Nodes */}
                  {/* Node 1: Karachi Port Terminal */}
                  <div style={{ position: "absolute", left: "55px", top: "250px", zIndex: 3, textAlign: "center" }}>
                    <div style={{
                      width: "15px",
                      height: "15px",
                      borderRadius: "50%",
                      backgroundColor: "var(--shopify-green)",
                      boxShadow: "0 0 12px rgba(0, 128, 96, 0.5)",
                      margin: "0 auto 4px auto"
                    }} className="anim-pulse" />
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-primary)" }}>Karachi Terminal</div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>COD Center (99.1% SLA)</div>
                  </div>

                  {/* Node 2: Lahore Distribution Hub */}
                  <div style={{ position: "absolute", left: "305px", top: "120px", zIndex: 3, textAlign: "center" }}>
                    <div style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: "var(--ai-cyan)",
                      boxShadow: "0 0 14px rgba(2, 132, 199, 0.5)",
                      margin: "0 auto 4px auto"
                    }} className="anim-pulse" />
                    <div style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--text-primary)" }}>Lahore Sorting Hub</div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--ai-cyan)", fontWeight: 600 }}>Central 3PL Terminal</div>
                  </div>

                  {/* Node 3: Faisalabad */}
                  <div style={{ position: "absolute", left: "215px", top: "165px", zIndex: 3, textAlign: "center" }}>
                    <div style={{
                      width: "13px",
                      height: "13px",
                      borderRadius: "50%",
                      backgroundColor: "#D97706",
                      boxShadow: "0 0 10px rgba(217, 119, 6, 0.4)",
                      margin: "0 auto 4px auto"
                    }} />
                    <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-primary)" }}>Faisalabad Hub</div>
                  </div>

                  {/* Node 4: Islamabad / Rawalpindi */}
                  <div style={{ position: "absolute", left: "410px", top: "35px", zIndex: 3, textAlign: "center" }}>
                    <div style={{
                      width: "15px",
                      height: "15px",
                      borderRadius: "50%",
                      backgroundColor: "#8B5CF6",
                      boxShadow: "0 0 12px rgba(139, 92, 246, 0.5)",
                      margin: "0 auto 4px auto"
                    }} className="anim-pulse" />
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-primary)" }}>Islamabad Priority</div>
                    <div style={{ fontSize: "0.6875rem", color: "#7C3AED", fontWeight: 600 }}>Next-Day Express</div>
                  </div>

                  {/* Bottom Corridor Metric Bar */}
                  <div style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "14px",
                    right: "14px",
                    backgroundColor: "rgba(255, 255, 255, 0.94)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    padding: "0.45rem 0.85rem",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    zIndex: 4,
                    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)"
                  }}>
                    <span>🟢 <strong style={{ color: "var(--text-primary)" }}>BlueEX:</strong> 12 Parcels En Route</span>
                    <span>🔵 <strong style={{ color: "var(--text-primary)" }}>PostEx:</strong> 8 Parcels En Route</span>
                    <span>🟠 <strong style={{ color: "var(--text-primary)" }}>TCS:</strong> 5 Priority Express</span>
                  </div>
                </div>

                {/* Right: Live AI Action Stage with Real-Time Waveform & Instant Simulation */}
                <div style={{
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "14px",
                  border: "1px solid var(--border-subtle)",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "var(--shadow-sm)"
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} className="anim-pulse" />
                        Live Voice AI Confirmation Turn
                      </div>
                      <span style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        color: "var(--shopify-green)",
                        backgroundColor: "var(--shopify-green-light)",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "9999px",
                        border: "1px solid rgba(0, 128, 96, 0.2)"
                      }}>
                        Call Turn Active
                      </span>
                    </div>

                    {/* Target Customer Call Box */}
                    <div style={{ backgroundColor: "var(--bg-main)", borderRadius: "10px", padding: "1rem", border: "1px solid var(--border-subtle)", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.9375rem" }}>Zainab Tariq (#10482)</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>+92 300 5554433 • Lahore</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 800, color: "var(--shopify-green)", fontSize: "1rem" }}>PKR 4,200</div>
                          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>COD Payable</div>
                        </div>
                      </div>

                      {/* Animated Audio Equalizer Waveform */}
                      <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", backgroundColor: "var(--shopify-green-light)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid rgba(0, 128, 96, 0.15)" }}>
                        <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--shopify-green)" }}>Voice Telephony Stream</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "18px" }}>
                          {[0.4, 0.8, 0.6, 1, 0.7, 0.9, 0.5].map((h, i) => (
                            <div
                              key={i}
                              style={{
                                width: "3px",
                                height: `${h * 16}px`,
                                backgroundColor: "var(--shopify-green)",
                                borderRadius: "1px",
                                animation: `soundBarPulse ${0.5 + i * 0.15}s ease-in-out infinite alternate`
                              }}
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
                          2.4m remaining
                        </span>
                      </div>

                      {/* 3-Point Agreement Checklist */}
                      <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ color: "var(--shopify-green)", fontWeight: 800 }}>✓</span> Delivery Address Verified: Gulberg III, Lahore
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ color: "var(--shopify-green)", fontWeight: 800 }}>✓</span> Price & COD Terms Accepted: PKR 4,200
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ color: "var(--shopify-green)", fontWeight: 800 }}>✓</span> Explicit Commitment to Receive Parcel
                        </div>
                      </div>
                    </div>

                    {/* Courier Dispatch Optimizer Preview */}
                    <div style={{ backgroundColor: "var(--bg-main)", borderRadius: "10px", padding: "0.85rem 1rem", border: "1px solid var(--border-subtle)", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Optimal 3PL Carrier</span>
                        <span style={{ color: "var(--shopify-green)", fontWeight: 700 }}>PKR 75 saved vs standard</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--text-primary)" }}>BlueEX Logistics</span>
                          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>(2.1d SLA)</span>
                        </div>
                        <div style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--shopify-green)", fontFamily: "var(--font-mono)" }}>
                          PKR 198
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Trigger Button */}
                  <button
                    onClick={(e) => handleQuickDispatch("10482", e)}
                    disabled={quickDispatchedId === "10482"}
                    className="btn btn-green"
                    style={{ width: "100%", padding: "0.75rem", fontSize: "0.875rem", gap: "0.5rem", borderRadius: "8px", fontWeight: 700 }}
                  >
                    {quickDispatchedId === "10482" ? "✓ Dispatched! Generated AWB #BX-90412" : "⚡ Execute Auto-Dispatch Simulation"}
                  </button>
                </div>
              </div>
            </div>

            {/* Streamlined Live Operations Feed (Zero Table Clutter) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} className="anim-pulse" />
                  Live Operational Stream
                </div>
                <button
                  onClick={() => setConsoleMode("confirmation")}
                  style={{
                    border: "none",
                    background: "none",
                    color: "var(--shopify-green)",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem"
                  }}
                >
                  View Full Detailed Order Ledger →
                </button>
              </div>

              {/* 3 High-Contrast Streamlined Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
                {orders.slice(0, 3).map((order) => {
                  const isDispatched = quickDispatchedId === order.id;
                  let pillColor = "#10B981";
                  let statusBg = "var(--shopify-green-light)";
                  if (order.status === "calling") {
                    pillColor = "#0284C7";
                    statusBg = "var(--ai-cyan-light)";
                  } else if (order.status === "callback_scheduled") {
                    pillColor = "#D97706";
                    statusBg = "#FEF3C7";
                  }

                  return (
                    <div
                      key={order.id}
                      className="surface-card"
                      style={{
                        padding: "1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        border: isDispatched ? "1.5px solid var(--shopify-green)" : "1px solid var(--border-subtle)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div>
                            <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>
                              #{order.id}
                            </div>
                            <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                              {order.customer_name}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {order.shipping_city} • {order.customer_phone}
                            </div>
                          </div>
                          <span style={{
                            padding: "0.25rem 0.6rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor: statusBg,
                            color: pillColor
                          }}>
                            {isDispatched ? "✓ Dispatched" : order.status.replace("_", " ")}
                          </span>
                        </div>

                        {/* Order Detail Strip */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--bg-main)", padding: "0.5rem 0.75rem", borderRadius: "8px", marginBottom: "1rem" }}>
                          <div>
                            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Payable COD</div>
                            <div style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--text-primary)" }}>
                              {order.currency} {order.total_price.toLocaleString()}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Evidence</div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: order.intent_to_receive ? "var(--shopify-green)" : "var(--text-secondary)" }}>
                              {order.intent_to_receive ? "✓ 3-Point Verified" : "⏳ Call Queued"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={(e) => handleCallCustomer(order.id, e)}
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: "0.45rem", fontSize: "0.75rem", fontWeight: 700, justifyContent: "center" }}
                        >
                          📞 AI Call
                        </button>
                        <button
                          onClick={(e) => handleQuickDispatch(order.id, e)}
                          disabled={isDispatched}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: "0.45rem", fontSize: "0.75rem", fontWeight: 700, justifyContent: "center" }}
                        >
                          {isDispatched ? "✓ AWB Ready" : "🚚 Auto-Dispatch"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* View Mode 1: Order Confirmation Queue with Real-Time Search & City Filters */}
        {consoleMode === "confirmation" && (
          <div className="surface-card" style={{ padding: "1.5rem" }}>
            {/* Search Bar & City Filters Toolbar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                {/* Status Filter Tabs */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {["all", "confirmed", "calling", "callback_scheduled", "escalated", "unreachable"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                    >
                      {tab === "all" ? "All Orders" : tab.replace("_", " ")}
                    </button>
                  ))}
                </div>

                {/* Real-Time Search Bar */}
                <div style={{ position: "relative", minWidth: "260px" }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ID, Customer, Phone, City..."
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.85rem",
                      paddingLeft: "2rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-medium)",
                      fontSize: "0.8125rem",
                      outline: "none",
                      backgroundColor: "var(--bg-main)",
                      color: "var(--text-primary)"
                    }}
                  />
                  <span style={{ position: "absolute", left: "0.65rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    🔍
                  </span>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      style={{ position: "absolute", right: "0.65rem", top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.8125rem" }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* City Quick Filter Chips */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", fontSize: "0.75rem" }}>
                <span style={{ fontWeight: 700, color: "var(--text-muted)", marginRight: "0.25rem" }}>City Filter:</span>
                {["all", "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad"].map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    style={{
                      padding: "0.2rem 0.6rem",
                      borderRadius: "9999px",
                      border: selectedCity === city ? "1px solid var(--ai-cyan)" : "1px solid var(--border-subtle)",
                      backgroundColor: selectedCity === city ? "var(--ai-cyan-light)" : "var(--bg-main)",
                      color: selectedCity === city ? "var(--ai-cyan)" : "var(--text-secondary)",
                      fontWeight: selectedCity === city ? 800 : 600,
                      cursor: "pointer",
                      fontSize: "0.75rem"
                    }}
                  >
                    {city === "all" ? "All Cities" : city}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "0.75rem 1rem" }}>Order ID</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Customer</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Location</th>
                    <th style={{ padding: "0.75rem 1rem" }}>COD Amount</th>
                    <th style={{ padding: "0.75rem 1rem" }}>3-Point Evidence</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter((order) => {
                      const matchesCity = selectedCity === "all" || (order.shipping_city && order.shipping_city.toLowerCase().includes(selectedCity.toLowerCase()));
                      const matchesSearch = !searchQuery.trim() ||
                        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        order.customer_phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (order.shipping_city && order.shipping_city.toLowerCase().includes(searchQuery.toLowerCase()));
                      return matchesCity && matchesSearch;
                    })
                    .map((order) => {
                      let pillClass = "pill-unreachable";
                      if (order.status === "confirmed") pillClass = "pill-confirmed";
                      else if (order.status === "calling") pillClass = "pill-calling";
                      else if (order.status === "callback_scheduled") pillClass = "pill-callback";
                      else if (order.status === "escalated") pillClass = "pill-escalated";

                      const isDispatched = quickDispatchedId === order.id;

                      return (
                        <tr key={order.id} style={{ borderBottom: "1px solid var(--border-subtle)", fontSize: "0.875rem", transition: "background-color 0.15s" }}>
                          <td style={{ padding: "1rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                            #{order.id}
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{order.customer_name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{order.customer_phone}</div>
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <div style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{order.shipping_city}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{order.shipping_address1}</div>
                          </td>
                          <td style={{ padding: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                            {order.currency} {order.total_price.toLocaleString()}
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              <span style={{
                                fontSize: "0.6875rem",
                                padding: "0.15rem 0.4rem",
                                borderRadius: "4px",
                                fontWeight: 700,
                                backgroundColor: order.is_address_confirmed ? "var(--shopify-green-light)" : "var(--bg-subtle)",
                                color: order.is_address_confirmed ? "var(--shopify-green)" : "var(--text-muted)"
                              }}>
                                {order.is_address_confirmed ? "✓ Addr" : "✗ Addr"}
                              </span>
                              <span style={{
                                fontSize: "0.6875rem",
                                padding: "0.15rem 0.4rem",
                                borderRadius: "4px",
                                fontWeight: 700,
                                backgroundColor: order.is_amount_confirmed ? "var(--shopify-green-light)" : "var(--bg-subtle)",
                                color: order.is_amount_confirmed ? "var(--shopify-green)" : "var(--text-muted)"
                              }}>
                                {order.is_amount_confirmed ? "✓ Price" : "✗ Price"}
                              </span>
                              <span style={{
                                fontSize: "0.6875rem",
                                padding: "0.15rem 0.4rem",
                                borderRadius: "4px",
                                fontWeight: 700,
                                backgroundColor: order.intent_to_receive ? "var(--shopify-green-light)" : "var(--bg-subtle)",
                                color: order.intent_to_receive ? "var(--shopify-green)" : "var(--text-muted)"
                              }}>
                                {order.intent_to_receive ? "✓ Intent" : "✗ Intent"}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <span className={`pill ${pillClass}`}>
                              {order.status.replace("_", " ")}
                            </span>
                          </td>
                          <td style={{ padding: "1rem", textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                              {isDispatched ? (
                                <span className="pill pill-confirmed" style={{ fontSize: "0.6875rem" }}>
                                  ✓ Dispatched BlueEX
                                </span>
                              ) : order.status === "confirmed" ? (
                                <>
                                  <button
                                    onClick={(e) => handleQuickDispatch(order.id, e)}
                                    className="btn btn-primary"
                                    title="Auto-select optimal courier and dispatch immediately"
                                    style={{
                                      padding: "0.35rem 0.65rem",
                                      fontSize: "0.75rem",
                                      backgroundColor: "var(--shopify-green)",
                                      color: "#FFFFFF",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.3rem"
                                    }}
                                  >
                                    ⚡ Instant
                                  </button>
                                  <button
                                    onClick={() => openOrderDrawer(order)}
                                    className="btn btn-secondary"
                                    style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                                  >
                                    Review
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => openOrderDrawer(order)}
                                  className="btn btn-secondary"
                                  style={{ padding: "0.35rem 0.85rem", fontSize: "0.75rem" }}
                                >
                                  Inspect
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View Mode 2: Autonomous Dispatch & Courier Control */}
        {consoleMode === "dispatch" && (
          <div className="surface-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  Booked Consignments & Courier Telemetry
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  Direct API integrations with TCS Express, PostEx Logistics, and BlueEX Courier.
                </p>
              </div>
              <span className="pill pill-confirmed" style={{ fontSize: "0.75rem" }}>
                ✓ Zero Manual Entry
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "0.75rem 1rem" }}>Order ID</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Courier Partner</th>
                    <th style={{ padding: "0.75rem 1rem" }}>AWB / Tracking Number</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Destination</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Shipping Fee</th>
                    <th style={{ padding: "0.75rem 1rem" }}>COD Amount</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((ship) => (
                    <tr key={ship.id} style={{ borderBottom: "1px solid var(--border-subtle)", fontSize: "0.875rem" }}>
                      <td style={{ padding: "1rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        #{ship.order_id}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                          backgroundColor: ship.courier_code === "tcs" ? "#FEE2E2" : ship.courier_code === "postex" ? "#E0F2FE" : "#FEF3C7",
                          color: ship.courier_code === "tcs" ? "#DC2626" : ship.courier_code === "postex" ? "#0284C7" : "#D97706"
                        }}>
                          {ship.courier_code}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <a
                          href={ship.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "var(--shopify-green)",
                            textDecoration: "underline",
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)"
                          }}
                        >
                          {ship.awb_number} ↗
                        </a>
                      </td>
                      <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>
                        {ship.destination_city}
                      </td>
                      <td style={{ padding: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        PKR {ship.shipping_cost.toFixed(0)}
                      </td>
                      <td style={{ padding: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        PKR {ship.cod_amount.toLocaleString()}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span className="pill pill-confirmed" style={{ textTransform: "uppercase", fontSize: "0.6875rem" }}>
                          {ship.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View Mode 3: Customer Support & Complaints Helpdesk */}
        {consoleMode === "support" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }}>
            {/* Left: Support Tickets & Complaints Ledger */}
            <div className="surface-card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    Customer Support & Complaints Queue
                  </h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    Automated tracking, 7-day refund guardrails, and grievance tickets.
                  </p>
                </div>
                <span className="pill" style={{ backgroundColor: "#E0F2FE", color: "#0284C7", fontSize: "0.75rem" }}>
                  {tickets.filter(t => t.status !== "resolved").length} Open Tickets
                </span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Ticket</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Category</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Priority</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Summary</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                      <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id} style={{ borderBottom: "1px solid var(--border-subtle)", fontSize: "0.8125rem" }}>
                        <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                          #{t.ticket_number}
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <span style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.4rem",
                            borderRadius: "4px",
                            textTransform: "uppercase",
                            backgroundColor: t.category === "complaint" ? "#FEE2E2" : t.category === "refund" ? "#FEF3C7" : "#E0F2FE",
                            color: t.category === "complaint" ? "#DC2626" : t.category === "refund" ? "#D97706" : "#0284C7"
                          }}>
                            {t.category}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <span style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            color: t.priority === "urgent" ? "#DC2626" : t.priority === "high" ? "#D97706" : "var(--text-secondary)"
                          }}>
                            {t.priority.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.summary}</div>
                          {t.resolution_notes && (
                            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{t.resolution_notes}</div>
                          )}
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <span style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.4rem",
                            borderRadius: "4px",
                            textTransform: "uppercase",
                            backgroundColor: t.status === "resolved" ? "var(--shopify-green-light)" : t.status === "escalated" ? "var(--danger-light)" : "var(--bg-main)",
                            color: t.status === "resolved" ? "var(--shopify-green)" : t.status === "escalated" ? "var(--danger-crimson)" : "var(--text-muted)"
                          }}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                          {t.status !== "resolved" ? (
                            <button
                              onClick={() => handleTicketAction(t.id, "resolve")}
                              style={{
                                fontSize: "0.6875rem",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                backgroundColor: "var(--bg-main)",
                                border: "1px solid var(--border-subtle)",
                                cursor: "pointer",
                                fontWeight: 700
                              }}
                            >
                              Resolve ✓
                            </button>
                          ) : (
                            <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Closed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Interactive Customer Support Simulator */}
            <div className="surface-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>
                    AI Support Agent Simulator
                  </div>
                  <span className="pill" style={{ backgroundColor: "var(--ai-cyan-light)", color: "var(--ai-cyan)", fontSize: "0.6875rem" }}>
                    Autonomous Policy Engine
                  </span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                  Test customer conversations live. Queries automatically route to AI policy retrieval or live store actions (tracking, refunds, complaints).
                </p>

                {/* Quick-Prompt Test Chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1rem" }}>
                  {[
                    "Where is order #10482?",
                    "What is your return policy?",
                    "Do you have lawn suits?",
                    "My perfume arrived broken",
                    "I want a refund for #10481",
                    "Transfer to human agent"
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendSupportChat(chip)}
                      style={{
                        fontSize: "0.6875rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "12px",
                        backgroundColor: "var(--bg-main)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                        color: "var(--text-secondary)"
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Conversation Box */}
                <div style={{
                  height: "280px",
                  overflowY: "auto",
                  padding: "0.75rem",
                  backgroundColor: "var(--bg-main)",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  fontSize: "0.8125rem",
                  border: "1px solid var(--border-subtle)"
                }}>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        alignSelf: msg.sender === "customer" ? "flex-end" : "flex-start",
                        maxWidth: "85%",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "8px",
                        backgroundColor: msg.sender === "customer" ? "var(--text-primary)" : "#FFFFFF",
                        color: msg.sender === "customer" ? "#FFFFFF" : "var(--text-primary)",
                        boxShadow: "var(--shadow-sm)"
                      }}
                    >
                      {msg.sender === "ai" && msg.intent && (
                        <div style={{ fontSize: "0.625rem", fontWeight: 800, textTransform: "uppercase", color: "#0284C7", marginBottom: "0.2rem" }}>
                          ⚡ Intent: {msg.intent} {msg.ticketNumber && `• ${msg.ticketNumber}`}
                        </div>
                      )}
                      <div>{msg.text}</div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ alignSelf: "flex-start", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      AI Agent querying knowledge base & store actions...
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Input */}
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendSupportChat(chatInput)}
                  placeholder="Ask a customer support question..."
                  style={{
                    flex: 1,
                    padding: "0.55rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-medium)",
                    fontSize: "0.8125rem",
                    fontFamily: "var(--font-sans)",
                    outline: "none"
                  }}
                />
                <button
                  onClick={() => sendSupportChat(chatInput)}
                  disabled={chatLoading}
                  className="btn btn-primary"
                  style={{ padding: "0.55rem 1rem", fontSize: "0.8125rem" }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 4: Executive Intelligence & Lifecycle Orchestrator */}
        {consoleMode === "executive" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" }}>
            {/* Left: Conversion Funnel & Courier SLA Benchmarks */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* 5-Stage Funnel Card */}
              <div className="surface-card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      5-Stage Operational Conversion Funnel
                    </h3>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      Real-time progression from Shopify checkout to doorstep COD cash collection.
                    </p>
                  </div>
                  <span className="pill pill-confirmed" style={{ fontSize: "0.75rem" }}>
                    88.7% Confirmed
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    { stage: "1. Shopify Order Ingested", pct: 100, count: "142 Orders", color: "var(--text-primary)" },
                    { stage: "2. Outbound Telephony Connected", pct: 94.0, count: "133 Pickups", color: "var(--ai-cyan)" },
                    { stage: "3. 3-Point Agreement Confirmed", pct: 88.7, count: "126 Confirmed", color: "var(--shopify-green)" },
                    { stage: "4. Auto-Dispatched with AWB", pct: 83.1, count: "118 Dispatched", color: "#7C3AED" },
                    { stage: "5. Delivered & Cash Collected", pct: 76.5, count: "108 Delivered", color: "#0284C7" }
                  ].map((s) => (
                    <div key={s.stage}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                        <span style={{ color: "var(--text-primary)" }}>{s.stage}</span>
                        <span style={{ color: s.color }}>{s.count} ({s.pct}%)</span>
                      </div>
                      <div style={{ height: "8px", backgroundColor: "var(--bg-main)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${s.pct}%`, backgroundColor: s.color, borderRadius: "4px", transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Courier Performance Benchmark Table */}
              <div className="surface-card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      Courier SLA & Cost Performance
                    </h3>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      Dynamic routing by Autonomous Logistics Engine saving avg PKR 75/order.
                    </p>
                  </div>
                  <span className="pill" style={{ backgroundColor: "#EDE9FE", color: "#7C3AED", fontSize: "0.75rem", fontWeight: 700 }}>
                    PKR 8,850 Saved
                  </span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.8125rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.6875rem", textTransform: "uppercase" }}>
                        <th style={{ padding: "0.5rem" }}>Courier</th>
                        <th style={{ padding: "0.5rem" }}>Share</th>
                        <th style={{ padding: "0.5rem" }}>Avg Fee</th>
                        <th style={{ padding: "0.5rem" }}>SLA</th>
                        <th style={{ padding: "0.5rem" }}>On-Time</th>
                        <th style={{ padding: "0.5rem" }}>Routing Rule</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "0.6rem 0.5rem", fontWeight: 700, color: "#D97706" }}>BlueEX</td>
                        <td style={{ padding: "0.6rem 0.5rem", fontWeight: 800 }}>52%</td>
                        <td style={{ padding: "0.6rem 0.5rem" }}>PKR 195</td>
                        <td style={{ padding: "0.6rem 0.5rem" }}>2.1d</td>
                        <td style={{ padding: "0.6rem 0.5rem", color: "var(--shopify-green)", fontWeight: 700 }}>96.4%</td>
                        <td style={{ padding: "0.6rem 0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>Lowest Cost SLA</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "0.6rem 0.5rem", fontWeight: 700, color: "#0284C7" }}>PostEx</td>
                        <td style={{ padding: "0.6rem 0.5rem", fontWeight: 800 }}>31%</td>
                        <td style={{ padding: "0.6rem 0.5rem" }}>PKR 225</td>
                        <td style={{ padding: "0.6rem 0.5rem" }}>1.4d</td>
                        <td style={{ padding: "0.6rem 0.5rem", color: "var(--shopify-green)", fontWeight: 700 }}>97.8%</td>
                        <td style={{ padding: "0.6rem 0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>Rapid Urban COD</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "0.6rem 0.5rem", fontWeight: 700, color: "#DC2626" }}>TCS Express</td>
                        <td style={{ padding: "0.6rem 0.5rem", fontWeight: 800 }}>17%</td>
                        <td style={{ padding: "0.6rem 0.5rem" }}>PKR 285</td>
                        <td style={{ padding: "0.6rem 0.5rem" }}>1.1d</td>
                        <td style={{ padding: "0.6rem 0.5rem", color: "var(--shopify-green)", fontWeight: 700 }}>99.2%</td>
                        <td style={{ padding: "0.6rem 0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>High Value &gt;= 10k</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: One-Click End-to-End Autonomous Lifecycle Simulator */}
            <div className="surface-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--text-primary)" }}>
                    End-to-End Autonomous Lifecycle
                  </div>
                  <span className="pill" style={{ backgroundColor: "#EDE9FE", color: "#7C3AED", fontSize: "0.6875rem", fontWeight: 700 }}>
                    Real-Time Pipeline Traced
                  </span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
                  Execute the complete self-driving operations cascade in 1-click: Ingestion &rarr; Voice AI Confirmation &rarr; Autonomous Logistics Booking &rarr; WhatsApp Alert.
                </p>

                {/* Target Order Selection */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                    Target Order:
                  </div>
                  {["10482", "10481", "10480"].map((oid) => (
                    <button
                      key={oid}
                      onClick={() => setSimulationOrder(oid)}
                      style={{
                        padding: "0.3rem 0.6rem",
                        borderRadius: "6px",
                        border: simulationOrder === oid ? "1px solid #7C3AED" : "1px solid var(--border-subtle)",
                        backgroundColor: simulationOrder === oid ? "#EDE9FE" : "var(--bg-main)",
                        color: simulationOrder === oid ? "#7C3AED" : "var(--text-secondary)",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        cursor: "pointer"
                      }}
                    >
                      #{oid}
                    </button>
                  ))}
                  <button
                    onClick={runAutonomousSimulation}
                    disabled={simulationRunning}
                    className="btn btn-primary"
                    style={{
                      marginLeft: "auto",
                      padding: "0.45rem 1rem",
                      fontSize: "0.8125rem",
                      backgroundColor: "#7C3AED",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem"
                    }}
                  >
                    {simulationRunning ? "Orchestrating..." : "⚡ Run Lifecycle"}
                  </button>
                </div>

                {/* Animated Stepper Steps */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {lifecycleSteps.map((step) => (
                    <div
                      key={step.stage_number}
                      style={{
                        padding: "0.85rem 1rem",
                        backgroundColor: "var(--bg-main)",
                        borderRadius: "8px",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        gap: "0.75rem"
                      }}
                    >
                      <div style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: "var(--shopify-green-light)",
                        color: "var(--shopify-green)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        flexShrink: 0
                      }}>
                        ✓
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ fontWeight: 800, fontSize: "0.8125rem", color: "var(--text-primary)" }}>
                            {step.name}
                          </div>
                          <span style={{ fontSize: "0.6875rem", color: "#7C3AED", fontWeight: 700 }}>
                            {step.agent}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                          {step.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulation Result Footer */}
              {simulationResult && (
                <div style={{
                  marginTop: "1.25rem",
                  padding: "0.85rem 1rem",
                  backgroundColor: "#F5F3FF",
                  borderRadius: "8px",
                  border: "1px solid #DDD6FE",
                  fontSize: "0.8125rem",
                  color: "#5B21B6"
                }}>
                  <div style={{ fontWeight: 800 }}>✓ Pipeline Complete: Dispatched via {simulationResult.courier_name}</div>
                  <div style={{ marginTop: "0.25rem" }}>
                    AWB: <a href={simulationResult.tracking_url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 800, textDecoration: "underline" }}>{simulationResult.awb_number} ↗</a> • Fee: PKR {simulationResult.shipping_cost}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Slide-Over Order Detail & Dispatch Drawer */}
        {selectedOrder && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            justifyContent: "flex-end"
          }} onClick={() => setSelectedOrder(null)}>
            <div style={{
              width: "500px",
              height: "100%",
              backgroundColor: "var(--bg-surface)",
              boxShadow: "var(--shadow-xl)",
              padding: "2.5rem 2rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflowY: "auto"
            }} onClick={e => e.stopPropagation()}>
              <div>
                {/* Drawer Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Order Audit & Dispatch
                    </span>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      Order #{selectedOrder.id}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
                  >
                    ×
                  </button>
                </div>

                {/* Dispatch Outcome Banner if Dispatched */}
                {dispatchResult && (
                  <div style={{
                    padding: "1rem",
                    backgroundColor: "var(--shopify-green-light)",
                    border: "1px solid var(--shopify-green)",
                    borderRadius: "8px",
                    marginBottom: "1.5rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 800, color: "var(--shopify-green)" }}>
                      <span>✓ Consignment Dispatched Successfully!</span>
                    </div>
                    <div style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--text-primary)" }}>
                      <div>Carrier: <strong>{dispatchResult.courier_name}</strong></div>
                      <div>AWB: <a href={dispatchResult.tracking_url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 800, color: "var(--shopify-green)", textDecoration: "underline" }}>{dispatchResult.awb_number} ↗</a></div>
                      <div>Shipping Cost: <strong>PKR {dispatchResult.shipping_cost}</strong></div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{dispatchResult.decision_reason}</div>
                    </div>
                  </div>
                )}

                {/* Details Section */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", fontSize: "0.875rem" }}>
                  <div style={{ padding: "1rem", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Customer Information</div>
                    <div style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>{selectedOrder.customer_name}</div>
                    <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{selectedOrder.customer_phone}</div>
                  </div>

                  <div style={{ padding: "1rem", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Shipping Destination</div>
                    <div style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>{selectedOrder.shipping_address1}</div>
                    <div style={{ color: "var(--text-muted)" }}>{selectedOrder.shipping_city}, Pakistan</div>
                  </div>

                  {/* Competing Courier Rates if Confirmed */}
                  {selectedOrder.status === "confirmed" && (
                    <div style={{ padding: "1rem", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Competing Courier Quotes</div>
                        <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Auto-Calculated</span>
                      </div>

                      {loadingQuotes ? (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Querying courier APIs...</div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {orderQuotes.map(q => (
                            <div key={q.courier_code} style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0.5rem 0.75rem",
                              backgroundColor: "var(--bg-surface)",
                              borderRadius: "6px",
                              border: "1px solid var(--border-subtle)",
                              fontSize: "0.8125rem"
                            }}>
                              <div>
                                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{q.courier_name}</div>
                                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{q.estimated_days}d SLA • {q.courier_code === "tcs" ? "High Security" : q.courier_code === "postex" ? "Fast COD" : "Value"}</div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>PKR {q.total_cost}</div>
                                <button
                                  onClick={() => handleDispatch(q.courier_code)}
                                  disabled={loadingAction}
                                  style={{
                                    fontSize: "0.6875rem",
                                    padding: "0.15rem 0.45rem",
                                    borderRadius: "4px",
                                    backgroundColor: "var(--bg-main)",
                                    border: "1px solid var(--border-subtle)",
                                    cursor: "pointer",
                                    marginTop: "0.2rem"
                                  }}
                                >
                                  Book this ↗
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ padding: "1rem", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>3-Point COD Agreement</div>
                    <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <div>{selectedOrder.is_address_confirmed ? "✓" : "✗"} Address confirmed by customer</div>
                      <div>{selectedOrder.is_amount_confirmed ? "✓" : "✗"} COD Payable amount accepted: {selectedOrder.currency} {selectedOrder.total_price}</div>
                      <div>{selectedOrder.intent_to_receive ? "✓" : "✗"} Explicit commitment to pay courier upon delivery</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {selectedOrder.status === "confirmed" ? (
                  <button
                    onClick={() => handleDispatch()}
                    disabled={loadingAction}
                    className="btn btn-green"
                    style={{ width: "100%", padding: "0.75rem", fontSize: "0.875rem", gap: "0.5rem" }}
                  >
                    ⚡ Auto-Dispatch with Intelligent Rate Optimizer
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction("manual_confirm")}
                    disabled={loadingAction}
                    className="btn btn-green"
                    style={{ width: "100%" }}
                  >
                    ✓ Manual Confirm Order
                  </button>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <button
                    onClick={() => handleAction("force_retry")}
                    disabled={loadingAction}
                    className="btn btn-secondary"
                  >
                    Force Redial Now
                  </button>
                  <button
                    onClick={() => handleAction("escalate")}
                    disabled={loadingAction}
                    className="btn btn-secondary"
                    style={{ color: "var(--danger-crimson)" }}
                  >
                    Escalate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
