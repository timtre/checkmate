import { useState } from "react";
import { Send, Inbox, Trash2 } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { replyToEscalation, type EscalationItem } from "../api";

interface EscalationCardProps {
  escalation: EscalationItem;
  onReplied: (id: string) => void;
  onDelete?: (id: string) => void;
}

function getReasonColor(reason: string) {
  switch (reason) {
    case "safety": return "bg-red-100 text-red-800 border-red-200";
    case "access_blocked": return "bg-orange-100 text-orange-800 border-orange-200";
    case "maintenance_urgent": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "dissatisfied": return "bg-red-100 text-red-800 border-red-200";
    case "cannot_answer": return "bg-blue-100 text-blue-800 border-blue-200";
    case "repeated_unanswered": return "bg-purple-100 text-purple-800 border-purple-200";
    case "other": return "bg-slate-100 text-slate-800 border-slate-200";
    // Legacy values for existing DB records
    case "low_confidence": return "bg-amber-100 text-amber-800 border-amber-200";
    case "dissatisfaction": return "bg-red-100 text-red-800 border-red-200";
    case "repeated_question": return "bg-purple-100 text-purple-800 border-purple-200";
    case "knowledge_gap": return "bg-blue-100 text-blue-800 border-blue-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.7) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (confidence >= 0.4) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

export default function EscalationCard({ escalation, onReplied, onDelete }: EscalationCardProps) {
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

  return (
    <Card className="mb-3">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{escalation.guest_name}</span>
          <Badge className={getReasonColor(escalation.reason)} variant="outline">
            {escalation.reason.replace(/_/g, " ")}
          </Badge>
          <Badge className={getConfidenceColor(escalation.confidence)} variant="outline">
            {Math.round(escalation.confidence * 100)}%
          </Badge>
          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(escalation.created_at).toLocaleString()}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(escalation.escalation_id)}
              className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete escalation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium text-sm">{escalation.guest_message}</p>
        </div>
        <div className="text-sm text-muted-foreground border-l-2 border-border pl-3">
          {escalation.ai_answer}
        </div>

        {escalation.pm_reply ? (
          <Alert variant="success">
            <AlertDescription>
              <strong>Reply:</strong> {escalation.pm_reply}
            </AlertDescription>
          </Alert>
        ) : replySuccess ? (
          <Alert variant="success">
            <AlertDescription>Reply sent successfully.</AlertDescription>
          </Alert>
        ) : (
          <div className="flex gap-2 items-start pt-1">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type a reply to inject into the conversation..."
              rows={2}
              className="flex-1 resize-none"
            />
            <Button
              size="sm"
              onClick={handleReply}
              disabled={replying || !replyText.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EscalationsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Inbox className="h-10 w-10 mb-3 opacity-50" />
      <p className="text-sm">No escalations found.</p>
    </div>
  );
}
