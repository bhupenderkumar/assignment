// src/components/AppRouter.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './layout/Layout';
import SharedAssignmentPage from './pages/SharedAssignmentPage';
import PlayAssignmentPage from './pages/PlayAssignmentPage';
import AdminDashboard from './admin/AdminDashboard';
import HomePage from './pages/HomePage';
import UserDashboardPage from './pages/UserDashboardPage';
import HelpCenter from './pages/HelpCenter';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import StandaloneCertificatePage from '../pages/StandaloneCertificatePage';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { InteractiveAssignmentProvider } from '../context/InteractiveAssignmentContext';
import toast from 'react-hot-toast';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    toast.error('Please sign in to access this page');
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
};

const AppRouter = () => {
  const location = useLocation();
  const { isAuthenticated } = useSupabaseAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/play/share/:shareableLink" element={<Layout hideNavigation><SharedAssignmentPage /></Layout>} />
      <Route path="/play/assignment/:assignmentId" element={<Layout hideNavigation><PlayAssignmentPage /></Layout>} />
      <Route path="/help" element={<Layout><HelpCenter /></Layout>} />
      <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
      <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />

      {/* Auth routes */}
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

      {/* Standalone certificate page - no layout */}
      <Route path="/certificate" element={<StandaloneCertificatePage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <InteractiveAssignmentProvider>
                <UserDashboardPage />
              </InteractiveAssignmentProvider>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/manage-assignments"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Edit assignment route */}
      <Route
        path="/edit-assignment/:assignmentId"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
