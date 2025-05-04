import React from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { hexToRgba } from '../../utils/colorUtils';

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  avatarUrl?: string;
  delay?: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  quote,
  author,
  role,
  avatarUrl,
  delay = 0
}) => {
  const { config } = useConfiguration();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{
        y: -5,
        boxShadow: `0 20px 25px -5px ${hexToRgba(config.primaryColor, 0.15)}, 0 10px 10px -5px ${hexToRgba(config.secondaryColor, 0.15)}`
      }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 relative group"
    >
      {/* Background gradient that appears on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
        }}
      ></div>

      {/* Quote mark */}
      <motion.div
        className="absolute -top-4 -left-4 w-10 h-10 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
          color: 'white'
        }}
        whileHover={{
          scale: 1.1,
          rotate: [0, -5, 5, -5, 0],
          transition: { duration: 0.5 }
        }}
      >
        "
      </motion.div>

      <div className="pt-4">
        <p className="text-gray-600 dark:text-gray-300 italic mb-6 relative z-10">
          "{quote}"
        </p>

        <div className="flex items-center">
          {avatarUrl ? (
            <motion.img
              src={avatarUrl}
              alt={author}
              className="w-12 h-12 rounded-full mr-4 object-cover border-2"
              style={{ borderColor: config.accentColor }}
              whileHover={{ scale: 1.1 }}
            />
          ) : (
            <motion.div
              className="w-12 h-12 rounded-full mr-4 flex items-center justify-center text-white font-bold shadow-md"
              style={{
                background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
              }}
              whileHover={{ scale: 1.1 }}
            >
              {author.charAt(0)}
            </motion.div>
          )}

          <div>
            <h4 className="font-bold" style={{ color: config.accentColor }}>
              {author}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {role}
            </p>
          </div>
        </div>
      </div>

      {/* Decorative element */}
      <div
        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg transform rotate-12 opacity-70 hidden md:block"
        style={{ background: config.accentColor }}
      ></div>
    </motion.div>
  );
};

export default TestimonialCard;
