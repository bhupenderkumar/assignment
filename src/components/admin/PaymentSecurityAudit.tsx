import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface SecurityAuditLog {
  id: string;
  user_id: string;
  assignment_id: string;
  transaction_hash: string;
  verification_result: any;
  security_checks: any;
  is_fraud_attempt: boolean;
  fraud_reason: string;
  attempt_timestamp: string;
  created_at: string;
}

const PaymentSecurityAudit: React.FC = () => {
  const { supabase } = useSupabaseAuth();
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'fraud' | 'success'>('all');

  useEffect(() => {
    loadAuditLogs();
  }, [filter]);

  const loadAuditLogs = async () => {
    if (!supabase) return;

    setLoading(true);
    try {
      let query = supabase
        .from('payment_security_audit')
        .select('*')
        .order('attempt_timestamp', { ascending: false })
        .limit(100);

      if (filter === 'fraud') {
        query = query.eq('is_fraud_attempt', true);
      } else if (filter === 'success') {
        query = query.eq('is_fraud_attempt', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load security audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (isFraud: boolean, verificationResult: any) => {
    if (isFraud) return 'text-red-600 bg-red-100';
    if (verificationResult?.verified) return 'text-green-600 bg-green-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getStatusText = (isFraud: boolean, verificationResult: any) => {
    if (isFraud) return 'FRAUD';
    if (verificationResult?.verified) return 'SUCCESS';
    return 'FAILED';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Security Audit
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Monitor all payment verification attempts and fraud detection
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'all', label: 'All Attempts', count: auditLogs.length },
            { key: 'fraud', label: 'Fraud Attempts', count: auditLogs.filter(log => log.is_fraud_attempt).length },
            { key: 'success', label: 'Successful', count: auditLogs.filter(log => !log.is_fraud_attempt && log.verification_result?.verified).length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="space-y-4">
        {auditLogs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(log.is_fraud_attempt, log.verification_result)}`}>
                  {getStatusText(log.is_fraud_attempt, log.verification_result)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatTimestamp(log.attempt_timestamp)}
                </span>
              </div>
              {log.is_fraud_attempt && (
                <div className="flex items-center space-x-1 text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-xs font-medium">FRAUD ALERT</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">User ID</label>
                <p className="text-sm font-mono text-gray-900 dark:text-white truncate">{log.user_id || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Assignment ID</label>
                <p className="text-sm font-mono text-gray-900 dark:text-white truncate">{log.assignment_id || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Transaction Hash</label>
                <p className="text-sm font-mono text-gray-900 dark:text-white truncate">{log.transaction_hash}</p>
              </div>
            </div>

            {log.fraud_reason && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <label className="text-xs font-medium text-red-700 dark:text-red-300">Fraud Reason</label>
                <p className="text-sm text-red-800 dark:text-red-200">{log.fraud_reason}</p>
              </div>
            )}

            {log.verification_result?.details?.reason && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Verification Result</label>
                <p className="text-sm text-gray-800 dark:text-gray-200">{log.verification_result.details.reason}</p>
              </div>
            )}

            {log.security_checks && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(log.security_checks).map(([check, passed]) => (
                  <div key={check} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${passed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {check.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}

        {auditLogs.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No audit logs found for the selected filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSecurityAudit;
