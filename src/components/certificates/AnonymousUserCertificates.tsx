// src/components/certificates/AnonymousUserCertificates.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import CertificateViewer from './CertificateViewer';
import toast from 'react-hot-toast';

interface CertificateRecord {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  organizationId?: string;
  organizationName?: string;
  score: number;
  completedAt: string;
  status: string;
}

interface AnonymousUserCertificatesProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnonymousUserCertificates: React.FC<AnonymousUserCertificatesProps> = ({
  isOpen,
  onClose
}) => {
  const { anonymousUser } = useInteractiveAssignment();
  const { supabase } = useSupabaseAuth();
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const [showCertificateViewer, setShowCertificateViewer] = useState(false);

  // Fetch user's certificates
  useEffect(() => {
    if (isOpen && anonymousUser && supabase) {
      fetchCertificates();
    }
  }, [isOpen, anonymousUser, supabase]);

  const fetchCertificates = async () => {
    if (!anonymousUser || !supabase) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interactive_submission')
        .select(`
          id,
          assignment_id,
          score,
          submitted_at,
          status,
          interactive_assignment!inner(
            title,
            organization_id,
            organization(name)
          )
        `)
        .eq('user_id', anonymousUser.id)
        .eq('status', 'SUBMITTED')
        .not('score', 'is', null)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching certificates:', error);
        toast.error('Failed to load certificates');
        return;
      }

      const formattedCertificates: CertificateRecord[] = data.map((submission: any) => ({
        submissionId: submission.id,
        assignmentId: submission.assignment_id,
        assignmentTitle: submission.interactive_assignment.title,
        organizationId: submission.interactive_assignment.organization_id,
        organizationName: submission.interactive_assignment.organization?.name,
        score: submission.score,
        completedAt: new Date(submission.submitted_at).toLocaleDateString(),
        status: submission.status
      }));

      setCertificates(formattedCertificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const viewCertificate = (certificate: CertificateRecord) => {
    const submissionForCertificate = {
      id: certificate.submissionId,
      userId: anonymousUser?.id || '',
      score: certificate.score,
      submittedAt: new Date(),
      status: 'SUBMITTED' as const
    };

    setSelectedCertificate({
      submission: submissionForCertificate,
      assignmentTitle: certificate.assignmentTitle,
      assignmentOrganizationId: certificate.organizationId,
      username: anonymousUser?.name  // Pass the username directly
    });
    setShowCertificateViewer(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">My Certificates</h2>
              <p className="text-gray-600 mt-1">
                Welcome back, {anonymousUser?.name}! Here are your earned certificates.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading certificates...</span>
              </div>
            ) : certificates.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificates Yet</h3>
                <p className="text-gray-600">
                  Complete some quizzes to earn your first certificate!
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {certificates.map((certificate) => (
                  <motion.div
                    key={certificate.submissionId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {certificate.assignmentTitle}
                        </h3>

                        {certificate.organizationName && (
                          <p className="text-sm text-blue-600 mb-2">
                            📚 {certificate.organizationName}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>📅 Completed: {certificate.completedAt}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(certificate.score)}`}>
                            🏆 {certificate.score}%
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => viewCertificate(certificate)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
              </p>
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>

        {/* Certificate Viewer Modal */}
        {showCertificateViewer && selectedCertificate && (
          <CertificateViewer
            submission={selectedCertificate.submission}
            onClose={() => {
              setShowCertificateViewer(false);
              setSelectedCertificate(null);
            }}
            assignmentTitle={selectedCertificate.assignmentTitle}
            assignmentOrganizationId={selectedCertificate.assignmentOrganizationId}
            username={selectedCertificate.username}
          />
        )}
      </div>
    </AnimatePresence>
  );
};

export default AnonymousUserCertificates;
