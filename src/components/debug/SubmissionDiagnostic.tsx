// src/components/debug/SubmissionDiagnostic.tsx
import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { ensureUuidFormat } from '../../lib/utils/userIdMapping';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

const SubmissionDiagnostic: React.FC = () => {
  const { user, supabase, userId } = useSupabaseAuth();
  const { fetchUserSubmissions } = useInteractiveAssignment();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Step 1: Check user authentication
      addResult({
        step: 'User Authentication',
        status: user ? 'success' : 'error',
        message: user ? `Authenticated as ${user.email}` : 'No user authenticated',
        data: { userId: user?.id, email: user?.email }
      });

      if (!user || !supabase) {
        addResult({
          step: 'Prerequisites',
          status: 'error',
          message: 'Missing user or Supabase client'
        });
        return;
      }

      // Step 2: Check UUID mapping
      let mappedUserId;
      try {
        mappedUserId = ensureUuidFormat(user.id);
        addResult({
          step: 'UUID Mapping',
          status: 'success',
          message: `Original: ${user.id} → Mapped: ${mappedUserId}`,
          data: { original: user.id, mapped: mappedUserId }
        });
      } catch (error) {
        addResult({
          step: 'UUID Mapping',
          status: 'error',
          message: `Failed to map user ID: ${error}`,
          data: { error }
        });
        return;
      }

      // Step 3: Direct database query for submissions
      try {
        const { data: directSubmissions, error: directError } = await supabase
          .from('interactive_submission')
          .select(`
            id,
            assignment_id,
            user_id,
            status,
            score,
            started_at,
            submitted_at,
            interactive_assignment(title, category)
          `)
          .eq('user_id', mappedUserId)
          .order('started_at', { ascending: false });

        if (directError) {
          addResult({
            step: 'Direct Database Query',
            status: 'error',
            message: `Database error: ${directError.message}`,
            data: { error: directError }
          });
        } else {
          addResult({
            step: 'Direct Database Query',
            status: 'success',
            message: `Found ${directSubmissions?.length || 0} submissions`,
            data: directSubmissions
          });
        }
      } catch (error) {
        addResult({
          step: 'Direct Database Query',
          status: 'error',
          message: `Query failed: ${error}`,
          data: { error }
        });
      }

      // Step 4: Check submissions with SUBMITTED status only
      try {
        const { data: submittedOnly, error: submittedError } = await supabase
          .from('interactive_submission')
          .select(`
            id,
            assignment_id,
            user_id,
            status,
            score,
            started_at,
            submitted_at,
            interactive_assignment(title, category)
          `)
          .eq('user_id', mappedUserId)
          .eq('status', 'SUBMITTED')
          .order('submitted_at', { ascending: false });

        if (submittedError) {
          addResult({
            step: 'SUBMITTED Status Query',
            status: 'error',
            message: `Error: ${submittedError.message}`,
            data: { error: submittedError }
          });
        } else {
          addResult({
            step: 'SUBMITTED Status Query',
            status: submittedOnly?.length ? 'success' : 'warning',
            message: `Found ${submittedOnly?.length || 0} completed submissions`,
            data: submittedOnly
          });
        }
      } catch (error) {
        addResult({
          step: 'SUBMITTED Status Query',
          status: 'error',
          message: `Query failed: ${error}`,
          data: { error }
        });
      }

      // Step 5: Test service method
      try {
        const serviceSubmissions = await fetchUserSubmissions(user.id);
        addResult({
          step: 'Service Method Test',
          status: 'success',
          message: `Service returned ${serviceSubmissions?.length || 0} submissions`,
          data: serviceSubmissions
        });
      } catch (error) {
        addResult({
          step: 'Service Method Test',
          status: 'error',
          message: `Service failed: ${error}`,
          data: { error }
        });
      }

      // Step 6: Check for recent submissions (last 24 hours)
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { data: recentSubmissions, error: recentError } = await supabase
          .from('interactive_submission')
          .select(`
            id,
            assignment_id,
            user_id,
            status,
            score,
            started_at,
            submitted_at,
            interactive_assignment(title)
          `)
          .eq('user_id', mappedUserId)
          .gte('started_at', yesterday.toISOString())
          .order('started_at', { ascending: false });

        if (recentError) {
          addResult({
            step: 'Recent Submissions',
            status: 'error',
            message: `Error: ${recentError.message}`
          });
        } else {
          addResult({
            step: 'Recent Submissions',
            status: recentSubmissions?.length ? 'success' : 'warning',
            message: `Found ${recentSubmissions?.length || 0} submissions in last 24 hours`,
            data: recentSubmissions
          });
        }
      } catch (error) {
        addResult({
          step: 'Recent Submissions',
          status: 'error',
          message: `Query failed: ${error}`
        });
      }

    } catch (error) {
      addResult({
        step: 'General Error',
        status: 'error',
        message: `Diagnostic failed: ${error}`
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed top-4 left-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-2xl z-50 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Submission Diagnostic</h3>
        <button
          onClick={runDiagnostic}
          disabled={isRunning}
          className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Run Diagnostic'}
        </button>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <div key={index} className="border-l-4 border-gray-200 pl-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStatusIcon(result.status)}</span>
              <span className="font-medium text-gray-800">{result.step}</span>
            </div>
            <p className={`text-sm ${getStatusColor(result.status)} mt-1`}>
              {result.message}
            </p>
            {result.data && (
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer">View Data</summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !isRunning && (
        <p className="text-gray-500 text-center py-4">
          Click "Run Diagnostic" to check your submission status
        </p>
      )}
    </div>
  );
};

export default SubmissionDiagnostic;
