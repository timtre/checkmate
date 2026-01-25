import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PropertyScopeProvider } from "@/contexts/PropertyScopeContext";
import Index from "./pages/Index";
import InboxPage from "./pages/InboxPage";
import EscalationDetailPage from "./pages/EscalationDetailPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import PropertyOverviewPage from "./pages/PropertyOverviewPage";
import PropertyAnalyticsPage from "./pages/PropertyAnalyticsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PropertyScopeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Portfolio scope routes */}
            <Route path="/" element={<Index />} />
            <Route path="/escalations" element={<InboxPage />} />
            <Route path="/escalation/:id" element={<EscalationDetailPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            
            {/* Property scope routes */}
            <Route path="/property" element={<PropertyOverviewPage />} />
            <Route path="/property/knowledge" element={<KnowledgeBasePage />} />
            <Route path="/property/analytics" element={<PropertyAnalyticsPage />} />
            
            {/* Legacy route redirect */}
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/knowledge" element={<KnowledgeBasePage />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PropertyScopeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
