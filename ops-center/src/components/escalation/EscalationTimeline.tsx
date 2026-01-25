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
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="flex gap-4">
          {/* Time */}
          <div className="w-12 flex-shrink-0 text-xs text-muted-foreground pt-0.5">
            {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
  );
}