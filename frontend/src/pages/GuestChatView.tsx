import { useState, useRef, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { validateToken, sendMessage, getMessages, type ChatResponse, type TowerInsight } from "../api";
import MessageBubble from "../components/MessageBubble";
import "../guest-chat.css";

interface Message {
  role: "guest" | "assistant" | "property_manager";
  text: string;
  timestamp?: string;
  escalated?: boolean;
  towerInsights?: TowerInsight[];
}

export default function GuestChatView() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const debugMode = searchParams.get("debug") === "true";
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    setValidating(true);
    validateToken(token)
      .then(async (res) => {
        setPropertyId(res.property_id);
        setGuestName(res.guest_name);
        if (res.conversation_id) {
          setConversationId(res.conversation_id);
          try {
            const history = await getMessages(res.property_id, res.conversation_id);
            setMessages(
              history.map((m) => ({
                role: m.role,
                text: m.content,
                timestamp: m.created_at,
                escalated: m.escalated,
              }))
            );
          } catch {
            // Conversation may have been deleted; start fresh
          }
        }
      })
      .catch(() => {
        setError("This link is invalid or has expired.");
      })
      .finally(() => setValidating(false));
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!conversationId || !propertyId) return;

    const interval = setInterval(async () => {
      if (loading) return;
      try {
        const serverMessages = await getMessages(propertyId, conversationId);
        setMessages((prev) => {
          if (serverMessages.length <= prev.length) return prev;
          const newMessages = serverMessages.slice(prev.length);
          const mapped: Message[] = newMessages.map((m) => ({
            role: m.role,
            text: m.content,
            timestamp: m.created_at,
            escalated: m.escalated,
          }));
          return [...prev, ...mapped];
        });
      } catch {
        // Silently ignore poll errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [conversationId, propertyId, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !propertyId) return;

    setMessages((prev) => [...prev, { role: "guest", text, timestamp: new Date().toISOString() }]);
    setInput("");
    setLoading(true);

    try {
      const res: ChatResponse = await sendMessage(
        propertyId,
        text,
        conversationId,
        guestName || undefined
      );
      setConversationId(res.conversation_id);
      // Log Tower insights to console for debugging
      if (res.tower_insights?.length > 0) {
        console.log("Tower Insights for this response:", res.tower_insights);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.answer,
          timestamp: new Date().toISOString(),
          escalated: res.escalated,
          towerInsights: res.tower_insights,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${err}` }]);
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <div className="guest-chat">
        <div className="guest-chat-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="guest-chat">
        <div className="guest-chat-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="guest-chat">
      <header className="guest-chat-header">
        <h1>Concierge</h1>
        {guestName && <p className="guest-welcome">Welcome, {guestName}</p>}
      </header>
      <div className="guest-messages">
        {messages.length === 0 && (
          <div className="guest-welcome-message">
            <p>How can I help you during your stay?</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            <MessageBubble {...msg} />
            {debugMode && msg.towerInsights && msg.towerInsights.length > 0 && (
              <div className="tower-debug">
                <div className="tower-debug-header">Tower Insights (similar patterns)</div>
                {msg.towerInsights.map((insight, j) => (
                  <div key={j} className="tower-debug-item">
                    <span className="tower-pattern">"{insight.question_pattern}"</span>
                    <span className="tower-stats">
                      {Math.round(insight.similarity * 100)}% similar |
                      {Math.round(insight.historical_confidence * 100)}% historical confidence |
                      {insight.escalation_count} escalations
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="typing-indicator">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        className="guest-chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="Send">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}
