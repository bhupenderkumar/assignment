import './App.css';
import './i18n/config'; // Initialize i18n
import { useEffect } from 'react';
import { InteractiveAssignmentProvider } from './context/InteractiveAssignmentContext';
import { ConfigurationProvider } from './context/ConfigurationContext';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import { DatabaseStateProvider } from './context/DatabaseStateContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { OrganizationJoinRequestProvider } from './context/OrganizationJoinRequestContext';
import { LanguageProvider } from './context/LanguageContext';
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
      console.log('🚀 First Step School App initialized with performance monitoring and security');
    }

    return endTracking;
  }, []);

  return (
    <BrowserRouter>
      <ConfigurationProvider>
        <LanguageProvider>
          <DatabaseStateProvider>
            <SupabaseAuthProvider>
              <OrganizationProvider>
                <OrganizationJoinRequestProvider>
                  <InteractiveAssignmentProvider>
                    <AppRouter />
                  </InteractiveAssignmentProvider>
                </OrganizationJoinRequestProvider>
              </OrganizationProvider>
            </SupabaseAuthProvider>
          </DatabaseStateProvider>
        </LanguageProvider>
      </ConfigurationProvider>
    </BrowserRouter>
  );
}

export default App;
