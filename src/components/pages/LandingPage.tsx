import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useConfiguration } from '../../context/ConfigurationContext';
import HeroSection from '../common/HeroSection';
import FeatureSection from '../common/FeatureSection';
import TestimonialCard from '../common/TestimonialCard';
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

  // Features data
  const features = [
    {
      title: "Interactive Assignments",
      description: "Create engaging custom assignments with multiple exercise types, real-time feedback, and advanced tracking features.",
      icon: <AssignmentIcon />,
      details: [
        "Multiple exercise types including matching, ordering, and completion",
        "Real-time feedback and validation",
        "Progress tracking and analytics",
        "Customizable scoring and grading",
        "Mobile-friendly interface"
      ]
    },
    {
      title: "Smart Matching Exercises",
      description: "Boost engagement with AI-powered matching exercises featuring intuitive drag-and-drop interfaces and instant validation.",
      icon: <MatchingIcon />,
      details: [
        "AI-powered matching algorithms",
        "Intuitive drag-and-drop interface",
        "Instant validation and feedback",
        "Adaptive difficulty levels",
        "Support for text and multimedia content"
      ]
    },
    {
      title: "Digital Certificates",
      description: "Motivate learners with personalized digital certificates featuring secure verification and easy social sharing.",
      icon: <CertificateIcon />,
      details: [
        "Customizable certificate templates",
        "Secure blockchain verification",
        "Social media sharing integration",
        "Automated certificate generation",
        "Digital badge system"
      ]
    },
    {
      title: "Enterprise Management",
      description: "Scale your organization with powerful management tools, role-based access, and custom branding options.",
      icon: <OrganizationIcon />,
      details: [
        "Role-based access control",
        "Custom branding and white-labeling",
        "Multi-team collaboration",
        "Resource management",
        "Advanced security features"
      ]
    },
    {
      title: "Advanced Audio Tools",
      description: "Enhance learning with studio-quality audio recording, AI-powered transcription, and interactive visualizations.",
      icon: <AudioIcon />,
      details: [
        "Studio-quality audio recording",
        "AI-powered transcription",
        "Interactive audio visualizations",
        "Voice recognition technology",
        "Multi-language support"
      ]
    },
    {
      title: "Analytics Dashboard",
      description: "Track progress with real-time analytics, performance insights, and customizable progress metrics.",
      icon: <ProgressIcon />,
      details: [
        "Real-time performance tracking",
        "Customizable progress metrics",
        "Data visualization tools",
        "Export and reporting features",
        "Predictive analytics"
      ]
    }
  ];

  // Statistics data
  const statistics = [
    { number: "50,000+", label: "Active Students" },
    { number: "1,000+", label: "Educational Institutions" },
    { number: "250,000+", label: "Completed Assignments" },
    { number: "98%", label: "Satisfaction Rate" }
  ];

  // Testimonials data
  const testimonials = [
    {
      quote: "This platform revolutionized our online learning program. The interactive assignments and real-time analytics have significantly improved student engagement and performance.",
      author: "Dr. Sarah Johnson",
      role: "Director of E-Learning, Stanford University"
    },
    {
      quote: "The certificate system and progress tracking features have transformed how we motivate and monitor student achievement. It's been invaluable for our distance learning programs.",
      author: "Prof. Michael Chen",
      role: "Head of Digital Education, MIT"
    },
    {
      quote: "The enterprise management tools make it incredibly easy to scale our educational programs across multiple campuses while maintaining consistent quality standards.",
      author: "Dr. Priya Patel",
      role: "Chief Academic Officer, Global Education Group"
    }
  ];

  return (
    <div className="landing-page -mt-20 pt-32 md:pt-32">
      {/* Hero Section with enhanced messaging */}
      <HeroSection
        title="Transform Education Through Interactive Learning"
        subtitle="Empower educators and engage students with our AI-powered platform. Create immersive learning experiences that drive better outcomes and foster lasting knowledge retention."
        ctaText="Start Free Trial"
        ctaLink="/sign-up"
        secondaryCtaText="View Demo"
        secondaryCtaLink="/gallery"
        imageSrc="https://images.unsplash.com/photo-1610484826967-09c5720778c7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
      />

      {/* Statistics Section */}
      <section className="py-12 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statistics.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <h3
                  className="text-3xl md:text-4xl font-bold mb-2"
                  style={{ color: config.primaryColor }}
                >
                  {stat.number}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{stat.label}</p>
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
        title="Enterprise-Grade Features"
        subtitle="Powerful tools designed to transform your educational institution"
        features={features}
        onLearnMore={(index) => setSelectedFeature(index)}
      />

      {/* How It Works Section with modern design */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
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
              Start Teaching in Minutes
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our streamlined platform makes it easy to create and manage interactive learning experiences
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold mb-6 transform -rotate-3"
                style={{ background: config.primaryColor }}
              >
                1
              </div>
              <h3 className="text-xl font-bold mb-4">Create Your Workspace</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Set up your organization's branded environment and invite team members to collaborate.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold mb-6 transform rotate-3"
                style={{ background: config.secondaryColor }}
              >
                2
              </div>
              <h3 className="text-xl font-bold mb-4">Design Engaging Content</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create interactive assignments or choose from our curated gallery of templates.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold mb-6 transform -rotate-3"
                style={{
                  background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
                }}
              >
                3
              </div>
              <h3 className="text-xl font-bold mb-4">Monitor & Optimize</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track progress, generate insights, and continuously improve learning outcomes.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
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
            className="text-center mb-16"
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
              Trusted by Leading Educators
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Join thousands of educational institutions already transforming their teaching experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.1)}, ${hexToRgba(config.secondaryColor, 0.1)})`
          }}
        ></div>

        {config.animationsEnabled && (
          <>
            <div
              className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse-slow"
              style={{ backgroundColor: config.primaryColor }}
            ></div>
            <div
              className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse-slow animation-delay-2000"
              style={{ backgroundColor: config.secondaryColor }}
            ></div>
          </>
        )}

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 max-w-4xl mx-auto border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{
              boxShadow: `0 25px 30px -5px ${hexToRgba(config.primaryColor, 0.2)}, 0 15px 15px -5px ${hexToRgba(config.secondaryColor, 0.2)}`
            }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-6 text-center"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Start Your Digital Learning Journey Today
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 dark:text-gray-300 mb-8 text-center max-w-2xl mx-auto"
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Join over 1,000 leading institutions already transforming education with our platform.
              Start your free trial today and see the difference.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row justify-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all relative overflow-hidden group"
                style={{
                  background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                  boxShadow: `0 10px 20px ${hexToRgba(config.primaryColor, 0.3)}`
                }}
                onClick={() => navigate('/sign-up')}
              >
                <span className="relative z-10">Start Free Trial</span>
                <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl font-bold border-2 transition-all relative overflow-hidden group"
                style={{
                  borderColor: config.accentColor,
                  color: config.accentColor
                }}
                onClick={() => navigate('/gallery')}
              >
                <span className="relative z-10">Schedule Demo</span>
                <span
                  className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                  style={{ backgroundColor: config.accentColor }}
                ></span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
