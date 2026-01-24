import { useState, useEffect } from "react";
import ChatPanel from "./components/ChatPanel";
import KnowledgePanel from "./components/KnowledgePanel";
import "./App.css";

function App() {
  const [propertyId, setPropertyId] = useState(() => localStorage.getItem("propertyId") || "");
  const [guestName, setGuestName] = useState(() => localStorage.getItem("guestName") || "");
  const [activeTab, setActiveTab] = useState<"chat" | "knowledge">("chat");

  useEffect(() => {
    localStorage.setItem("propertyId", propertyId);
  }, [propertyId]);

  useEffect(() => {
    localStorage.setItem("guestName", guestName);
  }, [guestName]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Checkmate</h1>
        <div className="header-inputs">
          <input
            type="text"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            placeholder="Property ID"
            className="header-input"
          />
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Guest name (optional)"
            className="header-input"
          />
        </div>
        <nav className="tabs">
          <button className={activeTab === "chat" ? "active" : ""} onClick={() => setActiveTab("chat")}>
            Chat
          </button>
          <button className={activeTab === "knowledge" ? "active" : ""} onClick={() => setActiveTab("knowledge")}>
            Knowledge Base
          </button>
        </nav>
      </header>
      <main className="app-main">
        {!propertyId && <div className="notice">Enter a Property ID to get started.</div>}
        {activeTab === "chat" ? (
          <ChatPanel propertyId={propertyId} guestName={guestName} />
        ) : (
          <KnowledgePanel propertyId={propertyId} />
        )}
      </main>
    </div>
  );
}

export default App;
