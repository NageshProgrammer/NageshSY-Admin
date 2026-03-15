import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import { initGoogleAnalytics, trackPageView } from "@/lib/gtag";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import AdminManagement from "./pages/AdminManagement";
import GeoAnalytics from "./pages/GeoAnalytics";
import Transactions from "./pages/Transactions";
import Events from "./pages/Events";
import AnalyticsReports from "./pages/AnalyticsReports";
import SupportTickets from "./pages/SupportTickets";
import LogsSecurity from "./pages/LogsSecurity";
import GoogleAnalytics from "./pages/GoogleAnalytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function GoogleAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    initGoogleAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}${location.hash}`);
  }, [location.pathname, location.search, location.hash]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GoogleAnalyticsTracker />
        <Toaster />
        <Sonner />

        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminManagement />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/geo"
            element={
              <ProtectedRoute>
                <Layout>
                  <GeoAnalytics />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Layout>
                  <Transactions />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Layout>
                  <Events />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <AnalyticsReports />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Layout>
                  <SupportTickets />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/security"
            element={
              <ProtectedRoute>
                <Layout>
                  <LogsSecurity />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/google-analytics"
            element={
              <ProtectedRoute>
                <Layout>
                  <GoogleAnalytics />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
