import { useState, useEffect, useCallback } from "react";
import {
  getProperties,
  getInsights,
  getEscalations,
  type PropertyItem,
  type InsightsResponse,
  type EscalationItem,
} from "../api";
import StatsOverview from "../components/StatsOverview";
import EscalationCard from "../components/EscalationCard";
import InsightsTable from "../components/InsightsTable";

export default function PMDashboard() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [propertyId, setPropertyId] = useState(() => localStorage.getItem("propertyId") || "");
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [escalationFilter, setEscalationFilter] = useState<"open" | "all">("open");

  useEffect(() => {
    getProperties()
      .then((res) => setProperties(res.properties))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (propertyId) localStorage.setItem("propertyId", propertyId);
  }, [propertyId]);

  const fetchData = useCallback(async () => {
    if (!propertyId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const [insightsRes, escalationsRes] = await Promise.all([
        getInsights(propertyId),
        getEscalations(propertyId, escalationFilter === "open" ? "open" : undefined),
      ]);
      setInsights(insightsRes);
      setEscalations(escalationsRes.escalations);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [propertyId, escalationFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleReplied(id: string) {
    setEscalations((prev) => prev.filter((e) => e.escalation_id !== id));
  }

  return (
    <div className="pm-layout">
      <aside className="pm-sidebar">
        <h2>Properties</h2>
        {properties.length === 0 ? (
          <p className="notice">No properties found.</p>
        ) : (
          <ul className="property-list">
            {properties.map((p) => (
              <li
                key={p.property_id}
                className={p.property_id === propertyId ? "active" : ""}
                onClick={() => setPropertyId(p.property_id)}
              >
                <span className="property-name">{p.property_id}</span>
                <span className="property-count">{p.conversation_count}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main className="pm-main">
        <header className="admin-header">
          <h1>
            PM Dashboard
            <button className="refresh-btn" onClick={fetchData} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </h1>
        </header>

        {!propertyId && (
          <p className="notice">Select a property from the sidebar.</p>
        )}

        {error && <div className="result error">{error}</div>}

        {insights && (
          <>
            <StatsOverview
              conversations={insights.total_conversations}
              messages={insights.total_messages}
              escalations={insights.total_escalations}
            />

            <section className="admin-card">
              <h2>
                Escalations
                {escalations.length > 0 && (
                  <span className="count-badge">{escalations.length}</span>
                )}
              </h2>
              <div className="filter-toggle">
                <button
                  className={escalationFilter === "open" ? "active" : ""}
                  onClick={() => setEscalationFilter("open")}
                >
                  Open
                </button>
                <button
                  className={escalationFilter === "all" ? "active" : ""}
                  onClick={() => setEscalationFilter("all")}
                >
                  All
                </button>
              </div>
              {escalations.length === 0 ? (
                <p className="notice">No escalations found.</p>
              ) : (
                escalations.map((esc) => (
                  <EscalationCard
                    key={esc.escalation_id}
                    escalation={esc}
                    onReplied={handleReplied}
                  />
                ))
              )}
            </section>

            <InsightsTable title="Most Asked Questions" items={insights.most_asked} />
            <InsightsTable title="Worst Answered Questions" items={insights.worst_answered} />
          </>
        )}
      </main>
    </div>
  );
}
