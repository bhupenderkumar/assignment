// src/components/AppRouter.tsx

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import SharedAssignmentPage from './pages/SharedAssignmentPage';
import PlayAssignmentPage from './pages/PlayAssignmentPage';
import AdminDashboard from './admin/AdminDashboard';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import UserDashboardPage from './pages/UserDashboardPage';
import DashboardPage from './pages/DashboardPage';
import AssignmentGalleryPage from './pages/AssignmentGalleryPage';
import PaymentDemoPage from './pages/PaymentDemoPage';
import OrganizationManagementPage from '../pages/OrganizationManagementPage';
import OrganizationSettingsPage from '../pages/OrganizationSettingsPage';
import OrganizationRequestsPage from '../pages/OrganizationRequestsPage';
import JoinOrganizationPage from '../pages/JoinOrganizationPage';
import SettingsPage from '../pages/settings';
import HelpCenter from './pages/HelpCenter';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import StandaloneCertificatePage from '../pages/StandaloneCertificatePage';
import CertificatesPage from '../pages/CertificatesPage';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { InteractiveAssignmentProvider } from '../context/InteractiveAssignmentContext';
import { OrganizationProvider } from '../context/OrganizationContext';
import toast from 'react-hot-toast';

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
      <Route path="/play/share/:shareableLink" element={<Layout hideNavigation><SharedAssignmentPage /></Layout>} />
      <Route path="/play/assignment/:assignmentId" element={<Layout><PlayAssignmentPage /></Layout>} />
      <Route path="/gallery" element={
        <Layout>
          <InteractiveAssignmentProvider>
            <OrganizationProvider>
              <AssignmentGalleryPage />
            </OrganizationProvider>
          </InteractiveAssignmentProvider>
        </Layout>
      } />
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
                <OrganizationProvider>
                  <DashboardPage />
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
                <UserDashboardPage certificatesMode={true} showJoinRequests={false} />
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

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
