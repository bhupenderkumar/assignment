// src/pages/CertificatesPage.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInteractiveAssignment } from '../context/InteractiveAssignmentContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useConfiguration } from '../context/ConfigurationContext';
import { InteractiveSubmissionExtended } from '../types/interactiveSubmissionExtended';
import CertificateViewer from '../components/certificates/CertificateViewer';
import toast from 'react-hot-toast';

const CertificatesPage = () => {
  const [certificates, setCertificates] = useState<InteractiveSubmissionExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<InteractiveSubmissionExtended | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const { isAuthenticated, userId, username } = useSupabaseAuth();
  const { fetchUserSubmissions } = useInteractiveAssignment();
  const { config } = useConfiguration();
  const navigate = useNavigate();
  
  // For debugging and state recovery
  const submissionsRef = useRef<any[]>([]);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Process submissions data to ensure consistent format
  const processSubmissions = (submissions: any[]): InteractiveSubmissionExtended[] => {
    if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
      return [];
    }

    return submissions.map((submission: any) => {
      // Create a new object with camelCase properties
      const processedSubmission: any = {
        id: submission.id,
        // Convert snake_case to camelCase
        assignmentId: submission.assignmentId || submission.assignment_id,
        userId: submission.userId || submission.user_id,
        status: submission.status,
        score: submission.score !== null && submission.score !== undefined ? submission.score : 0,
        feedback: submission.feedback,
      };

      // Handle dates
      if (submission.startedAt) {
        processedSubmission.startedAt = typeof submission.startedAt === 'string'
          ? new Date(submission.startedAt)
          : submission.startedAt;
      } else if (submission.started_at) {
        processedSubmission.startedAt = new Date(submission.started_at);
      } else {
        processedSubmission.startedAt = new Date();
      }

      if (submission.submittedAt) {
        processedSubmission.submittedAt = typeof submission.submittedAt === 'string'
          ? new Date(submission.submittedAt)
          : submission.submittedAt;
      } else if (submission.submitted_at) {
        processedSubmission.submittedAt = new Date(submission.submitted_at);
      } else {
        processedSubmission.submittedAt = new Date();
      }

      // Extract assignment title from nested object if needed
      if (submission.assignmentTitle) {
        processedSubmission.assignmentTitle = submission.assignmentTitle;
      } else if (submission.interactive_assignment && submission.interactive_assignment.title) {
        processedSubmission.assignmentTitle = submission.interactive_assignment.title;
        processedSubmission.interactive_assignment = submission.interactive_assignment;
      } else {
        processedSubmission.assignmentTitle = 'Unknown Assignment';
      }

      return processedSubmission;
    });
  };

  // Load user data only once on mount or when auth state changes
  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated && !userId) {
        toast.error('Please sign in to view your certificates');
        navigate('/sign-in');
        return;
      }

      try {
        // Set loading state
        setLoading(true);
        console.log('CertificatesPage: Loading user submissions for userId:', userId);

        // Fetch submissions
        const submissions = await fetchUserSubmissions();
        
        // Store submissions in ref for backup/recovery
        submissionsRef.current = submissions;

        // Process and update state with the submissions
        if (isMounted.current && submissions && Array.isArray(submissions)) {
          const processedSubmissions = processSubmissions(submissions);

          if (processedSubmissions.length > 0) {
            console.log(`Setting ${processedSubmissions.length} processed submissions to state`);
            setCertificates(processedSubmissions);
          } else if (submissions.length > 0) {
            // Fallback: use raw submissions if processing failed
            console.log(`Using ${submissions.length} raw submissions as fallback`);
            setCertificates(submissions as any);
          } else {
            console.log('No submissions found');
            // Ensure we clear any previous activities if none are found
            setCertificates([]);
          }
        } else {
          console.log('No valid submissions data or component unmounted');
          if (isMounted.current) {
            setCertificates([]);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (isMounted.current) {
          toast.error('Failed to load your certificates');
        }
      } finally {
        // Ensure loading is set to false in all cases
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    loadUserData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted.current = false;
    };
  }, [isAuthenticated, userId, fetchUserSubmissions, navigate]);

  // Handle view certificate
  const handleViewCertificate = (certificate: InteractiveSubmissionExtended) => {
    setSelectedCertificate(certificate);
    setShowCertificate(true);
  };

  // Format date for display
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: config.primaryColor }}>
            My Certificates
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
            View and download certificates for your completed assignments.
          </p>

          {/* Stats Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 sm:p-4 text-center mb-6">
            <h3 className="text-base sm:text-lg font-semibold mb-1">Total Certificates</h3>
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: config.accentColor }}>
              {loading ? '...' : certificates.length}
            </p>
          </div>

          {/* Certificates List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Complete assignments to earn certificates.</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Browse Assignments
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((certificate) => (
                <motion.div
                  key={certificate.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-600"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <h3 className="font-semibold text-lg truncate" title={certificate.assignmentTitle}>
                      {certificate.assignmentTitle}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Completed on {formatDate(certificate.submittedAt)}
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Score:</span>
                      <span className="font-bold text-lg" style={{ color: config.accentColor }}>
                        {certificate.score !== null && certificate.score !== undefined ? `${certificate.score}%` : '0%'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewCertificate(certificate)}
                      className="w-full py-2 mt-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      View Certificate
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Certificate Viewer Modal */}
      <AnimatePresence>
        {showCertificate && selectedCertificate && (
          <CertificateViewer
            submission={selectedCertificate}
            onClose={() => setShowCertificate(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CertificatesPage;
