import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { AppMetadata } from "@/components/seo/AppMetadata";
import React, { useEffect } from "react";

// Page imports
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import { ScanHistory } from "./pages/ScanHistory";
import MedicationManager from "./pages/MedicationManager";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Reminders from "./pages/Reminders";
import Settings from "./pages/Settings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AppInfo from "./pages/AppInfo";
import Sitemap from "./pages/Sitemap";
import Loading from "./pages/Loading";

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
              {/* Global App Metadata for AI Discovery */}
              <AppMetadata />
              
              <Routes>
                <Route path="/loading" element={<Loading />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/app-info" element={<AppInfo />} />
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
