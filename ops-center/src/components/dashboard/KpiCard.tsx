import { cn } from '@/lib/utils';

interface MetricProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'critical';
  trend?: {
    value: number;
    positive?: boolean;
  };
}

// Inline metrics row component
export function MetricsRow({ metrics }: { metrics: MetricProps[] }) {
  return (
    <div className="flex items-baseline gap-8 py-4 border-b border-border">
      {metrics.map((metric, index) => (
        <Metric key={index} {...metric} />
      ))}
    </div>
  );
}

function Metric({ label, value, variant = 'default', trend }: MetricProps) {
  const valueStyles = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-high',
    critical: 'text-critical',
  };

  return (
    <div className="flex items-baseline gap-2">
      <span className={cn('metric-value', valueStyles[variant])}>{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
      {trend && (
        <span className={cn('text-xs', trend.positive ? 'text-success' : 'text-critical')}>
          {trend.positive ? '↑' : '↓'}{Math.abs(trend.value)}%
        </span>
      )}
    </div>
  );
}

// Legacy card component for backwards compatibility
interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'success' | 'warning' | 'critical';
  trend?: {
    value: number;
    positive?: boolean;
  };
}

export function KpiCard({ title, value, subtitle, variant = 'default', trend }: KpiCardProps) {
  const valueStyles = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-high',
    critical: 'text-critical',
  };

  return (
    <div className="py-3">
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className={cn('metric-value', valueStyles[variant])}>{value}</span>
        {trend && (
          <span className={cn('text-xs', trend.positive ? 'text-success' : 'text-critical')}>
            {trend.positive ? '↑' : '↓'}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}