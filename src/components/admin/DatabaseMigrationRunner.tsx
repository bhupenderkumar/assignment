// src/components/admin/DatabaseMigrationRunner.tsx
import React, { useState } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { runMigrations } from '../../lib/db/runMigrations';
import { runDirectMigration, testUserProgressSchema } from '../../lib/db/directMigration';
import toast from 'react-hot-toast';

const DatabaseMigrationRunner: React.FC = () => {
  const { supabase } = useSupabaseAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleRunMigrations = async () => {
    if (!supabase) {
      toast.error('Database connection not available');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setStatus('Starting migrations...');
    setLogs([]);
    addLog('Starting database migrations...');

    try {
      const success = await runMigrations(
        supabase,
        (progressValue, statusMessage) => {
          setProgress(progressValue);
          setStatus(statusMessage);
          addLog(statusMessage);
        }
      );

      if (success) {
        toast.success('Database migrations completed successfully!');
        addLog('✅ All migrations completed successfully');
      } else {
        toast.error('Database migrations failed');
        addLog('❌ Migrations failed');
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Migration error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      addLog('❌ Migration error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestProgressTable = async () => {
    if (!supabase) {
      toast.error('Database connection not available');
      return;
    }

    setIsRunning(true);
    addLog('Testing user_progress table...');

    try {
      const success = await testUserProgressSchema(supabase);

      if (success) {
        addLog('✅ All user_progress table tests passed');
        toast.success('user_progress table is properly configured');
      } else {
        addLog('❌ user_progress table tests failed - check console for details');
        toast.error('user_progress table needs migration');
      }

    } catch (error) {
      addLog('❌ Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      toast.error('Test failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunDirectMigration = async () => {
    if (!supabase) {
      toast.error('Database connection not available');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setStatus('Running direct migration...');
    addLog('Starting direct migration for user_progress table...');

    try {
      setProgress(25);
      const success = await runDirectMigration(supabase);

      setProgress(75);
      if (success) {
        addLog('✅ Direct migration completed - check console for SQL commands if needed');
        toast.success('Migration completed - check console for any manual SQL commands needed');
        setProgress(100);
      } else {
        addLog('❌ Direct migration failed - check console for details');
        toast.error('Migration failed - check console for SQL commands to run manually');
      }

    } catch (error) {
      addLog('❌ Migration failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      toast.error('Migration failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Database Migration Runner</h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleRunMigrations}
            disabled={isRunning}
            className={`px-4 py-2 rounded font-medium ${
              isRunning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isRunning ? 'Running...' : 'Run Full Migrations'}
          </button>

          <button
            onClick={handleRunDirectMigration}
            disabled={isRunning}
            className="px-4 py-2 rounded font-medium bg-purple-500 text-white hover:bg-purple-600 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isRunning ? 'Running...' : 'Fix Progress Table'}
          </button>

          <button
            onClick={handleTestProgressTable}
            disabled={isRunning}
            className="px-4 py-2 rounded font-medium bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isRunning ? 'Testing...' : 'Test Progress Table'}
          </button>
        </div>

        {isRunning && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{status}</p>
          </div>
        )}

        {logs.length > 0 && (
          <div className="bg-gray-100 rounded p-3 max-h-40 overflow-y-auto">
            <h4 className="text-sm font-medium mb-2">Migration Logs:</h4>
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-xs font-mono text-gray-700">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseMigrationRunner;
