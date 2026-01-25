import { Button } from '@/components/ui/button';
import { Check, X, Lightbulb } from 'lucide-react';
import { DocSuggestion, formatTimeAgo } from '@/lib/mockData';

interface DocSuggestionCardProps {
  suggestion: DocSuggestion;
  onAccept?: () => void;
  onDismiss?: () => void;
}

export function DocSuggestionCard({ suggestion, onAccept, onDismiss }: DocSuggestionCardProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-smooth">
      <div className="p-2 rounded-lg bg-primary/10">
        <Lightbulb className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground text-sm mb-1">{suggestion.title}</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Based on {suggestion.evidence.length} related escalations
        </p>
        <p className="text-xs text-success font-medium">{suggestion.impact}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
          onClick={onAccept}
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-critical hover:bg-critical/10"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
