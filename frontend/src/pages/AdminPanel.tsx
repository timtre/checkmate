import { useState, useEffect } from "react";
import { createToken, type TokenCreateResponse } from "../api";
import KnowledgePanel from "../components/KnowledgePanel";

export default function AdminPanel() {
  const [propertyId, setPropertyId] = useState(() => localStorage.getItem("propertyId") || "");
  const [guestName, setGuestName] = useState("");
  const [tokenResult, setTokenResult] = useState<TokenCreateResponse | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    localStorage.setItem("propertyId", propertyId);
  }, [propertyId]);

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
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Checkmate Admin</h1>
      </header>

      <section className="admin-card">
        <h2>Property</h2>
        <div className="form-group">
          <label>Property ID</label>
          <input
            type="text"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            placeholder="Enter property ID"
          />
        </div>
      </section>

      <section className="admin-card">
        <h2>Generate Guest Link</h2>
        {!propertyId.trim() && <p className="notice">Set a property ID above first.</p>}
        <div className="form-group">
          <label>Guest Name</label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Guest name"
            disabled={!propertyId.trim()}
          />
        </div>
        <button
          onClick={handleGenerateToken}
          disabled={tokenLoading || !propertyId.trim() || !guestName.trim()}
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
    </div>
  );
}
