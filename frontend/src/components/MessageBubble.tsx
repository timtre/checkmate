import type { Source } from "../api";

interface Props {
  role: "guest" | "assistant" | "property_manager";
  text: string;
  confidence?: number;
  sources?: Source[];
  escalated?: boolean;
}

export default function MessageBubble({ role, text, confidence, sources, escalated }: Props) {
  const isGuest = role === "guest";
  const isPM = role === "property_manager";

  const className = isPM ? "property-manager" : isGuest ? "guest" : "assistant";

  return (
    <div className={`message-bubble ${className}`}>
      {isPM && <div className="pm-label">Property Manager</div>}
      <div className="bubble-content">{text}</div>
      {role === "assistant" && (
        <div className="bubble-meta">
          {confidence !== undefined && (
            <span className={`confidence-badge ${confidence >= 0.7 ? "high" : confidence >= 0.4 ? "mid" : "low"}`}>
              {Math.round(confidence * 100)}% confidence
            </span>
          )}
          {sources && sources.length > 0 && (
            <span className="source-count">{sources.length} source{sources.length > 1 ? "s" : ""}</span>
          )}
          {escalated && <span className="escalation-badge">Escalated</span>}
        </div>
      )}
    </div>
  );
}
