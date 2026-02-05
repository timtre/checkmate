import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Lightbulb, Loader2 } from 'lucide-react';
import { DocSuggestion } from '@/lib/mockData';

interface DocSuggestionCardProps {
  suggestion: DocSuggestion;
  onAccept?: () => void;
  onDismiss?: () => void;
  isLoading?: boolean;
}

export function DocSuggestionCard({ suggestion, onAccept, onDismiss, isLoading }: DocSuggestionCardProps) {
  const isKbAddition = suggestion.suggestionType === 'kb_addition';

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-smooth">
      <div className="p-2 rounded-lg bg-primary/10">
        <Lightbulb className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant="outline"
            className={isKbAddition
              ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
              : 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
            }
          >
            {isKbAddition ? 'Knowledge Base' : 'Prompt Update'}
          </Badge>
          <h4 className="font-medium text-foreground text-sm">{suggestion.title}</h4>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Based on {suggestion.evidence.length} related escalations
        </p>
        <p className="text-xs text-success font-medium">{suggestion.impact}</p>
        {suggestion.content && (
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              Preview content
            </summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32 whitespace-pre-wrap">
              {suggestion.content}
            </pre>
          </details>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
          onClick={onAccept}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-critical hover:bg-critical/10"
          onClick={onDismiss}
          disabled={isLoading}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
