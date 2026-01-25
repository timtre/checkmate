import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DocSuggestion } from '@/lib/mockData';

interface SuggestionCardProps {
  suggestion: DocSuggestion;
  onAccept?: () => void;
  onDismiss?: () => void;
}

export const SuggestionCard = ({ suggestion, onAccept, onDismiss }: SuggestionCardProps) => {
  return (
    <div className="p-4 rounded-lg bg-muted/20 border border-border/30 space-y-3">
      {/* Detected issue - neutral tone */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {suggestion.title}
      </p>
      
      {/* Impact highlight - pastel green emphasis */}
      <div className={cn(
        'inline-block px-3 py-1.5 rounded-md text-sm font-medium',
        'bg-[hsl(var(--success-pastel))] text-[hsl(var(--success-pastel-text))]'
      )}>
        {suggestion.impact}
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={onAccept}>
          Accept & Update
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
};
