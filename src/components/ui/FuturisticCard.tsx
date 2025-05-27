import React from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';

interface FuturisticCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient' | 'neon';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  animate?: boolean;
  glowColor?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const FuturisticCard: React.FC<FuturisticCardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  rounded = 'xl',
  shadow = 'lg',
  animate = true,
  glowColor,
  onClick,
  disabled = false
}) => {
  const { config } = useConfiguration();

  // Padding classes
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
    xl: 'p-8 md:p-10'
  };

  // Rounded classes
  const roundedClasses = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    '2xl': 'rounded-[2rem]'
  };

  // Shadow classes
  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl'
  };

  // Variant styles
  const getVariantClasses = () => {
    switch (variant) {
      case 'glass':
        return config.darkMode
          ? 'glass-card-dark text-white'
          : 'glass-card text-gray-800';
      
      case 'gradient':
        return 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 text-gray-800';
      
      case 'neon':
        return `bg-gray-900 border-2 text-white ${
          glowColor ? `border-${glowColor}-400` : 'border-cyan-400'
        } shadow-lg ${
          glowColor ? `shadow-${glowColor}-400/50` : 'shadow-cyan-400/50'
        }`;
      
      default:
        return config.darkMode
          ? 'bg-gray-800 border border-gray-700 text-white'
          : 'bg-white border border-gray-200 text-gray-800';
    }
  };

  // Animation variants
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    hover: {
      y: -2,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  };

  const baseClasses = `
    ${paddingClasses[padding]}
    ${roundedClasses[rounded]}
    ${shadowClasses[shadow]}
    ${getVariantClasses()}
    transition-all duration-300
    relative overflow-hidden
    ${onClick && !disabled ? 'cursor-pointer' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const CardComponent = animate ? motion.div : 'div';
  const animationProps = animate ? {
    variants: cardVariants,
    initial: "hidden",
    animate: "visible",
    whileHover: onClick && !disabled ? "hover" : undefined,
    whileTap: onClick && !disabled ? "tap" : undefined
  } : {};

  return (
    <CardComponent
      className={baseClasses}
      onClick={onClick && !disabled ? onClick : undefined}
      {...animationProps}
    >
      {/* Neon glow effect for neon variant */}
      {variant === 'neon' && (
        <div 
          className={`absolute inset-0 rounded-${rounded} opacity-20 blur-sm ${
            glowColor ? `bg-${glowColor}-400` : 'bg-cyan-400'
          }`}
          style={{ zIndex: -1 }}
        />
      )}

      {/* Gradient overlay for glass variant */}
      {variant === 'glass' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      )}

      {/* Shimmer effect for interactive cards */}
      {onClick && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </CardComponent>
  );
};

export default FuturisticCard;
