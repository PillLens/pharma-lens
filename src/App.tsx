import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, ScrollRestoration } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import { FirstLaunchLocationSetup } from '@/components/location/FirstLaunchLocationSetup';
import { SecurityDashboard } from "@/components/SecurityDashboard";
import { performanceMonitoringService } from "@/services/performanceMonitoringService";
import { unifiedNotificationManager } from "@/services/unifiedNotificationManager";
import { StructuredData } from "@/components/seo/StructuredData";
import { GoogleSearchConsole } from "@/components/seo/GoogleSearchConsole";
import React, { useEffect } from "react";

// Page imports
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import { ScanHistory } from "./pages/ScanHistory";
import MedicationManager from "./pages/MedicationManager";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Reminders from "./pages/Reminders";
import FamilyManager from "./pages/FamilyManager";
import Settings from "./pages/Settings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Sitemap from "./pages/Sitemap";

const queryClient = new QueryClient();

const App = () => {
  React.useEffect(() => {
    // Track app startup performance
    performanceMonitoringService.trackPageLoad('app_init');
    
    // Initialize notification manager
    unifiedNotificationManager.initialize().catch(console.error);
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
              {/* Global SEO Components */}
              <GoogleSearchConsole />
              <StructuredData type="organization" />
              <StructuredData type="webapp" />
              
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/sitemap.xml" element={<Sitemap />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Index />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/history" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ScanHistory />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/medications" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MedicationManager />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/security" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SecurityDashboard />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/family" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <FamilyManager />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/reminders" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Reminders />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Settings />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <ScrollRestoration />
              <FirstLaunchLocationSetup />
            </BrowserRouter>
            </TooltipProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
