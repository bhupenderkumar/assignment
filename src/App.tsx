import './App.css';
import { Toaster } from 'react-hot-toast';
import { InteractiveAssignmentProvider } from './context/InteractiveAssignmentContext';
import { ConfigurationProvider } from './context/ConfigurationContext';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import { DatabaseStateProvider } from './context/DatabaseStateContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './components/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <ConfigurationProvider>
        <DatabaseStateProvider>
          <SupabaseAuthProvider>
            <OrganizationProvider>
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
            </OrganizationProvider>
          </SupabaseAuthProvider>
        </DatabaseStateProvider>
      </ConfigurationProvider>
    </BrowserRouter>
  );
}

export default App;
