// src/components/AppRouter.tsx

import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import HelpCenter from './pages/HelpCenter';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { InteractiveAssignmentProvider } from '../context/InteractiveAssignmentContext';
import { OrganizationProvider } from '../context/OrganizationContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// Lazy load heavy components for better performance
const SharedAssignmentPage = React.lazy(() => import('./pages/SharedAssignmentPage'));
const PlayAssignmentPage = React.lazy(() => import('./pages/PlayAssignmentPage'));
const AdminDashboard = React.lazy(() => import('./admin/AdminDashboard'));
const UserDashboardPage = React.lazy(() => import('./pages/UserDashboardPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const AssignmentGalleryPage = React.lazy(() => import('./pages/AssignmentGalleryPage'));
const PaymentDemoPage = React.lazy(() => import('./pages/PaymentDemoPage'));
const OrganizationManagementPage = React.lazy(() => import('../pages/OrganizationManagementPage'));
const OrganizationSettingsPage = React.lazy(() => import('../pages/OrganizationSettingsPage'));
const AnonymousUserActivity = React.lazy(() => import('./admin/AnonymousUserActivity'));
const OrganizationRequestsPage = React.lazy(() => import('../pages/OrganizationRequestsPage'));
const JoinOrganizationPage = React.lazy(() => import('../pages/JoinOrganizationPage'));
const SettingsPage = React.lazy(() => import('../pages/settings'));
const SignInPage = React.lazy(() => import('./pages/SignInPage'));
const SignUpPage = React.lazy(() => import('./pages/SignUpPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const StandaloneCertificatePage = React.lazy(() => import('../pages/StandaloneCertificatePage'));
const CertificatesPage = React.lazy(() => import('../pages/CertificatesPage'));
const AudioDebugPage = React.lazy(() => import('./debug/AudioDebugPage'));

// Loading component for lazy-loaded routes
const RouteLoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center min-h-screen"
  >
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-gray-600 text-center">{message}</p>
  </motion.div>
);

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useSupabaseAuth();


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

// Route that redirects authenticated users to dashboard and shows landing page for non-authenticated users
const LandingRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Always redirect authenticated users to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Only show landing page to non-authenticated users
  return <>{children}</>;
};

const AppRouter = () => {
  return (
    <Routes>
      {/* Public routes - Landing page redirects to dashboard if authenticated */}
      <Route path="/" element={<LandingRoute><Layout><LandingPage /></Layout></LandingRoute>} />
      <Route path="/home" element={<Layout><HomePage /></Layout>} />
      <Route path="/play/share/:shareableLink" element={
        <Layout hideNavigation>
          <Suspense fallback={<RouteLoadingSpinner message="Loading assignment..." />}>
            <SharedAssignmentPage />
          </Suspense>
        </Layout>
      } />
      <Route path="/play/assignment/:assignmentId" element={
        <Layout>
          <Suspense fallback={<RouteLoadingSpinner message="Loading assignment..." />}>
            <PlayAssignmentPage />
          </Suspense>
        </Layout>
      } />
      <Route path="/gallery" element={
        <Layout>
          <InteractiveAssignmentProvider>
            <OrganizationProvider>
              <Suspense fallback={<RouteLoadingSpinner message="Loading gallery..." />}>
                <AssignmentGalleryPage />
              </Suspense>
            </OrganizationProvider>
          </InteractiveAssignmentProvider>
        </Layout>
      } />
      <Route path="/help" element={<Layout><HelpCenter /></Layout>} />
      <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
      <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />

      {/* Auth routes */}
      <Route path="/sign-in/*" element={
        <Suspense fallback={<RouteLoadingSpinner message="Loading sign in..." />}>
          <SignInPage />
        </Suspense>
      } />
      <Route path="/sign-up/*" element={
        <Suspense fallback={<RouteLoadingSpinner message="Loading sign up..." />}>
          <SignUpPage />
        </Suspense>
      } />
      <Route path="/forgot-password" element={
        <Suspense fallback={<RouteLoadingSpinner message="Loading..." />}>
          <ForgotPasswordPage />
        </Suspense>
      } />
      <Route path="/reset-password" element={
        <Suspense fallback={<RouteLoadingSpinner message="Loading..." />}>
          <ResetPasswordPage />
        </Suspense>
      } />

      {/* Standalone certificate page - no layout */}
      <Route path="/certificate" element={
        <Suspense fallback={<RouteLoadingSpinner message="Loading certificate..." />}>
          <StandaloneCertificatePage />
        </Suspense>
      } />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <InteractiveAssignmentProvider>
                <OrganizationProvider>
                  <Suspense fallback={<RouteLoadingSpinner message="Loading dashboard..." />}>
                    <DashboardPage />
                  </Suspense>
                </OrganizationProvider>
              </InteractiveAssignmentProvider>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* UserDashboardPage accessible at /user-dashboard - used for certificates */}
      <Route
        path="/user-dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <InteractiveAssignmentProvider>
                <Suspense fallback={<RouteLoadingSpinner message="Loading user dashboard..." />}>
                  <UserDashboardPage certificatesMode={true} showJoinRequests={false} />
                </Suspense>
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
              <Suspense fallback={<RouteLoadingSpinner message="Loading admin dashboard..." />}>
                <AdminDashboard />
              </Suspense>
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

      {/* Organization routes */}
      <Route
        path="/organizations"
        element={
          <ProtectedRoute>
            <Layout>
              <OrganizationProvider>
                <OrganizationManagementPage />
              </OrganizationProvider>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizations/:organizationId"
        element={
          <ProtectedRoute>
            <Layout>
              <OrganizationProvider>
                <OrganizationManagementPage />
              </OrganizationProvider>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Organization invitation route */}
      <Route
        path="/join-organization"
        element={
          <JoinOrganizationPage />
        }
      />

      {/* British spelling redirect for organization */}
      <Route
        path="/organisation"
        element={<Navigate to="/organizations" replace />}
      />

      {/* British spelling redirect for organization with ID */}
      <Route
        path="/organisation/:organizationId"
        element={
          <Navigate
            to={`/organizations/${window.location.pathname.split('/').pop()}`}
            replace
          />
        }
      />

      {/* Organization settings route */}
      <Route
        path="/organization-settings"
        element={
          <ProtectedRoute>
            <Layout>
              <OrganizationProvider>
                <OrganizationSettingsPage />
              </OrganizationProvider>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Organization requests route */}
      <Route
        path="/organization-requests"
        element={
          <ProtectedRoute>
            <Layout>
              <OrganizationProvider>
                <OrganizationRequestsPage />
              </OrganizationProvider>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Settings route */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Certificates route */}
      <Route
        path="/certificates"
        element={
          <ProtectedRoute>
            <Layout>
              <InteractiveAssignmentProvider>
                <CertificatesPage />
              </InteractiveAssignmentProvider>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Payment Demo route */}
      <Route
        path="/payment-demo"
        element={
          <ProtectedRoute>
            <Layout>
              <PaymentDemoPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Debug routes - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <Route
          path="/debug/audio"
          element={
            <Layout>
              <Suspense fallback={<RouteLoadingSpinner message="Loading debug page..." />}>
                <AudioDebugPage />
              </Suspense>
            </Layout>
          }
        />
      )}

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
      {/* Anonymous User Activity route */}
      <Route
        path="/anonymous-users"
        element={
          <ProtectedRoute>
            <Layout>
              <OrganizationProvider>
                <AnonymousUserActivity />
              </OrganizationProvider>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRouter;
