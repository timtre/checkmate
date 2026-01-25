import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Escalation, formatTimeAgo } from '@/lib/mockData';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';

interface UrgentBannerProps {
  escalation: Escalation;
}

export function UrgentBanner({ escalation }: UrgentBannerProps) {
  const { properties } = usePropertyScope();
  const property = properties.find(p => p.id === escalation.propertyId);
  const propertyName = property?.name || 'Unknown Property';

  return (
    <Link
      to={`/escalation/${escalation.id}`}
      className="flex items-center justify-between gap-4 py-3 px-4 bg-critical text-critical-foreground rounded-lg hover:bg-critical/90 transition-smooth"
    >
      <div className="min-w-0">
        <p className="font-medium truncate">
          Urgent: {escalation.summary}
        </p>
        <p className="text-sm opacity-90 truncate">
          {propertyName} - {escalation.guestName} - {formatTimeAgo(escalation.createdAt)}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 flex-shrink-0" />
    </Link>
  );
}
