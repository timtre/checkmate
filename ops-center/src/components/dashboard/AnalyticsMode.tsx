import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const dateRanges = ['7 days', '30 days', '90 days'] as const;

export const AnalyticsMode = () => {
  const [range, setRange] = useState<typeof dateRanges[number]>('30 days');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Date range selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">Period:</span>
        {dateRanges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "px-3 py-1 text-sm rounded-md transition-colors",
              range === r
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Experience Trends */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-4">Experience Trends</h2>
          <div className="space-y-4">
            <TrendChart label="Overall Sentiment" value="87%" trend="up" />
            <TrendChart label="Friction Rate" value="12%" trend="down" />
            <TrendChart label="Human Intervention" value="8%" trend="stable" />
          </div>
        </section>

        {/* Root Causes */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-4">Root Causes</h2>
          <div className="space-y-3">
            <RootCauseItem rank={1} label="Wi-Fi connectivity issues" count={24} />
            <RootCauseItem rank={2} label="Check-in instructions unclear" count={18} />
            <RootCauseItem rank={3} label="Heating/cooling questions" count={12} />
            <RootCauseItem rank={4} label="Parking location" count={9} />
            <RootCauseItem rank={5} label="Appliance usage" count={6} />
          </div>
        </section>

        {/* Knowledge Quality */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-4">Knowledge Quality</h2>
          <div className="grid grid-cols-3 gap-4">
            <KpiBox label="Question Coverage" value="94%" />
            <KpiBox label="Doc Gaps" value="3" />
            <KpiBox label="Repeated Questions" value="7" />
          </div>
        </section>

        {/* Property Comparison */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-4">Property Comparison</h2>
          <div className="space-y-2">
            <PropertyRow name="Beach House #1" sentiment={92} friction={8} intervention={5} />
            <PropertyRow name="Downtown Loft" sentiment={85} friction={15} intervention={12} />
            <PropertyRow name="Mountain Cabin" sentiment={88} friction={10} intervention={8} />
          </div>
        </section>
      </div>
    </div>
  );
};

const TrendChart = ({ label, value, trend }: { label: string; value: string; trend: 'up' | 'down' | 'stable' }) => (
  <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
    <span className="text-sm text-muted-foreground">{label}</span>
    <div className="flex items-center gap-2">
      <span className="font-medium">{value}</span>
      <span className={cn(
        'text-xs',
        trend === 'up' ? 'text-success' : trend === 'down' ? 'text-critical' : 'text-muted-foreground'
      )}>
        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
      </span>
    </div>
  </div>
);

const RootCauseItem = ({ rank, label, count }: { rank: number; label: string; count: number }) => (
  <div className="flex items-center gap-3 text-sm">
    <span className="text-muted-foreground w-4">{rank}.</span>
    <span className="flex-1 text-foreground">{label}</span>
    <span className="text-muted-foreground">{count} mentions</span>
  </div>
);

const KpiBox = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center p-3 rounded-md bg-muted/30">
    <div className="text-xl font-semibold text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground mt-1">{label}</div>
  </div>
);

const PropertyRow = ({ name, sentiment, friction, intervention }: { name: string; sentiment: number; friction: number; intervention: number }) => (
  <div className="flex items-center gap-4 p-2 rounded-md bg-muted/20 text-sm">
    <span className="flex-1 text-foreground">{name}</span>
    <span className={cn('w-16 text-center', sentiment >= 90 ? 'text-success' : 'text-warning')}>{sentiment}%</span>
    <span className={cn('w-16 text-center', friction <= 10 ? 'text-success' : 'text-warning')}>{friction}%</span>
    <span className={cn('w-16 text-center', intervention <= 8 ? 'text-success' : 'text-warning')}>{intervention}%</span>
  </div>
);
