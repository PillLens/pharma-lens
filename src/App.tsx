import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import { ScanHistory } from "./pages/ScanHistory";
import MedicationManager from "./pages/MedicationManager";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Reminders from "./pages/Reminders";
import { SecurityDashboard } from "@/components/SecurityDashboard";
import FamilyManager from "./pages/FamilyManager";
import Settings from "./pages/Settings";
import { performanceMonitoringService } from "@/services/performanceMonitoringService";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Track app startup performance
    performanceMonitoringService.trackPageLoad('app_init');
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SubscriptionProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/scanner" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/history" element={
                  <ProtectedRoute>
                    <ScanHistory />
                  </ProtectedRoute>
                } />
                <Route path="/medications" element={
                  <ProtectedRoute>
                    <MedicationManager />
                  </ProtectedRoute>
                } />
                <Route path="/security" element={
                  <ProtectedRoute>
                    <SecurityDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/family" element={
                  <ProtectedRoute>
                    <FamilyManager />
                  </ProtectedRoute>
                } />
                <Route path="/reminders" element={
                  <ProtectedRoute>
                    <Reminders />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </TooltipProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
