import { useState } from "react";
import { replyToEscalation, type EscalationItem } from "../api";

interface EscalationCardProps {
  escalation: EscalationItem;
  onReplied: (id: string) => void;
}

export default function EscalationCard({ escalation, onReplied }: EscalationCardProps) {
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  async function handleReply() {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await replyToEscalation(escalation.escalation_id, replyText);
      setReplySuccess(true);
      setTimeout(() => onReplied(escalation.escalation_id), 1000);
    } catch {
      setReplying(false);
    }
  }

  const confidenceClass =
    escalation.confidence >= 0.7 ? "high" : escalation.confidence >= 0.4 ? "mid" : "low";

  return (
    <div className="escalation-item">
      <div className="escalation-meta">
        <span className="reason-badge">{escalation.reason}</span>
        <span className={`confidence-badge ${confidenceClass}`}>
          {Math.round(escalation.confidence * 100)}%
        </span>
        <span className="escalation-time">
          {new Date(escalation.created_at).toLocaleString()}
        </span>
      </div>
      <div className="escalation-guest-msg">{escalation.guest_message}</div>
      <div className="escalation-ai-answer">{escalation.ai_answer}</div>
      {escalation.pm_reply ? (
        <div className="escalation-pm-reply">
          <strong>Reply:</strong> {escalation.pm_reply}
        </div>
      ) : replySuccess ? (
        <div className="result success">Reply sent</div>
      ) : (
        <div className="escalation-reply-form">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type a reply to inject into the conversation..."
            rows={2}
          />
          <button onClick={handleReply} disabled={replying || !replyText.trim()}>
            {replying ? "Sending..." : "Send Reply"}
          </button>
        </div>
      )}
    </div>
  );
}
