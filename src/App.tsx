import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Workers from "./pages/Workers";
import Attendance from "./pages/Attendance";

import Payouts from "./pages/Payouts";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import { Layout } from "./components/layout/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Public route wrapper (redirect to dashboard if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/auth" element={
        <PublicRoute>
          <Auth />
        </PublicRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/jobs" element={
        <ProtectedRoute>
          <Layout>
            <Jobs />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/jobs/:jobId" element={
        <ProtectedRoute>
          <Layout>
            <JobDetail />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/workers" element={
        <ProtectedRoute>
          <Layout>
            <Workers />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/attendance" element={
        <ProtectedRoute>
          <Layout>
            <Attendance />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/payouts" element={
        <ProtectedRoute>
          <Layout>
            <Payouts />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <Layout>
            <Reports />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
