// src/components/pages/ManagementPage.tsx
import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveAssignment } from '../../types/interactiveAssignment';
import AssignmentManagementList from '../admin/AssignmentManagementList';
import Layout from '../layout/Layout';
import { useTranslations } from '../../hooks/useTranslations';
import { useConfiguration } from '../../context/ConfigurationContext';
import { hexToRgba } from '../../utils/colorUtils';
import { useUserRole } from '../../hooks/useUserRole';

// Lazy load components for better performance
const UserProgressDashboard = lazy(() => import('../admin/UserProgressDashboard'));
const AnonymousUserActivity = lazy(() => import('../admin/AnonymousUserActivity'));
const AllUserActivity = lazy(() => import('../admin/AllUserActivity'));

interface ManagementPageProps {
  onEdit: (assignment: InteractiveAssignment) => void;
  onShare: (assignment: InteractiveAssignment) => void;
}

type TabId = 'assignments' | 'progress' | 'activity' | 'all-activity';

const ManagementPage = ({ onEdit, onShare }: ManagementPageProps) => {
  const { assignmentTranslate, commonTranslate } = useTranslations();
  const { config } = useConfiguration();
  const { isAdmin } = useUserRole();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [activeTab, setActiveTab] = useState<TabId>('assignments');
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['assignments']));

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle tab switching with lazy loading
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    // Mark this tab as loaded when it becomes active
    setLoadedTabs(prev => new Set([...prev, tabId]));
  };

  // Define available tabs based on user permissions
  const availableTabs = [
    {
      id: 'assignments' as TabId,
      label: assignmentTranslate('title'),
      icon: '📝',
      description: assignmentTranslate('management', 'Manage your assignments')
    },
    {
      id: 'progress' as TabId,
      label: commonTranslate('userProgress', 'User Progress'),
      icon: '📊',
      description: commonTranslate('trackProgress', 'Track user progress and performance'),
      adminOnly: false
    },
    {
      id: 'activity' as TabId,
      label: commonTranslate('anonymousActivity', 'Anonymous Activity'),
      icon: '👤',
      description: commonTranslate('viewAnonymous', 'View anonymous user activities'),
      adminOnly: false
    },
    ...(isAdmin ? [{
      id: 'all-activity' as TabId,
      label: commonTranslate('allUserActivity', 'All User Activity'),
      icon: '👥',
      description: commonTranslate('viewAllActivity', 'View all user activities'),
      adminOnly: true
    }] : [])
  ];

  // Animation variants for different screen sizes
  const containerVariants = {
    hidden: { opacity: 0, y: isMobile ? 10 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isMobile ? 0.2 : 0.3,
        ease: "easeOut"
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, x: isMobile ? -10 : -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: isMobile ? 0.2 : 0.3,
        delay: 0.1,
        ease: "easeOut"
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: isMobile ? 5 : 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isMobile ? 0.2 : 0.3,
        delay: 0.2,
        ease: "easeOut"
      }
    }
  };

  return (
    <Layout>
      {/* Mobile-First Container with Responsive Spacing */}
      <div className="w-full max-w-none">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4 md:space-y-6 lg:space-y-8"
        >
          {/* Mobile-Optimized Header Section */}
          <motion.div
            variants={headerVariants}
            className="relative"
          >
            {/* Background Gradient for Header */}
            <div
              className="absolute inset-0 rounded-xl md:rounded-2xl opacity-30"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.1)}, ${hexToRgba(config.secondaryColor, 0.05)})`,
              }}
            />

            {/* Header Content */}
            <div className="relative px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                {/* Title Section */}
                <div className="space-y-1 md:space-y-2">
                  <h1
                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-theme-gradient leading-tight"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {assignmentTranslate('manage')}
                  </h1>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-2xl">
                    {assignmentTranslate('management', 'Create, edit, and organize your interactive assignments')}
                  </p>
                </div>

                {/* Mobile-Friendly Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {/* Quick Stats - Hidden on very small screens */}
                  <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: config.primaryColor }}
                      />
                      <span>{commonTranslate('active', 'Active')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Breadcrumb/Navigation Hint */}
              <div className="mt-3 md:mt-4 flex items-center space-x-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                <span>{commonTranslate('dashboard', 'Dashboard')}</span>
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium" style={{ color: config.primaryColor }}>
                  {assignmentTranslate('manage')}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Mobile-First Tab Navigation */}
          <motion.div
            variants={headerVariants}
            className="relative"
          >
            {/* Tab Background */}
            <div
              className="absolute inset-0 rounded-lg md:rounded-xl opacity-20"
              style={{
                background: config.darkMode
                  ? `linear-gradient(135deg, ${hexToRgba('#334155', 0.3)}, ${hexToRgba('#475569', 0.2)})`
                  : `linear-gradient(135deg, ${hexToRgba('#F8FAFC', 0.8)}, ${hexToRgba('#E2E8F0', 0.6)})`,
                border: `1px solid ${hexToRgba(config.primaryColor, 0.1)}`,
              }}
            />

            {/* Tab Navigation */}
            <div className="relative px-2 sm:px-4 md:px-6 py-3 md:py-4">
              {/* Desktop Tab Navigation */}
              <div className="hidden md:block">
                <nav className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
                  {availableTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                      title={tab.description}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Mobile Tab Navigation - Horizontal Scroll */}
              <div className="md:hidden">
                <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide">
                  {availableTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                      style={activeTab === tab.id ? {
                        backgroundColor: hexToRgba(config.primaryColor, 0.1),
                        color: config.primaryColor
                      } : {}}
                    >
                      <span className="text-base">{tab.icon}</span>
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Tab Description */}
              <div className="mt-3 md:mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {availableTabs.find(tab => tab.id === activeTab)?.description}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main Content Section with Responsive Container */}
          <motion.div
            variants={contentVariants}
            className="relative"
          >
            {/* Content Background with Subtle Border */}
            <div
              className="absolute inset-0 rounded-lg md:rounded-xl opacity-20"
              style={{
                background: config.darkMode
                  ? `linear-gradient(135deg, ${hexToRgba('#1E293B', 0.3)}, ${hexToRgba('#334155', 0.2)})`
                  : `linear-gradient(135deg, ${hexToRgba('#FFFFFF', 0.8)}, ${hexToRgba('#F8FAFC', 0.6)})`,
                border: `1px solid ${hexToRgba(config.primaryColor, 0.1)}`,
              }}
            />

            {/* Content Container with Responsive Padding */}
            <div className="relative">
              {/* Mobile-Optimized Content Wrapper */}
              <div className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
                {/* Tab Content with Animation */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: isMobile ? 10 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: isMobile ? -10 : -20 }}
                    transition={{ duration: isMobile ? 0.2 : 0.3 }}
                    className="w-full"
                  >
                    {/* Assignments Tab */}
                    {activeTab === 'assignments' && (
                      <AssignmentManagementList onEdit={onEdit} onShare={onShare} />
                    )}

                    {/* User Progress Tab */}
                    {activeTab === 'progress' && (
                      <Suspense fallback={
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          <span className="ml-3 text-gray-600 dark:text-gray-300">
                            {commonTranslate('loadingProgress', 'Loading user progress...')}
                          </span>
                        </div>
                      }>
                        {loadedTabs.has('progress') ? (
                          <UserProgressDashboard shouldLoad={loadedTabs.has('progress')} />
                        ) : (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-3 text-gray-600 dark:text-gray-300">
                              {commonTranslate('loadingProgress', 'Loading user progress...')}
                            </span>
                          </div>
                        )}
                      </Suspense>
                    )}

                    {/* Anonymous Activity Tab */}
                    {activeTab === 'activity' && (
                      <Suspense fallback={
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          <span className="ml-3 text-gray-600 dark:text-gray-300">
                            {commonTranslate('loadingActivity', 'Loading activity data...')}
                          </span>
                        </div>
                      }>
                        {loadedTabs.has('activity') ? (
                          <AnonymousUserActivity shouldLoad={loadedTabs.has('activity')} />
                        ) : (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-3 text-gray-600 dark:text-gray-300">
                              {commonTranslate('loadingActivity', 'Loading activity data...')}
                            </span>
                          </div>
                        )}
                      </Suspense>
                    )}

                    {/* All User Activity Tab (Admin Only) */}
                    {activeTab === 'all-activity' && isAdmin && (
                      <Suspense fallback={
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          <span className="ml-3 text-gray-600 dark:text-gray-300">
                            {commonTranslate('loadingAllActivity', 'Loading all user activity...')}
                          </span>
                        </div>
                      }>
                        {loadedTabs.has('all-activity') ? (
                          <AllUserActivity shouldLoad={loadedTabs.has('all-activity')} />
                        ) : (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-3 text-gray-600 dark:text-gray-300">
                              {commonTranslate('loadingAllActivity', 'Loading all user activity...')}
                            </span>
                          </div>
                        )}
                      </Suspense>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Mobile-Specific Bottom Spacing */}
              <div className="h-4 md:h-6 lg:h-8" />
            </div>
          </motion.div>

          {/* Mobile-Friendly Footer Section */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="px-4 py-3 text-center"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {commonTranslate('swipeForMore', 'Swipe or scroll for more options')}
              </p>
            </motion.div>
          )}

          {/* Tablet-Specific Enhancements */}
          {isTablet && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="hidden md:block lg:hidden px-6 py-4"
            >
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.secondaryColor }}
                  />
                  <span>{commonTranslate('optimizedForTablet', 'Optimized for tablet view')}</span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default ManagementPage;
