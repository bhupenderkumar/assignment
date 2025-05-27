import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useConfiguration } from '../../context/ConfigurationContext';

import HeroSection from '../common/HeroSection';
import FeatureSection from '../common/FeatureSection';
import { hexToRgba } from '../../utils/colorUtils';

// Icons (using inline SVGs for simplicity)
const AssignmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const MatchingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CertificateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const OrganizationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const AudioIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const ProgressIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const LandingPage: React.FC = () => {
  const { config } = useConfiguration();
  const navigate = useNavigate();

  // Popup state
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);

  // SaaS Features data - Mobile-first design
  const features = [
    {
      title: "Interactive Learning Platform",
      description: "Create engaging assignments with drag-and-drop exercises, real-time feedback, and mobile-optimized interfaces that work seamlessly across all devices.",
      icon: <AssignmentIcon />,
      details: [
        "📱 Mobile-first responsive design",
        "🎯 Multiple exercise types (matching, ordering, completion)",
        "⚡ Real-time feedback and validation",
        "📊 Advanced progress tracking and analytics",
        "🎨 Customizable scoring and grading systems"
      ]
    },
    {
      title: "Smart Matching Engine",
      description: "AI-powered matching exercises with intuitive touch-friendly interfaces, perfect for mobile learning experiences.",
      icon: <MatchingIcon />,
      details: [
        "🤖 AI-powered matching algorithms",
        "👆 Touch-optimized drag-and-drop interface",
        "✅ Instant validation with visual feedback",
        "📈 Adaptive difficulty progression",
        "🎵 Support for multimedia content and audio"
      ]
    },
    {
      title: "Digital Certificates",
      description: "Professional certificate generation with organization branding, social sharing, and mobile-friendly download options.",
      icon: <CertificateIcon />,
      details: [
        "🏆 Professional certificate templates",
        "🔒 Secure verification system",
        "📱 Mobile-optimized sharing (WhatsApp, social media)",
        "⚡ Automated certificate generation",
        "🎖️ Digital badge and achievement system"
      ]
    },
    {
      title: "Organization Management",
      description: "Complete SaaS solution for educational institutions with multi-organization support, branding, and user management.",
      icon: <OrganizationIcon />,
      details: [
        "🏢 Multi-organization architecture",
        "🎨 Custom branding and white-labeling",
        "👥 Role-based access control",
        "📊 Organization-wide analytics",
        "🔐 Enterprise-grade security"
      ]
    },
    {
      title: "Audio Learning Tools",
      description: "Enhanced learning with audio instructions, recording capabilities, and text-to-speech integration for accessibility.",
      icon: <AudioIcon />,
      details: [
        "🎤 Built-in audio recording and playback",
        "🗣️ Text-to-speech for accessibility",
        "🎵 Background music and sound effects",
        "📱 Mobile-optimized audio controls",
        "🌍 Multi-language audio support"
      ]
    },
    {
      title: "Analytics & Insights",
      description: "Comprehensive dashboard with real-time analytics, performance tracking, and actionable insights for educators.",
      icon: <ProgressIcon />,
      details: [
        "📊 Real-time performance dashboards",
        "📈 Student progress tracking",
        "📱 Mobile-friendly analytics interface",
        "📋 Detailed reporting and exports",
        "🎯 Predictive learning analytics"
      ]
    }
  ];

  // SaaS Statistics data
  const statistics = [
    { number: "50,000+", label: "Active Learners" },
    { number: "1,200+", label: "Educational Organizations" },
    { number: "500,000+", label: "Assignments Completed" },
    { number: "99.9%", label: "Platform Uptime" }
  ];

  // SaaS Pricing tiers
  const pricingTiers = [
    {
      name: "Starter",
      price: "Free",
      period: "forever",
      description: "Perfect for individual educators and small classrooms",
      features: [
        "Up to 50 students",
        "5 assignments per month",
        "Basic analytics",
        "Mobile-responsive design",
        "Email support"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Professional",
      price: "$29",
      period: "per month",
      description: "Ideal for schools and educational institutions",
      features: [
        "Up to 500 students",
        "Unlimited assignments",
        "Advanced analytics & reporting",
        "Custom branding",
        "Audio tools & recording",
        "Priority support",
        "Certificate generation"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For large organizations with advanced needs",
      features: [
        "Unlimited students",
        "Multi-organization management",
        "White-label solution",
        "API access",
        "Advanced security & compliance",
        "Dedicated account manager",
        "Custom integrations"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  // Enhanced testimonials with mobile focus
  const testimonials = [
    {
      quote: "The mobile-first design has been a game-changer for our students. They can now complete assignments on their phones during commutes, leading to 40% higher completion rates.",
      author: "Dr. Sarah Johnson",
      role: "Director of E-Learning, Stanford University",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    {
      quote: "The SaaS model allowed us to scale from 100 to 10,000 students seamlessly. The organization management features are exactly what we needed for our multi-campus setup.",
      author: "Prof. Michael Chen",
      role: "Head of Digital Education, MIT",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
      quote: "Certificate sharing via WhatsApp has increased student motivation tremendously. Parents love receiving their children's achievements instantly on their phones.",
      author: "Dr. Priya Patel",
      role: "Chief Academic Officer, Global Education Group",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    }
  ];

  return (
    <div className="landing-page -mt-20 pt-20 md:pt-32">
      {/* Mobile-First SaaS Hero Section */}
      <HeroSection
        title="Transform Education with Mobile-First Interactive Learning"
        subtitle="The complete SaaS platform for creating engaging assignments, tracking progress, and generating certificates. Trusted by 1,200+ educational organizations worldwide."
        ctaText="Start Free Trial"
        ctaLink="/sign-up"
        secondaryCtaText="View Live Demo"
        secondaryCtaLink="/gallery"
        imageSrc="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
      />

      {/* Mobile-Optimized Statistics Section */}
      <section className="py-8 md:py-12 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-800 dark:text-white">
              Trusted by Educators Worldwide
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Join thousands of institutions already transforming education
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {statistics.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -2, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
              >
                <h3
                  className="text-2xl md:text-4xl font-bold mb-1 md:mb-2"
                  style={{ color: config.primaryColor }}
                >
                  {stat.number}
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SaaS Pricing Section */}
      <section className="py-12 md:py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              className="text-3xl md:text-4xl font-bold mb-4 text-theme-gradient"
              style={{
                backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`
              }}
            >
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose the perfect plan for your educational needs. Start free and scale as you grow.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={index}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 p-6 md:p-8 ${
                  tier.popular
                    ? 'border-blue-500 transform scale-105'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span
                      className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium"
                    >
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">{tier.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl md:text-4xl font-bold" style={{ color: config.primaryColor }}>
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        /{tier.period}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm">
                      <svg
                        className="w-4 h-4 mr-3 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ color: config.primaryColor }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                    tier.popular
                      ? 'text-white shadow-lg'
                      : 'border-2 transition-all'
                  }`}
                  style={
                    tier.popular
                      ? {
                          background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                          boxShadow: `0 4px 15px ${hexToRgba(config.primaryColor, 0.3)}`
                        }
                      : {
                          borderColor: config.primaryColor,
                          color: config.primaryColor
                        }
                  }
                  onClick={() => navigate(tier.name === 'Enterprise' ? '/contact' : '/sign-up')}
                >
                  {tier.cta}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with enhanced descriptions */}
      {/* Feature Popup */}
      <AnimatePresence>
        {selectedFeature !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFeature(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700"
              onClick={e => e.stopPropagation()}
              style={{
                boxShadow: `0 25px 30px -5px ${hexToRgba(config.primaryColor, 0.2)}, 0 15px 15px -5px ${hexToRgba(config.secondaryColor, 0.2)}`
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center relative"
                    style={{
                      background: `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.2)}, ${hexToRgba(config.secondaryColor, 0.2)})`,
                      border: `2px solid ${hexToRgba(config.primaryColor, 0.3)}`
                    }}
                  >
                    {features[selectedFeature].icon}
                  </div>
                  <h3
                    className="text-2xl font-bold"
                    style={{ color: config.primaryColor }}
                  >
                    {features[selectedFeature].title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {features[selectedFeature].description}
              </p>
              <ul className="space-y-3">
                {features[selectedFeature].details.map((detail, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{ color: config.accentColor }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {detail}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FeatureSection
        title="Mobile-First SaaS Features"
        subtitle="Everything you need to create, manage, and scale interactive learning experiences"
        features={features}
        onLearnMore={(index) => setSelectedFeature(index)}
      />

      {/* Mobile-First How It Works Section */}
      <section className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              className="text-3xl md:text-4xl font-bold mb-4 text-theme-gradient"
              style={{
                backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`
              }}
            >
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Launch your mobile-first learning platform in minutes, not months
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Step 1 */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg text-center md:text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            >
              <div className="flex items-center justify-center md:justify-start mb-4">
                <div
                  className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white text-lg md:text-xl font-bold transform -rotate-3"
                  style={{ background: config.primaryColor }}
                >
                  1
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3">Sign Up & Create Organization</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                Create your account and set up your organization with custom branding in under 2 minutes.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg text-center md:text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            >
              <div className="flex items-center justify-center md:justify-start mb-4">
                <div
                  className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white text-lg md:text-xl font-bold transform rotate-3"
                  style={{ background: config.secondaryColor }}
                >
                  2
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3">Create Mobile-First Content</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                Build interactive assignments optimized for mobile devices or choose from our template gallery.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg text-center md:text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            >
              <div className="flex items-center justify-center md:justify-start mb-4">
                <div
                  className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white text-lg md:text-xl font-bold transform -rotate-3"
                  style={{
                    background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
                  }}
                >
                  3
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3">Share & Track Progress</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                Share assignments via mobile-friendly links and track student progress with real-time analytics.
              </p>
            </motion.div>
          </div>

          {/* Mobile CTA */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all"
              style={{
                background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                boxShadow: `0 10px 20px ${hexToRgba(config.primaryColor, 0.3)}`
              }}
              onClick={() => navigate('/sign-up')}
            >
              Start Your Free Trial Today
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Mobile-Optimized Testimonials Section */}
      <section className="py-12 md:py-20 relative overflow-hidden bg-white dark:bg-gray-900">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(45deg, ${config.primaryColor} 25%, transparent 25%),
                            linear-gradient(-45deg, ${config.secondaryColor} 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, ${config.primaryColor} 75%),
                            linear-gradient(-45deg, transparent 75%, ${config.secondaryColor} 75%)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }}
        ></div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              className="text-3xl md:text-4xl font-bold mb-4 text-theme-gradient"
              style={{
                backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`
              }}
            >
              Loved by Educators Worldwide
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              See how institutions are transforming education with our mobile-first platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              >
                {/* Quote */}
                <div className="mb-6">
                  <svg
                    className="w-8 h-8 mb-4 opacity-50"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: config.primaryColor }}
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                  </svg>
                  <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full object-cover mr-4 border-2"
                    style={{ borderColor: hexToRgba(config.primaryColor, 0.3) }}
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">
                      {testimonial.author}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Social Proof */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 opacity-60">
              <span className="text-sm text-gray-600 dark:text-gray-400">Trusted by:</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏫</span>
                <span className="text-sm font-medium">Universities</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏢</span>
                <span className="text-sm font-medium">Corporations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <span className="text-sm font-medium">Training Centers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📱</span>
                <span className="text-sm font-medium">Mobile-First</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile-First Final CTA Section */}
      <section className="py-12 md:py-20 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.05)}, ${hexToRgba(config.secondaryColor, 0.05)})`
          }}
        ></div>

        {config.animationsEnabled && (
          <>
            <div
              className="absolute top-0 left-1/4 w-32 h-32 md:w-64 md:h-64 rounded-full blur-3xl opacity-10 animate-pulse-slow"
              style={{ backgroundColor: config.primaryColor }}
            ></div>
            <div
              className="absolute bottom-0 right-1/4 w-32 h-32 md:w-64 md:h-64 rounded-full blur-3xl opacity-10 animate-pulse-slow animation-delay-2000"
              style={{ backgroundColor: config.secondaryColor }}
            ></div>
          </>
        )}

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-12 max-w-4xl mx-auto border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{
              boxShadow: `0 25px 30px -5px ${hexToRgba(config.primaryColor, 0.2)}, 0 15px 15px -5px ${hexToRgba(config.secondaryColor, 0.2)}`
            }}
          >
            <motion.h2
              className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-center"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Ready to Transform Education?
            </motion.h2>
            <motion.p
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 md:mb-8 text-center max-w-2xl mx-auto"
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Join 1,200+ educational organizations already using our mobile-first platform. Start your free trial today and see the difference.
            </motion.p>

            {/* Mobile-optimized feature highlights */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📱</div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Mobile-First</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🚀</div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Quick Setup</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Interactive</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Analytics</p>
              </div>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-white shadow-lg transition-all relative overflow-hidden group text-sm md:text-base"
                style={{
                  background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 10px 20px ${hexToRgba(config.primaryColor, 0.3)}`
                }}
                onClick={() => navigate('/sign-up')}
              >
                <span className="relative z-10">🚀 Start Free Trial</span>
                <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold border-2 transition-all relative overflow-hidden group text-sm md:text-base"
                style={{
                  borderColor: config.accentColor,
                  color: config.accentColor
                }}
                onClick={() => navigate('/gallery')}
              >
                <span className="relative z-10">👀 View Live Demo</span>
                <span
                  className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                  style={{ backgroundColor: config.accentColor }}
                ></span>
              </motion.button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="text-center mt-6 md:mt-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-2">
                ✅ No credit card required • ✅ 14-day free trial • ✅ Cancel anytime
              </p>
              <div className="flex justify-center items-center gap-4 text-xs text-gray-400">
                <span>🔒 SOC 2 Compliant</span>
                <span>•</span>
                <span>🌍 GDPR Ready</span>
                <span>•</span>
                <span>📱 Mobile Optimized</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
