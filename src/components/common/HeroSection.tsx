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
    <div className="relative overflow-hidden py-20 md:py-24 mt-10 md:mt-8">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        {config.animationsEnabled && (
          <>
            <div
              className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse-slow"
              style={{ backgroundColor: config.primaryColor }}
            ></div>
            <div
              className="absolute -top-20 right-1/3 w-72 h-72 rounded-full blur-3xl opacity-10 animate-pulse-slow animation-delay-1000"
              style={{ backgroundColor: config.accentColor }}
            ></div>
            <div
              className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse-slow animation-delay-2000"
              style={{ backgroundColor: config.secondaryColor }}
            ></div>
            <div
              className="absolute bottom-1/4 left-10 w-64 h-64 rounded-full blur-3xl opacity-10 animate-pulse-slow animation-delay-3000"
              style={{ backgroundColor: config.accentColor }}
            ></div>
          </>
        )}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Text content */}
          <motion.div
            className="flex-1 text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-theme-gradient"
              style={{
                backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`
              }}
            >
              {title}
            </h1>

            <p className="text-lg md:text-xl mb-8 text-gray-600 dark:text-gray-300 max-w-2xl">
              {subtitle}
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all relative overflow-hidden group"
                style={{
                  background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 10px 20px ${hexToRgba(config.primaryColor, 0.3)}`
                }}
                onClick={handlePrimaryClick}
              >
                <span className="relative z-10">{ctaText}</span>
                <span
                  className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                ></span>
              </motion.button>

              {secondaryCtaText && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-xl font-bold border-2 transition-all relative overflow-hidden group"
                  style={{
                    borderColor: config.accentColor,
                    color: config.accentColor
                  }}
                  onClick={handleSecondaryClick}
                >
                  <span className="relative z-10">{secondaryCtaText}</span>
                  <span
                    className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    style={{ backgroundColor: config.accentColor }}
                  ></span>
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Image or illustration */}
          {imageSrc && (
            <motion.div
              className="flex-1 relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            >
              <div className="relative">
                {/* Decorative elements */}
                <div
                  className="absolute -top-4 -left-4 w-16 h-16 rounded-lg transform rotate-12 hidden md:block"
                  style={{
                    background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
                    opacity: 0.7
                  }}
                ></div>
                <div
                  className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full hidden md:block"
                  style={{
                    background: config.accentColor,
                    opacity: 0.6
                  }}
                ></div>

                {/* Main image */}
                <img
                  src={imageSrc}
                  alt="Interactive Learning"
                  className="w-full h-auto max-w-lg mx-auto rounded-2xl shadow-2xl relative z-10"
                  style={{
                    boxShadow: `0 20px 25px -5px ${hexToRgba(config.primaryColor, 0.2)}, 0 10px 10px -5px ${hexToRgba(config.secondaryColor, 0.2)}`,
                    border: `4px solid white`
                  }}
                />

                {/* Glow effect */}
                {config.animationsEnabled && (
                  <div
                    className="absolute inset-0 rounded-2xl blur-xl -z-10 opacity-40"
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
