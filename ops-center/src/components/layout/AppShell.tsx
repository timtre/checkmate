import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      
      {/* Main content area */}
      <div className="ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-16 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search guests, units, tickets..."
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-critical rounded-full" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
