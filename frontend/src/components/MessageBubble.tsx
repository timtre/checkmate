import ReactMarkdown from "react-markdown";

interface Props {
  role: "guest" | "assistant" | "property_manager";
  text: string;
  timestamp?: string;
  escalated?: boolean;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ role, text, timestamp, escalated }: Props) {
  const isGuest = role === "guest";
  const isPM = role === "property_manager";

  const className = isPM ? "property-manager" : isGuest ? "guest" : "assistant";

  return (
    <div className={`message-bubble ${className}`}>
      {isPM && <div className="pm-label">Property Manager</div>}
      <div className={`bubble-content${!isGuest ? " bubble-markdown" : ""}`}>
        {isGuest ? text : <ReactMarkdown>{text}</ReactMarkdown>}
      </div>
      {role === "assistant" && escalated && (
        <div className="bubble-meta">
          <span className="escalation-badge" data-tooltip="A property manager has been informed and will get back to you shortly.">Escalated</span>
        </div>
      )}
      {timestamp && <div className="bubble-time">{formatTime(timestamp)}</div>}
    </div>
  );
}
