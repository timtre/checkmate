import { cn } from '@/lib/utils';

interface HealthMetric {
  label: string;
  value: string | number;
  status: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

interface PropertyHealthBarProps {
  metrics: HealthMetric[];
}

const statusColors = {
  good: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-critical',
};

const trendColors = {
  up: 'text-success',
  down: 'text-critical',
  stable: 'text-muted-foreground',
};

const trendArrows = {
  up: '↑',
  down: '↓',
  stable: '→',
};

export const PropertyHealthBar = ({ metrics }: PropertyHealthBarProps) => {
  return (
    <div className="flex items-stretch gap-1 rounded-lg overflow-hidden bg-muted/30 p-1">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-md bg-background"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className={cn('w-2 h-2 rounded-full', statusColors[metric.status])} />
            <span className="text-lg font-semibold text-foreground">
              {metric.value}
              {metric.trend && (
                <span className={cn('text-xs ml-1', trendColors[metric.trend])}>
                  {trendArrows[metric.trend]}
                </span>
              )}
            </span>
          </div>
          <span className="text-xs text-muted-foreground text-center">
            {metric.label}
          </span>
        </div>
      ))}
    </div>
  );
};
