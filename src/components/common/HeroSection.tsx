import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useConfiguration } from '../../context/ConfigurationContext';
import { hexToRgba } from '../../utils/colorUtils';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  imageSrc?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
  imageSrc
}) => {
  const { config } = useConfiguration();
  const navigate = useNavigate();

  const handlePrimaryClick = () => {
    navigate(ctaLink);
  };

  const handleSecondaryClick = () => {
    if (secondaryCtaLink) {
      navigate(secondaryCtaLink);
    }
  };

  return (
    <div className="relative overflow-hidden py-12 md:py-20 mt-8 md:mt-8">
      {/* Mobile-optimized background elements */}
      <div className="absolute inset-0 z-0">
        {config.animationsEnabled && (
          <>
            <div
              className="absolute top-0 left-1/4 w-48 h-48 md:w-96 md:h-96 rounded-full blur-3xl opacity-10 md:opacity-20 animate-pulse-slow"
              style={{ backgroundColor: config.primaryColor }}
            ></div>
            <div
              className="absolute -top-10 md:-top-20 right-1/3 w-36 h-36 md:w-72 md:h-72 rounded-full blur-3xl opacity-5 md:opacity-10 animate-pulse-slow animation-delay-1000"
              style={{ backgroundColor: config.accentColor }}
            ></div>
            <div
              className="absolute bottom-0 right-1/4 w-48 h-48 md:w-96 md:h-96 rounded-full blur-3xl opacity-10 md:opacity-20 animate-pulse-slow animation-delay-2000"
              style={{ backgroundColor: config.secondaryColor }}
            ></div>
            <div
              className="absolute bottom-1/4 left-5 md:left-10 w-32 h-32 md:w-64 md:h-64 rounded-full blur-3xl opacity-5 md:opacity-10 animate-pulse-slow animation-delay-3000"
              style={{ backgroundColor: config.accentColor }}
            ></div>
          </>
        )}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          {/* Mobile-first text content */}
          <motion.div
            className="flex-1 text-center md:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight text-theme-gradient"
              style={{
                backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {title}
            </h1>

            <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto md:mx-0">
              {subtitle}
            </p>

            {/* Mobile-optimized trust indicators */}
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 md:gap-4 mb-6 md:mb-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <span>⭐</span>
                <span>4.9/5 Rating</span>
              </div>
              <span className="hidden md:inline">•</span>
              <div className="flex items-center gap-1">
                <span>🚀</span>
                <span>2-min Setup</span>
              </div>
              <span className="hidden md:inline">•</span>
              <div className="flex items-center gap-1">
                <span>📱</span>
                <span>Mobile-First</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center md:justify-start">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-white shadow-lg transition-all relative overflow-hidden group text-sm md:text-base"
                style={{
                  background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 10px 20px ${hexToRgba(config.primaryColor, 0.3)}`
                }}
                onClick={handlePrimaryClick}
              >
                <span className="relative z-10">🚀 {ctaText}</span>
                <span
                  className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                ></span>
              </motion.button>

              {secondaryCtaText && (
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold border-2 transition-all relative overflow-hidden group text-sm md:text-base"
                  style={{
                    borderColor: config.accentColor,
                    color: config.accentColor
                  }}
                  onClick={handleSecondaryClick}
                >
                  <span className="relative z-10">👀 {secondaryCtaText}</span>
                  <span
                    className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    style={{ backgroundColor: config.accentColor }}
                  ></span>
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Mobile-optimized image */}
          {imageSrc && (
            <motion.div
              className="flex-1 relative max-w-md md:max-w-none"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            >
              <div className="relative">
                {/* Mobile-friendly decorative elements */}
                <div
                  className="absolute -top-2 -left-2 md:-top-4 md:-left-4 w-8 h-8 md:w-16 md:h-16 rounded-lg transform rotate-12 hidden sm:block"
                  style={{
                    background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
                    opacity: 0.7
                  }}
                ></div>
                <div
                  className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-10 h-10 md:w-20 md:h-20 rounded-full hidden sm:block"
                  style={{
                    background: config.accentColor,
                    opacity: 0.6
                  }}
                ></div>

                {/* Main image - mobile optimized */}
                <img
                  src={imageSrc}
                  alt="Interactive Learning Platform"
                  className="w-full h-auto max-w-sm md:max-w-lg mx-auto rounded-xl md:rounded-2xl shadow-2xl relative z-10"
                  style={{
                    boxShadow: `0 15px 20px -5px ${hexToRgba(config.primaryColor, 0.2)}, 0 8px 8px -5px ${hexToRgba(config.secondaryColor, 0.2)}`,
                    border: `2px md:4px solid white`
                  }}
                />

                {/* Glow effect */}
                {config.animationsEnabled && (
                  <div
                    className="absolute inset-0 rounded-xl md:rounded-2xl blur-xl -z-10 opacity-30 md:opacity-40"
                    style={{
                      background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
                    }}
                  ></div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
