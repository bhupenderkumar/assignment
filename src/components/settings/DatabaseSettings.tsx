import React from 'react';
import MigrationRunner from '../database/MigrationRunner';

const DatabaseSettings: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Database Settings
      </h3>

      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
            Database Migrations
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            If you're experiencing issues with the application, try running the database migrations.
            This will ensure that all required tables and schemas are set up correctly.
          </p>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md mb-6">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Tip: If you see 404 errors in the console, it's likely that some tables are missing.
              Run the migrations to fix this issue.
            </p>
          </div>

          <MigrationRunner />
        </div>
      </div>
    </div>
  );
};

export default DatabaseSettings;
