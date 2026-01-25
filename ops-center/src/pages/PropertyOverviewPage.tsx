import { Link, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Users,
  AlertTriangle,
  Bot,
  FileText,
  BarChart3,
  MapPin,
  Home,
  ArrowRight,
  Settings,
} from 'lucide-react';
import { escalations, docSuggestions } from '@/lib/mockData';

const PropertyOverviewPage = () => {
  const { scope, selectedProperty } = usePropertyScope();

  // Redirect to portfolio if no property selected
  if (scope !== 'property' || !selectedProperty) {
    return <Navigate to="/" replace />;
  }

  // Filter data for this property
  const propertyEscalations = escalations.filter(e => e.propertyId === selectedProperty.id);
  const openEscalations = propertyEscalations.filter(e => e.status === 'open' || e.status === 'waiting_on_pm');
  const resolvedCount = propertyEscalations.filter(e => e.status === 'resolved' || e.status === 'closed').length;
  const resolvedByAI = propertyEscalations.length > 0 
    ? Math.round((resolvedCount / propertyEscalations.length) * 100) 
    : 0;

  const propertySuggestions = docSuggestions.filter(s => s.propertyId === selectedProperty.id && s.status === 'new');

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        {/* Property header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{selectedProperty.name}</h1>
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedProperty.address}
                </p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            Property Settings
          </Button>
        </div>

        {/* Property KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Units"
            value={selectedProperty.units}
            subtitle="Total units"
            icon={Home}
          />
          <KpiCard
            title="Active Stays"
            value={3}
            subtitle="Currently hosting"
            icon={Users}
          />
          <KpiCard
            title="Open Issues"
            value={openEscalations.length}
            subtitle="Needs attention"
            icon={AlertTriangle}
            variant={openEscalations.length > 0 ? 'warning' : 'default'}
          />
          <KpiCard
            title="AI Resolution"
            value={`${resolvedByAI}%`}
            subtitle="This month"
            icon={Bot}
            variant="success"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary" />
                Knowledge Base
              </CardTitle>
              <CardDescription>
                Configure check-in instructions, Wi-Fi, and documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {propertySuggestions.length > 0 && (
                <div className="mb-4 p-3 bg-high-muted/50 rounded-lg border border-high/20">
                  <p className="text-sm text-high font-medium">
                    {propertySuggestions.length} documentation improvement{propertySuggestions.length > 1 ? 's' : ''} suggested
                  </p>
                </div>
              )}
              <Link to="/property/knowledge">
                <Button className="w-full gap-2">
                  Edit Knowledge Base
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
                Property Analytics
              </CardTitle>
              <CardDescription>
                Deep dive into this property's performance and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/property/analytics">
                <Button variant="secondary" className="w-full gap-2">
                  View Analytics
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent escalations for this property */}
        {openEscalations.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Open Issues at This Property</CardTitle>
                <Link to="/escalations">
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                    View in Escalations <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {openEscalations.slice(0, 3).map((esc) => (
                  <Link
                    key={esc.id}
                    to={`/escalation/${esc.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{esc.summary}</p>
                      <p className="text-xs text-muted-foreground">{esc.guestName} • {esc.unitName}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      esc.priority === 'critical' ? 'bg-critical text-critical-foreground' :
                      esc.priority === 'high' ? 'bg-high text-high-foreground' :
                      'bg-medium text-medium-foreground'
                    }`}>
                      {esc.priority}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default PropertyOverviewPage;
