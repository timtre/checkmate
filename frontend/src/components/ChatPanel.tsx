import { useState, useRef, useEffect } from "react";
import { sendMessage, type ChatResponse, type Source } from "../api";
import MessageBubble from "./MessageBubble";

interface Message {
  role: "guest" | "assistant";
  text: string;
  confidence?: number;
  sources?: Source[];
  escalated?: boolean;
}

interface Props {
  propertyId: string;
  guestName: string;
}

export default function ChatPanel({ propertyId, guestName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !propertyId) return;

    setMessages((prev) => [...prev, { role: "guest", text }]);
    setInput("");
    setLoading(true);

    try {
      const res: ChatResponse = await sendMessage(propertyId, text, conversationId, guestName || undefined);
      setConversationId(res.conversation_id);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.answer,
          confidence: res.confidence,
          sources: res.sources,
          escalated: res.escalated,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${err}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleNewConversation() {
    setMessages([]);
    setConversationId(undefined);
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h2>Chat</h2>
        <button onClick={handleNewConversation} className="btn-secondary">
          New Conversation
        </button>
      </div>
      <div className="messages">
        {messages.map((msg, i) => (
          <MessageBubble key={i} {...msg} />
        ))}
        {loading && <div className="loading">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={loading || !propertyId}
        />
        <button type="submit" disabled={loading || !propertyId || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
