import { cn } from '@/lib/utils';

interface ModeToggleProps {
  mode: 'ops' | 'analytics';
  onModeChange: (mode: 'ops' | 'analytics') => void;
}

export const ModeToggle = ({ mode, onModeChange }: ModeToggleProps) => {
  return (
    <div className="inline-flex items-center rounded-md bg-muted p-0.5">
      <button
        onClick={() => onModeChange('ops')}
        className={cn(
          "px-4 py-1.5 text-sm font-medium rounded transition-colors",
          mode === 'ops'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Daily Ops
      </button>
      <button
        onClick={() => onModeChange('analytics')}
        className={cn(
          "px-4 py-1.5 text-sm font-medium rounded transition-colors",
          mode === 'analytics'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Analytics
      </button>
    </div>
  );
};
