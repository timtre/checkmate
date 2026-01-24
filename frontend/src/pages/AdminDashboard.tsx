import { useState, useEffect, useCallback } from "react";
import {
  getProperties,
  getInsights,
  getEscalations,
  getDocuments,
  createToken,
  type PropertyItem,
  type InsightsResponse,
  type EscalationItem,
  type KnowledgeBaseDocument,
  type TokenCreateResponse,
} from "../api";
import StatsOverview from "../components/StatsOverview";
import EscalationCard from "../components/EscalationCard";
import InsightsTable from "../components/InsightsTable";
import DocumentsTable from "../components/DocumentsTable";
import KnowledgePanel from "../components/KnowledgePanel";

export default function AdminDashboard() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [propertyId, setPropertyId] = useState(() => localStorage.getItem("propertyId") || "");
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [escalationFilter, setEscalationFilter] = useState<"open" | "all">("open");

  // Create property state
  const [newPropertyId, setNewPropertyId] = useState("");

  // Guest link state
  const [guestName, setGuestName] = useState("");
  const [tokenResult, setTokenResult] = useState<TokenCreateResponse | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");

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
      const [insightsRes, escalationsRes, documentsRes] = await Promise.all([
        getInsights(propertyId),
        getEscalations(propertyId, escalationFilter === "open" ? "open" : undefined),
        getDocuments(propertyId),
      ]);
      setInsights(insightsRes);
      setEscalations(escalationsRes.escalations);
      setDocuments(documentsRes.documents);
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

  function handleAddProperty() {
    const id = newPropertyId.trim();
    if (!id) return;
    if (!properties.some((p) => p.property_id === id)) {
      setProperties((prev) => [...prev, { property_id: id, conversation_count: 0 }]);
    }
    setPropertyId(id);
    setNewPropertyId("");
  }

  async function handleGenerateToken() {
    if (!propertyId.trim() || !guestName.trim()) return;
    setTokenLoading(true);
    setTokenResult(null);
    setTokenError("");
    try {
      const res = await createToken(propertyId, guestName);
      setTokenResult(res);
      setGuestName("");
    } catch (err) {
      setTokenError(String(err));
    } finally {
      setTokenLoading(false);
    }
  }

  const guestLink = tokenResult
    ? `${window.location.origin}/chat/${tokenResult.token}`
    : null;

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
        <div className="add-property-form">
          <input
            type="text"
            value={newPropertyId}
            onChange={(e) => setNewPropertyId(e.target.value)}
            placeholder="New property ID"
            onKeyDown={(e) => e.key === "Enter" && handleAddProperty()}
          />
          <button onClick={handleAddProperty} disabled={!newPropertyId.trim()}>
            Add
          </button>
        </div>
      </aside>

      <main className="pm-main">
        <header className="admin-header">
          <h1>
            Checkmate Admin
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

            <DocumentsTable documents={documents} />
          </>
        )}

        {propertyId && (
          <>
            <section className="admin-card">
              <h2>Generate Guest Link</h2>
              <div className="form-group">
                <label>Guest Name</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Guest name"
                />
              </div>
              <button
                onClick={handleGenerateToken}
                disabled={tokenLoading || !guestName.trim()}
              >
                {tokenLoading ? "Generating..." : "Generate Link"}
              </button>
              {guestLink && (
                <div className="token-result">
                  <label>Shareable Link:</label>
                  <code>{guestLink}</code>
                </div>
              )}
              {tokenError && <div className="result error">{tokenError}</div>}
            </section>

            <section className="admin-card">
              <KnowledgePanel propertyId={propertyId} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
