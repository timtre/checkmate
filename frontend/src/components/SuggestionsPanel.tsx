import { useState, useEffect, useCallback } from "react";
import { Lightbulb, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  getSuggestions,
  approveSuggestion,
  dismissSuggestion,
  type KBSuggestion,
} from "../api";

interface Props {
  propertyId: string;
  onApproved?: () => void;
}

export default function SuggestionsPanel({ propertyId, onApproved }: Props) {
  const [suggestions, setSuggestions] = useState<KBSuggestion[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (!propertyId) return;
    try {
      const res = await getSuggestions(propertyId);
      setSuggestions(res.suggestions);
    } catch {
      // silent
    }
  }, [propertyId]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  function handleExpand(suggestion: KBSuggestion) {
    if (expandedId === suggestion.suggestion_id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(suggestion.suggestion_id);
    setEditTitle(suggestion.title);
    setEditContent(suggestion.content);
    setEditCategory(suggestion.category);
  }

  async function handleApprove(suggestionId: string) {
    setLoading(true);
    try {
      await approveSuggestion(suggestionId, {
        title: editTitle,
        content: editContent,
        category: editCategory,
      });
      setSuggestions((prev) => prev.filter((s) => s.suggestion_id !== suggestionId));
      setExpandedId(null);
      onApproved?.();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleDismiss(suggestionId: string) {
    setLoading(true);
    try {
      await dismissSuggestion(suggestionId);
      setSuggestions((prev) => prev.filter((s) => s.suggestion_id !== suggestionId));
      setExpandedId(null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          Knowledge Base Suggestions
          {suggestions.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {suggestions.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending suggestions. Reply to escalations and run the Tower job to generate Knowledge Base article drafts.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            These articles were drafted from your escalation replies. Approve to add to the knowledge base.
          </p>
        )}
        {suggestions.map((s) => {
          const isExpanded = expandedId === s.suggestion_id;
          return (
            <div
              key={s.suggestion_id}
              className="border rounded-lg p-3 space-y-2"
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleExpand(s)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{s.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {s.category}
                  </Badge>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {!isExpanded && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {s.content}
                </p>
              )}

              {isExpanded && (
                <div className="space-y-3 pt-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Title"
                  />
                  <Input
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Category"
                  />
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(s.suggestion_id)}
                      disabled={loading || !editTitle.trim() || !editContent.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismiss(s.suggestion_id)}
                      disabled={loading}
                    >
                      <X className="h-3.5 w-3.5" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
