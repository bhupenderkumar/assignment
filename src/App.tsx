import './App.css';
import { Toaster } from 'react-hot-toast';
import { InteractiveAssignmentProvider } from './context/InteractiveAssignmentContext';
import { ConfigurationProvider } from './context/ConfigurationContext';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import { DatabaseStateProvider } from './context/DatabaseStateContext';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './components/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <ConfigurationProvider>
        <DatabaseStateProvider>
          <SupabaseAuthProvider>
            <InteractiveAssignmentProvider>
              <AppRouter />
              <Toaster position="top-right" />
            </InteractiveAssignmentProvider>
          </SupabaseAuthProvider>
        </DatabaseStateProvider>
      </ConfigurationProvider>
    </BrowserRouter>
  );
}

export default App;
