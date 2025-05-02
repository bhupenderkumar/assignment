// src/components/assignments/CelebrationOverlay.tsx
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { playSound } from '../../lib/utils/soundUtils';
import { useConfiguration } from '../../context/ConfigurationContext';

interface CelebrationOverlayProps {
  isVisible: boolean;
  score: number;
  submissionId?: string;
  onClose: () => void;
}

const CelebrationOverlay = ({
  isVisible,
  score,
  submissionId,
  onClose
}: CelebrationOverlayProps) => {
  const navigate = useNavigate();
  const { config } = useConfiguration();
  // Play celebration sound when visible
  useEffect(() => {
    if (isVisible) {
      playSound('celebration', 0.7);
    }
  }, [isVisible]);

  // Get celebration message based on score
  const getCelebrationMessage = (score: number) => {
    if (score >= 90) {
      return 'Amazing job! You\'re a superstar!';
    } else if (score >= 70) {
      return 'Great work! You did awesome!';
    } else if (score >= 50) {
      return 'Good job! Keep practicing!';
    } else {
      return 'Nice try! Let\'s practice more!';
    }
  };

  // Get star rating based on score
  const getStarRating = (score: number) => {
    if (score >= 90) return 5;
    if (score >= 70) return 4;
    if (score >= 50) return 3;
    if (score >= 30) return 2;
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
              <p className="text-2xl font-bold text-blue-600">
                Score: {score}%
              </p>
            </motion.div>

            <div className="flex flex-col space-y-3">
              {submissionId && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => {
                    navigate('/dashboard');
                    onClose();
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all duration-300 text-lg"
                  style={{ backgroundColor: config.primaryColor }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Certificate
                </motion.button>
              )}

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={onClose}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all duration-300 text-lg"
                style={{ backgroundColor: submissionId ? config.secondaryColor : config.primaryColor }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationOverlay;
