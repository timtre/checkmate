import { cn } from '@/lib/utils';
import { TimelineEvent } from '@/lib/mockData';

interface EscalationTimelineProps {
  events: TimelineEvent[];
}

export function EscalationTimeline({ events }: EscalationTimelineProps) {
  const getEventLabel = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'guest_message':
        return 'Guest';
      case 'agent_message':
        return 'AI Concierge';
      case 'agent_action':
        return 'Action';
      case 'pm_action':
        return 'You';
      case 'system':
        return 'System';
    }
  };

  const getLabelStyle = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'guest_message':
        return 'text-foreground';
      case 'agent_message':
        return 'text-primary';
      case 'agent_action':
        return 'text-high';
      case 'pm_action':
        return 'text-foreground';
      case 'system':
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute left-[3.25rem] top-2 bottom-2 w-px bg-border" />

      <div className="space-y-0">
        {events.map((event, index) => (
          <div
            key={event.id}
            className={cn(
              'flex gap-4 py-3',
              index !== events.length - 1 && 'border-b border-border/50'
            )}
          >
            {/* Time */}
            <div className="w-14 flex-shrink-0 text-xs text-muted-foreground pt-0.5">
              {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Timeline dot */}
            <div className="relative flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-border mt-1.5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs font-medium mb-1', getLabelStyle(event.type))}>
                {getEventLabel(event.type)}
              </p>
              <p className="text-sm text-foreground">{event.content}</p>
              {event.metadata?.action && (
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                  {event.metadata.action.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}