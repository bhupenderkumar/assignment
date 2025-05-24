import './App.css';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { InteractiveAssignmentProvider } from './context/InteractiveAssignmentContext';
import { ConfigurationProvider } from './context/ConfigurationContext';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import { DatabaseStateProvider } from './context/DatabaseStateContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { OrganizationJoinRequestProvider } from './context/OrganizationJoinRequestContext';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './components/AppRouter';
import { performanceMonitor } from './lib/services/performanceMonitoringService';
import { initializeSecurity, performSecurityChecks } from './lib/config/securityConfig';

function App() {
  // Initialize performance monitoring and security
  useEffect(() => {
    const endTracking = performanceMonitor.trackComponentRender('App');

    // SECURITY: Initialize security configuration on app start
    try {
      initializeSecurity();

      // Perform runtime security checks
      const securityCheck = performSecurityChecks();
      if (!securityCheck.passed) {
        console.warn('⚠️ Security issues detected:', securityCheck.issues);
      }
    } catch (error) {
      console.error('❌ Failed to initialize security:', error);
    }

    // Log app initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Interactive Assignments App initialized with performance monitoring and security');
    }

    return endTracking;
  }, []);

  return (
    <BrowserRouter>
      <ConfigurationProvider>
        <DatabaseStateProvider>
          <SupabaseAuthProvider>
            <OrganizationProvider>
              <OrganizationJoinRequestProvider>
                <InteractiveAssignmentProvider>
                  <AppRouter />
                  <Toaster
                    position="bottom-right"
                    toastOptions={{
                    success: {
                      style: {
                        background: '#10B981',
                        color: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      },
                    },
                    error: {
                      style: {
                        background: '#EF4444',
                        color: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      },
                    },
                    loading: {
                      style: {
                        background: '#3B82F6',
                        color: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      },
                    },
                    duration: 4000,
                  }}
                  />
                </InteractiveAssignmentProvider>
              </OrganizationJoinRequestProvider>
            </OrganizationProvider>
          </SupabaseAuthProvider>
        </DatabaseStateProvider>
      </ConfigurationProvider>
    </BrowserRouter>
  );
}

export default App;
