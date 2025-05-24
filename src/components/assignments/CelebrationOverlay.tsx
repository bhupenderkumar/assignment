// src/components/assignments/CelebrationOverlay.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { playSound } from '../../lib/utils/soundUtils';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import CertificateViewer from '../certificates/CertificateViewer';

interface CelebrationOverlayProps {
  isVisible: boolean;
  score: number;
  submissionId?: string;
  onClose: () => void;
  assignmentTitle?: string;
  totalQuestions?: number;
  correctAnswers?: number;
  assignmentOrganizationId?: string;
}

const CelebrationOverlay = ({
  isVisible,
  score,
  submissionId,
  onClose,
  assignmentTitle,
  totalQuestions,
  correctAnswers,
  assignmentOrganizationId
}: CelebrationOverlayProps) => {
  const navigate = useNavigate();
  const { config } = useConfiguration();
  const { anonymousUser } = useInteractiveAssignment();
  const { user } = useSupabaseAuth();
  const [showCertificate, setShowCertificate] = useState(false);

  // Create submission object for certificate
  const submissionForCertificate = submissionId ? {
    id: submissionId,
    assignmentId: '', // This will be filled by the certificate viewer if needed
    userId: anonymousUser?.id || user?.id || '',
    score: score,
    startedAt: new Date(),
    submittedAt: new Date(),
    status: 'SUBMITTED' as const
  } : null;
  // Play celebration sound when visible
  useEffect(() => {
    if (isVisible) {
      playSound('celebration', 0.7);
    }
  }, [isVisible]);

  // Get celebration message based on score
  const getCelebrationMessage = (score: number) => {
    // Ensure score is a valid number
    const validScore = score !== null && score !== undefined ? score : 0;

    if (validScore >= 90) {
      return 'Amazing job! You\'re a superstar!';
    } else if (validScore >= 70) {
      return 'Great work! You did awesome!';
    } else if (validScore >= 50) {
      return 'Good job! Keep practicing!';
    } else {
      return 'Nice try! Let\'s practice more!';
    }
  };

  // Get star rating based on score
  const getStarRating = (score: number) => {
    // Ensure score is a valid number
    const validScore = score !== null && score !== undefined ? score : 0;

    if (validScore >= 90) return 5;
    if (validScore >= 70) return 4;
    if (validScore >= 50) return 3;
    if (validScore >= 30) return 2;
    return 1;
  };

  // Render stars
  const renderStars = (count: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <motion.span
        key={index}
        initial={{ scale: 0, rotate: -180 }}
        animate={{
          scale: index < count ? 1 : 0.5,
          rotate: 0
        }}
        transition={{
          delay: 0.3 + (index * 0.1),
          type: 'spring',
          stiffness: 200,
          damping: 10
        }}
        className={`text-4xl ${index < count ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </motion.span>
    ));
  };

  // Confetti animation
  const Confetti = () => {
    return (
      <div className="fixed inset-0 pointer-events-none z-10">
        {Array.from({ length: 100 }).map((_, index) => {
          const size = Math.random() * 10 + 5;
          const color = [
            'bg-red-500',
            'bg-blue-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-purple-500',
            'bg-pink-500',
          ][Math.floor(Math.random() * 6)];

          return (
            <motion.div
              key={index}
              className={`absolute rounded-full ${color}`}
              style={{
                width: size,
                height: size,
                top: '-5%',
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: `${100 + Math.random() * 20}vh`,
                x: Math.random() > 0.5
                  ? `${Math.random() * 20}vw`
                  : `-${Math.random() * 20}vw`,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: Math.random() * 2 + 2,
                ease: 'easeOut',
                delay: Math.random() * 0.5,
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        >
          <Confetti />

          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative z-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold mb-2"
            >
              Congratulations!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600 mb-6"
            >
              {getCelebrationMessage(score)}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6"
            >
              <div className="text-center mb-2">
                {renderStars(getStarRating(score))}
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-4">
                Score: {score !== null && score !== undefined ? score : 0}%
              </p>

              {/* Detailed Results */}
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-gray-800 mb-3">Quiz Results</h4>

                {assignmentTitle && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">Assignment: </span>
                    <span className="text-sm font-medium text-gray-800">{assignmentTitle}</span>
                  </div>
                )}

                {anonymousUser && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">Student: </span>
                    <span className="text-sm font-medium text-gray-800">{anonymousUser.name}</span>
                  </div>
                )}

                {totalQuestions && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">Questions: </span>
                    <span className="text-sm font-medium text-gray-800">{totalQuestions} total</span>
                  </div>
                )}

                {correctAnswers !== undefined && totalQuestions && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">Correct Answers: </span>
                    <span className="text-sm font-medium text-gray-800">{correctAnswers} out of {totalQuestions}</span>
                  </div>
                )}

                <div className="mb-2">
                  <span className="text-sm text-gray-600">Completed: </span>
                  <span className="text-sm font-medium text-gray-800">{new Date().toLocaleString()}</span>
                </div>

                {submissionId && (
                  <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                    Submission ID: {submissionId.substring(0, 8)}...
                  </div>
                )}
              </div>
            </motion.div>

            <div className="flex flex-col space-y-3">
              {/* Certificate Button for all users */}
              {submissionId && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => setShowCertificate(true)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all duration-300 text-lg flex items-center justify-center space-x-2"
                  style={{ backgroundColor: config.primaryColor }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>View Certificate</span>
                </motion.button>
              )}

              {/* Dashboard/Navigation Button */}
              {user && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => {
                    navigate('/user-dashboard');
                    onClose();
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all duration-300 text-lg"
                  style={{ backgroundColor: config.secondaryColor }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Go to Dashboard
                </motion.button>
              )}

              {anonymousUser && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => {
                    navigate('/home');
                    onClose();
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all duration-300 text-lg"
                  style={{ backgroundColor: config.secondaryColor }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Take Another Quiz
                </motion.button>
              )}

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all duration-300 text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {anonymousUser ? 'Close Results' : 'Continue'}
              </motion.button>
            </div>

            {/* Certificate Viewer Modal */}
            {showCertificate && submissionForCertificate && (
              <CertificateViewer
                submission={submissionForCertificate}
                onClose={() => setShowCertificate(false)}
                assignmentTitle={assignmentTitle}
                assignmentOrganizationId={assignmentOrganizationId}
              />
            )}


          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationOverlay;
