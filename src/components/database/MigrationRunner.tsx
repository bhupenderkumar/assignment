// src/components/database/MigrationRunner.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { runDirectMigrations } from '../../lib/db/directMigrations';
import toast from 'react-hot-toast';

const MigrationRunner: React.FC = () => {
  const { supabase } = useSupabaseAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const runMigrations = async () => {
    if (!supabase || isRunning) return;

    setIsRunning(true);
    setError(null);
    setProgress(0);
    setStatus('Preparing to run migrations');

    try {
      const success = await runDirectMigrations(supabase, (progress, status) => {
        setProgress(progress);
        setStatus(status);
      });

      if (success) {
        toast.success('Migrations completed successfully');
      } else {
        setError('Failed to run migrations');
        toast.error('Failed to run migrations');
      }
    } catch (err) {
      console.error('Error running migrations:', err);
      setError('Error running migrations: ' + (err instanceof Error ? err.message : String(err)));
      toast.error('Error running migrations');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Database Migrations
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Run database migrations to set up the required tables and schemas.
      </p>

      {isRunning ? (
        <div className="space-y-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <motion.div
              className="bg-blue-600 h-2.5 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {status} ({Math.round(progress)}%)
          </p>
        </div>
      ) : (
        <button
          onClick={runMigrations}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Run Migrations
        </button>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
};

export default MigrationRunner;
