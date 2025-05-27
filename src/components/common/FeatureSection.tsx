import React from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import FeatureCard from './FeatureCard';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  details?: string[];
}

interface FeatureSectionProps {
  title: string;
  subtitle: string;
  features: Feature[];
  onLearnMore?: (index: number) => void;
}

const FeatureSection: React.FC<FeatureSectionProps> = ({
  title,
  subtitle,
  features,
  onLearnMore
}) => {
  const { config } = useConfiguration();

  return (
    <div className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 text-theme-gradient"
            style={{
              backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {title}
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              delay={index * 0.1}
              onLearnMore={onLearnMore ? () => onLearnMore(index) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureSection;
