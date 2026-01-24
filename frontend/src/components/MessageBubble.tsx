import type { Source } from "../api";

interface Props {
  role: "guest" | "assistant";
  text: string;
  confidence?: number;
  sources?: Source[];
  escalated?: boolean;
}

export default function MessageBubble({ role, text, confidence, sources, escalated }: Props) {
  const isGuest = role === "guest";

  return (
    <div className={`message-bubble ${isGuest ? "guest" : "assistant"}`}>
      <div className="bubble-content">{text}</div>
      {!isGuest && (
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
