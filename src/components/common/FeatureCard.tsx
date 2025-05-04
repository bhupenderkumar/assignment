import React from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { hexToRgba } from '../../utils/colorUtils';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
  onLearnMore?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  delay = 0,
  onLearnMore
}) => {
  const { config } = useConfiguration();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{
        y: -8,
        boxShadow: `0 20px 25px -5px ${hexToRgba(config.primaryColor, 0.2)}, 0 10px 10px -5px ${hexToRgba(config.secondaryColor, 0.2)}`
      }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-full relative overflow-hidden group"
    >
      {/* Background gradient that appears on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
        }}
      ></div>

      {/* Icon container with glow effect */}
      <div className="relative">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 relative z-10 transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.2)}, ${hexToRgba(config.secondaryColor, 0.2)})`,
            border: `2px solid ${hexToRgba(config.primaryColor, 0.3)}`
          }}
        >
          {icon}
        </div>

        {/* Glow effect */}
        <div
          className="absolute top-0 w-16 h-16 rounded-xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300"
          style={{
            background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
          }}
        ></div>
      </div>

      <h3
        className="text-xl font-bold mb-3 relative z-10 transition-colors duration-300"
        style={{ color: config.primaryColor }}
      >
        {title}
      </h3>

      <p className="text-gray-600 dark:text-gray-300 flex-grow relative z-10">
        {description}
      </p>

      {/* Learn More button */}
      {onLearnMore && (
        <div className="mt-4 flex justify-end">
          <motion.button
            onClick={onLearnMore}
            className="text-sm font-medium transition-all duration-300 flex items-center gap-1 px-3 py-1 rounded-lg relative overflow-hidden group"
            style={{ 
              background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
              color: 'white'
            }}
            whileHover={{ scale: 1.05, x: 5, boxShadow: `0 4px 12px ${hexToRgba(config.primaryColor, 0.3)}` }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Learn more</span>
            <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default FeatureCard;
