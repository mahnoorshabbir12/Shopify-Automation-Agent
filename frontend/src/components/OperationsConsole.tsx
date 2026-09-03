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
  const [consoleMode, setConsoleMode] = useState<"confirmation" | "dispatch" | "support">("confirmation");
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [orderQuotes, setOrderQuotes] = useState<RateQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);

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
          decision_reason: preferredCourier ? `Manual dispatch with ${preferredCourier.toUpperCase()}` : "Optimized by Shipping LangGraph Engine (Lowest SLA-compliant rate)"
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
        decision_reason: "Optimized by Shipping LangGraph Engine"
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

  return (
    <section id="console" style={{
      scrollMarginTop: "90px",
      padding: "6rem 0",
      backgroundColor: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)"
    }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <div className="section-tag">
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} />
                Operations Command Center
              </div>
              <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>Real-Time Operations & Queue</h2>
              <p className="section-desc">
                Live monitoring across Confirmation Calls, Autonomous Dispatch, and Customer Support Helpdesk.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{
              display: "flex",
              backgroundColor: "var(--bg-main)",
              padding: "0.3rem",
              borderRadius: "10px",
              border: "1px solid var(--border-subtle)",
              gap: "0.25rem"
            }}>
              <button
                onClick={() => setConsoleMode("confirmation")}
                style={{
                  padding: "0.5rem 1.1rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: consoleMode === "confirmation" ? "#FFFFFF" : "transparent",
                  color: consoleMode === "confirmation" ? "var(--text-primary)" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  boxShadow: consoleMode === "confirmation" ? "var(--shadow-sm)" : "none",
                  transition: "all 0.2s"
                }}
              >
                1. Confirmation Queue
              </button>
              <button
                onClick={() => setConsoleMode("dispatch")}
                style={{
                  padding: "0.5rem 1.1rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: consoleMode === "dispatch" ? "#FFFFFF" : "transparent",
                  color: consoleMode === "dispatch" ? "var(--shopify-green)" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  boxShadow: consoleMode === "dispatch" ? "var(--shadow-sm)" : "none",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem"
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} />
                2. Autonomous Dispatch
              </button>
              <button
                onClick={() => setConsoleMode("support")}
                style={{
                  padding: "0.5rem 1.1rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: consoleMode === "support" ? "#FFFFFF" : "transparent",
                  color: consoleMode === "support" ? "#0284C7" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  boxShadow: consoleMode === "support" ? "var(--shadow-sm)" : "none",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem"
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#0284C7" }} />
                3. Support & Complaints (Phase 3)
              </button>
            </div>
          </div>
        </div>

        {/* Top Operational Metrics */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2.5rem"
        }}>
          <div className="surface-card" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              Total Orders
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.25rem" }}>
              {stats.total_orders}
            </div>
          </div>

          <div className="surface-card" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              Confirmed & Ready
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--shopify-green)", marginTop: "0.25rem" }}>
              {stats.confirmed}
            </div>
          </div>

          <div className="surface-card" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              Active Dispatches
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ai-cyan)", marginTop: "0.25rem" }}>
              {shipments.length} Booked
            </div>
          </div>

          <div className="surface-card" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              Support Tickets
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0284C7", marginTop: "0.25rem" }}>
              {tickets.length} Active
            </div>
          </div>

          <div className="surface-card" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              Total Revenue
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.25rem" }}>
              PKR {(stats.total_revenue_pkr / 1000).toFixed(0)}k
            </div>
          </div>
        </div>

        {/* View Mode 1: Order Confirmation Queue */}
        {consoleMode === "confirmation" && (
          <div className="surface-card" style={{ padding: "1.5rem" }}>
            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
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
                  {orders.map((order) => {
                    let pillClass = "pill-unreachable";
                    if (order.status === "confirmed") pillClass = "pill-confirmed";
                    else if (order.status === "calling") pillClass = "pill-calling";
                    else if (order.status === "callback_scheduled") pillClass = "pill-callback";
                    else if (order.status === "escalated") pillClass = "pill-escalated";

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
                          <button
                            onClick={() => openOrderDrawer(order)}
                            className="btn btn-secondary"
                            style={{ padding: "0.35rem 0.85rem", fontSize: "0.75rem" }}
                          >
                            {order.status === "confirmed" ? "Dispatch ⚡" : "Inspect"}
                          </button>
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

        {/* View Mode 3: Customer Support & Complaints Desk (Phase 3) */}
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
                    LangGraph State Machine
                  </span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                  Test customer conversations live. Queries automatically route to Qdrant RAG (policies) or live tools (tracking, refunds, complaints).
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
                      AI Agent querying LangGraph & tools...
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
                    ⚡ Auto-Dispatch with AI Optimizer (LangGraph)
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
