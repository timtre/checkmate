import { AppShell } from '@/components/layout/AppShell';
import { usePropertyScope } from '@/contexts/PropertyScopeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Building2 } from 'lucide-react';

const KnowledgeBasePage = () => {
  const { selectedProperty, selectProperty, properties } = usePropertyScope();

  // If accessed directly without property selected, prompt to select property
  if (!selectedProperty) {
    return (
      <AppShell>
        <div className="space-y-6 animate-fade-in max-w-md mx-auto py-12">
          <div>
            <h1 className="text-xl font-semibold text-foreground mb-1">Knowledge Base</h1>
            <p className="text-sm text-muted-foreground">
              Select a property to configure
            </p>
          </div>
          
          <div className="space-y-1">
            {properties.map((property) => (
              <button
                key={property.id}
                onClick={() => selectProperty(property)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-muted transition-colors"
              >
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{property.name}</p>
                  <p className="text-xs text-muted-foreground">{property.address}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in max-w-2xl">
        {/* Page header */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">{selectedProperty.name}</p>
          <h1 className="text-xl font-semibold text-foreground">Knowledge Base</h1>
        </div>

        {/* Document upload - minimal */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-3">House Manual</h2>
          <div className="border border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer">
            <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drop PDF or text files here
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Last indexed: Never</p>
        </section>

        {/* Access & Check-in */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-3">Access & Check-in</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="lockType" className="text-xs">Lock Type</Label>
                <Input id="lockType" placeholder="e.g., Keypad" defaultValue="Keypad" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="backupAccess" className="text-xs">Backup Access</Label>
                <Input id="backupAccess" placeholder="e.g., Key under mat" className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkInSteps" className="text-xs">Check-in Steps</Label>
              <Textarea
                id="checkInSteps"
                placeholder="Step-by-step instructions..."
                className="min-h-[100px] text-sm"
                defaultValue="1. Enter the 4-digit code on the keypad
2. Wait for the green light
3. Take the elevator to your floor"
              />
              <p className="text-xs text-muted-foreground">
                💡 Consider adding: Building entrance photo, floor number
              </p>
            </div>
          </div>
        </section>

        {/* Wi-Fi */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-3">Wi-Fi</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="wifiName" className="text-xs">Network Name</Label>
                <Input id="wifiName" defaultValue="Unit2A-Guest" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wifiPassword" className="text-xs">Password</Label>
                <Input id="wifiPassword" defaultValue="welcome2024" className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="routerLocation" className="text-xs">Router Location</Label>
              <Input
                id="routerLocation"
                placeholder="Where is the router?"
                defaultValue="Hallway closet, top shelf"
                className="h-9"
              />
            </div>
          </div>
        </section>

        {/* Escalation settings */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-3">Escalation Settings</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pmPhone" className="text-xs">Your Phone</Label>
                <Input id="pmPhone" type="tel" placeholder="+49..." className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pmEmail" className="text-xs">Your Email</Label>
                <Input id="pmEmail" type="email" placeholder="pm@example.com" className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Quiet Hours</Label>
              <div className="flex items-center gap-2">
                <Input type="time" className="w-24 h-9" defaultValue="22:00" />
                <span className="text-sm text-muted-foreground">to</span>
                <Input type="time" className="w-24 h-9" defaultValue="08:00" />
              </div>
              <p className="text-xs text-muted-foreground">
                Only critical issues trigger notifications during quiet hours
              </p>
            </div>
          </div>
        </section>

        {/* Test */}
        <section>
          <h2 className="text-sm font-medium text-foreground mb-3">Test</h2>
          <Button variant="outline" className="w-full">
            Open Chat Simulator
          </Button>
        </section>

        {/* Save */}
        <div className="pt-4 border-t border-border">
          <Button>Save Changes</Button>
        </div>
      </div>
    </AppShell>
  );
};

export default KnowledgeBasePage;