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

export const OperationsConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
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

  // Fetch stats and queue
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
      } catch {
        // Fallback for standalone frontend demonstration
        setOrders([
          {
            id: "10482",
            customer_name: "Zainab Tariq",
            customer_phone: "+92 301 8472910",
            total_price: 4200.0,
            currency: "PKR",
            shipping_city: "Lahore",
            shipping_address1: "House 24-B, DHA Phase 5",
            status: "confirmed",
            is_address_confirmed: true,
            is_amount_confirmed: true,
            intent_to_receive: true,
            confirmation_attempt_count: 1,
            created_at: "12 mins ago"
          },
          {
            id: "10481",
            customer_name: "Bilal Siddiqui",
            customer_phone: "+92 321 9920194",
            total_price: 2850.0,
            currency: "PKR",
            shipping_city: "Karachi",
            shipping_address1: "Flat 402, Clifton Block 2",
            status: "calling",
            is_address_confirmed: false,
            is_amount_confirmed: false,
            intent_to_receive: false,
            confirmation_attempt_count: 1,
            created_at: "25 mins ago"
          },
          {
            id: "10480",
            customer_name: "Hamza Abbasi",
            customer_phone: "+92 333 5182901",
            total_price: 8900.0,
            currency: "PKR",
            shipping_city: "Islamabad",
            shipping_address1: "Street 14, Sector F-7/2",
            status: "callback_scheduled",
            is_address_confirmed: true,
            is_amount_confirmed: true,
            intent_to_receive: false,
            confirmation_attempt_count: 2,
            created_at: "1 hour ago"
          },
          {
            id: "10479",
            customer_name: "Ayesha Raza",
            customer_phone: "+92 300 4482019",
            total_price: 1600.0,
            currency: "PKR",
            shipping_city: "Rawalpindi",
            shipping_address1: "House 9, Westridge 1",
            status: "escalated",
            is_address_confirmed: false,
            is_amount_confirmed: false,
            intent_to_receive: false,
            confirmation_attempt_count: 2,
            created_at: "2 hours ago"
          }
        ]);
      }
    };
    fetchQueue();
  }, [activeTab]);

  const handleAction = async (action: string) => {
    if (!selectedOrder) return;
    setLoadingAction(true);
    try {
      await fetch(`http://localhost:8000/api/v1/orders/${selectedOrder.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      // Local optimistic update
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

  return (
    <section id="console" style={{
      scrollMarginTop: "90px",
      padding: "6rem 0",
      backgroundColor: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)"
    }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ marginBottom: "3rem" }}>
          <div className="section-tag">
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--shopify-green)" }} />
            Operations Command Center
          </div>
          <h2 className="section-title">Real-Time Operations & Queue</h2>
          <p className="section-desc">
            Monitor real-time confirmation performance, view call attempts, and override orders needing operator attention.
          </p>
        </div>

        {/* Real-time KPI Metric Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "1.25rem",
          marginBottom: "3rem"
        }}>
          <div className="surface-card" style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Orders Processed
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)", margin: "0.4rem 0" }}>
              {stats.total_orders.toLocaleString()}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--shopify-green)", fontWeight: 600 }}>
              ↑ 12% today
            </div>
          </div>

          <div className="surface-card" style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Orders Confirmed
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--shopify-green)", margin: "0.4rem 0" }}>
              {stats.confirmed.toLocaleString()}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
              PKR {Math.round(stats.total_revenue_pkr / 1000)}k booked
            </div>
          </div>

          <div className="surface-card" style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              AI Automation Rate
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--ai-cyan)", margin: "0.4rem 0" }}>
              {stats.ai_automation_rate}%
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--shopify-green)", fontWeight: 600 }}>
              ● Zero human touch
            </div>
          </div>

          <div className="surface-card" style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Active Calls
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)", margin: "0.4rem 0" }}>
              {stats.calling}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--ai-cyan)", fontWeight: 600 }}>
              ● Live in telephony
            </div>
          </div>

          <div className="surface-card" style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Human Escalations
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: 800, color: stats.escalated > 0 ? "var(--warning-amber)" : "var(--text-primary)", margin: "0.4rem 0" }}>
              {stats.escalated}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Requires agent review
            </div>
          </div>
        </div>

        {/* Live Activity Feed Bar */}
        <div style={{
          backgroundColor: "var(--bg-main)",
          borderRadius: "10px",
          padding: "1rem 1.5rem",
          marginBottom: "2.5rem",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          overflowX: "auto"
        }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--shopify-green)", whiteSpace: "nowrap" }}>
            ● LIVE ACTIVITY STREAM:
          </span>
          <div style={{ display: "flex", gap: "2rem", whiteSpace: "nowrap", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            <span><strong style={{ color: "var(--shopify-green)" }}>✓</strong> Order #10482 confirmed by AI Voice</span>
            <span><strong style={{ color: "var(--ai-cyan)" }}>✓</strong> Customer support query resolved (Return policy)</span>
            <span><strong style={{ color: "var(--text-primary)" }}>✓</strong> TCS shipment booked (#TCS-77291048)</span>
            <span><strong style={{ color: "var(--shopify-green)" }}>✓</strong> Shopify status updated: Ready to Dispatch</span>
          </div>
        </div>

        {/* Interactive Order Queue Card */}
        <div className="surface-card" style={{ padding: "1.5rem" }}>
          {/* Tabs Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
            {["all", "calling", "confirmed", "callback_scheduled", "escalated", "unreachable"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeTab === tab ? "var(--text-primary)" : "transparent",
                  color: activeTab === tab ? "var(--text-inverted)" : "var(--text-secondary)",
                  transition: "all var(--transition-fast)",
                  textTransform: "capitalize"
                }}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Orders Data Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
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
                          onClick={() => setSelectedOrder(order)}
                          className="btn btn-secondary"
                          style={{ padding: "0.35rem 0.85rem", fontSize: "0.75rem" }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slide-Over Order Detail Drawer */}
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
              width: "480px",
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
                      Order Audit Drawer
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

                  <div style={{ padding: "1rem", backgroundColor: "var(--bg-main)", borderRadius: "8px" }}>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Confirmation Audit Criteria</div>
                    <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <div>{selectedOrder.is_address_confirmed ? "✓" : "✗"} Address confirmed by customer</div>
                      <div>{selectedOrder.is_amount_confirmed ? "✓" : "✗"} COD Payable amount accepted: {selectedOrder.currency} {selectedOrder.total_price}</div>
                      <div>{selectedOrder.intent_to_receive ? "✓" : "✗"} Explicit commitment to pay courier upon delivery</div>
                    </div>
                  </div>

                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Total call attempts made: <strong>{selectedOrder.confirmation_attempt_count}</strong>
                  </div>
                </div>
              </div>

              {/* Operator Override Actions */}
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button
                  onClick={() => handleAction("manual_confirm")}
                  disabled={loadingAction}
                  className="btn btn-green"
                  style={{ width: "100%" }}
                >
                  ✓ Manual Confirm Order
                </button>
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
