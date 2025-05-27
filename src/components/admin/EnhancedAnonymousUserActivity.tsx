// src/components/admin/EnhancedAnonymousUserActivity.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useUserRole } from '../../hooks/useUserRole';
import { usePageVisibility } from '../../hooks/usePageVisibility';
import { useConfiguration } from '../../context/ConfigurationContext';
import { hexToRgba } from '../../utils/colorUtils';
import toast from 'react-hot-toast';
import CertificateViewer from '../certificates/CertificateViewer';
import { UserCardSkeleton, ActivityCardSkeleton, StatsSkeleton } from '../ui/LoadingSkeleton';

interface AnonymousUserData {
  id: string;
  name: string;
  contactInfo?: string;
  createdAt: string;
  lastActiveAt?: string;
  totalAssignments: number;
  averageScore: number;
  organizationNames?: string[];
}

interface AnonymousActivity {
  userId: string;
  userName: string;
  assignmentId: string;
  assignmentName: string;
  submissionId: string;
  score?: number;
  completedAt: string;
  startedAt: string;
  status: string;
  timeSpent?: number;
  attempts: number;
  category?: string;
  topic?: string;
  difficultyLevel?: string;
  estimatedTimeMinutes?: number;
  totalQuestions: number;
  correctAnswers: number;
  organizationName: string;
  organizationId?: string;
}

interface EnhancedAnonymousUserActivityProps {
  shouldLoad?: boolean;
}

const EnhancedAnonymousUserActivity: React.FC<EnhancedAnonymousUserActivityProps> = ({ shouldLoad = true }) => {
  // State management
  const [anonymousUsers, setAnonymousUsers] = useState<AnonymousUserData[]>([]);
  const [activities, setActivities] = useState<AnonymousActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'assignments' | 'date'>('date');
  const [filterOrg, setFilterOrg] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedCertificateData, setSelectedCertificateData] = useState<any>(null);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [dataCache, setDataCache] = useState<Map<string, { data: any; timestamp: number }>>(new Map());
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  // Hooks
  const { user, supabase } = useSupabaseAuth();
  const { config } = useConfiguration();

  // Direct permission checking without useUserRole to reduce API calls
  const [userPermissions, setUserPermissions] = useState<{
    isAdmin: boolean;
    isOwner: boolean;
    isLoading: boolean;
  }>({ isAdmin: false, isOwner: false, isLoading: true });

  // Page visibility for performance optimization
  const { shouldPauseApiCalls } = usePageVisibility({
    onVisible: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ EnhancedAnonymousUserActivity: Page visible, resuming API calls');
      }
    },
    onHidden: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 EnhancedAnonymousUserActivity: Page hidden, pausing API calls');
      }
    }
  });

  // Cache management
  const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

  const getCachedData = useCallback((key: string) => {
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
      return cached.data;
    }
    return null;
  }, [dataCache]);

  const setCachedData = useCallback((key: string, data: any) => {
    setDataCache(prev => new Map(prev.set(key, { data, timestamp: Date.now() })));
  }, []);

  // Memoized filtered and sorted users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = anonymousUsers.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (user.contactInfo && user.contactInfo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesOrg = filterOrg === 'all' ||
                        (user.organizationNames && user.organizationNames.some(org =>
                          org.toLowerCase().includes(filterOrg.toLowerCase())
                        ));

      return matchesSearch && matchesOrg;
    });

    // Sort users
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'score':
          return b.averageScore - a.averageScore;
        case 'assignments':
          return b.totalAssignments - a.totalAssignments;
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [anonymousUsers, searchTerm, filterOrg, sortBy]);

  // Get unique organizations for filter
  const availableOrganizations = useMemo(() => {
    const orgs = new Set<string>();
    anonymousUsers.forEach(user => {
      user.organizationNames?.forEach(org => orgs.add(org));
    });
    return Array.from(orgs).sort();
  }, [anonymousUsers]);

  // Check user permissions (global admin and organization roles)
  useEffect(() => {
    const checkUserPermissions = async () => {
      if (!supabase || !user) {
        setIsGlobalAdmin(false);
        setUserPermissions({ isAdmin: false, isOwner: false, isLoading: false });
        return;
      }

      try {
        setUserPermissions(prev => ({ ...prev, isLoading: true }));

        // Check if user owns any organization (global admin)
        const { data: ownedOrgs, error: ownerError } = await supabase
          .from('organization')
          .select('id')
          .eq('owner_id', user.id);

        const isGlobalAdmin = !ownerError && ownedOrgs && ownedOrgs.length > 0;
        setIsGlobalAdmin(isGlobalAdmin);

        // Check if user is admin/owner in any organization
        const { data: userOrgs, error: roleError } = await supabase
          .from('user_organization')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'owner']);

        const hasAdminRole = !roleError && userOrgs && userOrgs.length > 0;
        const hasOwnerRole = !roleError && userOrgs && userOrgs.some(org => org.role === 'owner');

        setUserPermissions({
          isAdmin: hasAdminRole || isGlobalAdmin,
          isOwner: hasOwnerRole || isGlobalAdmin,
          isLoading: false
        });
      } catch (err) {
        console.error('Error checking user permissions:', err);
        setIsGlobalAdmin(false);
        setUserPermissions({ isAdmin: false, isOwner: false, isLoading: false });
      }
    };

    checkUserPermissions();
  }, [supabase, user]);

  // Optimized fetch function with caching
  const fetchAnonymousUsersOptimized = useCallback(async (forceRefresh = false) => {
    if (!supabase || userPermissions.isLoading || shouldPauseApiCalls) {
      return;
    }

    // Only load data if shouldLoad is true and we haven't initialized yet
    if (!shouldLoad && !forceRefresh) {
      return;
    }

    if (hasInitialized && !forceRefresh) {
      return;
    }

    // Check cache first
    const cacheKey = 'anonymous_users_data';
    if (!forceRefresh) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setAnonymousUsers(cachedData);
        setLoading(false);
        setHasInitialized(true);
        return;
      }
    }

    // Check permissions
    if (!isGlobalAdmin && !userPermissions.isAdmin && !userPermissions.isOwner) {
      setError('You do not have permission to view anonymous user activity.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: users, error: usersError } = await supabase
        .from('anonymous_user')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      if (!users || users.length === 0) {
        setAnonymousUsers([]);
        setCachedData(cacheKey, []);
        setLoading(false);
        setHasInitialized(true);
        return;
      }

      // Get submission statistics for each user with organization information
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          // Get submissions with assignment data
          const { data: submissions, error: submissionsError } = await supabase
            .from('interactive_submission')
            .select(`
              score,
              interactive_assignment(
                organization_id
              )
            `)
            .eq('user_id', user.id)
            .not('score', 'is', null);

          if (submissionsError) {
            console.error('Error fetching user submissions:', submissionsError);
          }

          const totalAssignments = submissions?.length || 0;
          const averageScore = totalAssignments > 0
            ? Math.round((submissions || []).reduce((sum, sub) => sum + (sub.score || 0), 0) / totalAssignments)
            : 0;

          // Get unique organization IDs for this user
          const organizationIds = [...new Set(
            submissions
              ?.map(sub => {
                const assignment = Array.isArray(sub.interactive_assignment)
                  ? sub.interactive_assignment[0]
                  : sub.interactive_assignment;
                return assignment?.organization_id;
              })
              .filter(Boolean) || []
          )];

          // Fetch organization names
          let organizationNames: string[] = [];
          if (organizationIds.length > 0) {
            const { data: orgs } = await supabase
              .from('organization')
              .select('name')
              .in('id', organizationIds);
            organizationNames = orgs?.map(org => org.name) || [];
          }

          return {
            id: user.id,
            name: user.name,
            contactInfo: user.contact_info,
            createdAt: new Date(user.created_at).toLocaleDateString(),
            lastActiveAt: user.last_active_at ? new Date(user.last_active_at).toLocaleDateString() : undefined,
            totalAssignments,
            averageScore,
            organizationNames
          };
        })
      );

      setAnonymousUsers(usersWithStats);
      setCachedData(cacheKey, usersWithStats);
      setHasInitialized(true);
    } catch (err) {
      console.error('Error fetching anonymous users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load anonymous users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [supabase, isGlobalAdmin, userPermissions.isAdmin, userPermissions.isOwner, userPermissions.isLoading, shouldLoad, hasInitialized, shouldPauseApiCalls, getCachedData, setCachedData]);

  // Initial data fetch
  useEffect(() => {
    fetchAnonymousUsersOptimized();
  }, [fetchAnonymousUsersOptimized]);

  // Pull-to-refresh functionality
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchAnonymousUsersOptimized(true);
      toast.success('Data refreshed successfully!');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [fetchAnonymousUsersOptimized]);

  // Touch handlers for pull-to-refresh
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isPulling && window.scrollY === 0) {
      const touch = e.touches[0];
      const distance = Math.max(0, touch.clientY - 100); // Start from 100px from top
      setPullDistance(Math.min(distance, 100)); // Max 100px pull
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(() => {
    if (isPulling) {
      if (pullDistance > 60) { // Trigger refresh if pulled more than 60px
        handleRefresh();
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    }
  }, [isPulling, pullDistance, handleRefresh]);

  // Fetch activities for selected user
  const fetchUserActivities = useCallback(async (userId: string) => {
    if (!supabase || shouldPauseApiCalls) return;

    setActivitiesLoading(true);
    try {
      const { data: submissions, error: submissionsError } = await supabase
        .from('interactive_submission')
        .select(`
          id,
          assignment_id,
          status,
          score,
          started_at,
          submitted_at,
          interactive_assignment(
            title,
            category,
            topic,
            organization_id
          )
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      const selectedUserData = anonymousUsers.find(u => u.id === userId);
      const organizationIds = [...new Set(
        submissions
          ?.map(sub => {
            const assignment = Array.isArray(sub.interactive_assignment)
              ? sub.interactive_assignment[0]
              : sub.interactive_assignment;
            return assignment?.organization_id;
          })
          .filter(Boolean) || []
      )];

      const { data: organizations } = await supabase
        .from('organization')
        .select('id, name')
        .in('id', organizationIds);

      const orgMap = new Map(organizations?.map(org => [org.id, org.name]) || []);

      const activitiesWithDetails = await Promise.all(
        (submissions || []).map(async (submission) => {
          const { data: responses } = await supabase
            .from('interactive_response')
            .select('is_correct')
            .eq('submission_id', submission.id);

          const totalQuestions = responses?.length || 0;
          const correctAnswers = responses?.filter(r => r.is_correct === true).length || 0;

          const assignment = Array.isArray(submission.interactive_assignment)
            ? submission.interactive_assignment[0]
            : submission.interactive_assignment;

          const organizationName = orgMap.get(assignment?.organization_id) || 'Unknown Organization';

          return {
            userId,
            userName: selectedUserData?.name || 'Unknown User',
            assignmentId: submission.assignment_id,
            assignmentName: assignment?.title || 'Unknown Assignment',
            submissionId: submission.id,
            score: submission.score,
            completedAt: submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'Not completed',
            startedAt: submission.started_at ? new Date(submission.started_at).toLocaleString() : 'Unknown',
            status: submission.status,
            timeSpent: 0,
            attempts: 1,
            category: assignment?.category,
            topic: assignment?.topic,
            difficultyLevel: '',
            estimatedTimeMinutes: 0,
            totalQuestions,
            correctAnswers,
            organizationName,
            organizationId: assignment?.organization_id
          };
        })
      );

      setActivities(activitiesWithDetails);
    } catch (err) {
      console.error('Error fetching user activities:', err);
      toast.error('Failed to load user activity data');
    } finally {
      setActivitiesLoading(false);
    }
  }, [supabase, anonymousUsers, shouldPauseApiCalls]);

  // Handle user selection
  const handleUserSelect = useCallback((userId: string) => {
    setSelectedUser(userId);
    fetchUserActivities(userId);
  }, [fetchUserActivities]);

  // Certificate viewing
  const viewCertificate = async (activity: AnonymousActivity) => {
    if (!supabase) {
      toast.error('Database connection not available');
      return;
    }

    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('interactive_assignment')
        .select('organization_id, title')
        .eq('id', activity.assignmentId)
        .single();

      if (assignmentError) {
        console.error('Error fetching assignment data:', assignmentError);
        toast.error('Failed to load assignment data');
        return;
      }

      const submissionForCertificate = {
        id: activity.submissionId,
        userId: activity.userId,
        score: activity.score || 0,
        submittedAt: new Date(activity.completedAt),
        status: 'SUBMITTED' as const
      };

      setSelectedCertificateData({
        submission: submissionForCertificate,
        assignmentTitle: activity.assignmentName,
        assignmentOrganizationId: assignmentData?.organization_id,
        username: activity.userName
      });
      setShowCertificate(true);
    } catch (error) {
      console.error('Error preparing certificate data:', error);
      toast.error('Failed to prepare certificate');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen relative"
      style={{
        background: config.darkMode
          ? `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.1)} 0%, ${hexToRgba(config.secondaryColor, 0.05)} 100%)`
          : `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.05)} 0%, ${hexToRgba(config.secondaryColor, 0.02)} 100%)`
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {isPulling && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{
              opacity: pullDistance > 30 ? 1 : 0.5,
              y: Math.max(-50, pullDistance - 50),
              rotate: pullDistance > 60 ? 180 : 0
            }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg"
          >
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refresh indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white rounded-full px-4 py-2 shadow-lg"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm font-medium">Refreshing...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div
            className="rounded-2xl p-6 backdrop-blur-lg border shadow-xl"
            style={{
              background: config.darkMode
                ? `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.2)} 0%, ${hexToRgba(config.secondaryColor, 0.1)} 100%)`
                : `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.1)} 0%, ${hexToRgba(config.secondaryColor, 0.05)} 100%)`,
              borderColor: hexToRgba(config.accentColor, 0.2)
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Anonymous User Activity
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Monitor and analyze anonymous user engagement and performance
                </p>
                {isGlobalAdmin && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 mt-2">
                    Global Admin View
                  </span>
                )}
              </div>

              {/* View Mode Toggle - Mobile First */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg p-1 bg-white/20 backdrop-blur-sm">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === 'cards'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === 'table'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
              {error.includes('permission') && (
                <div className="mt-3 text-sm text-red-600">
                  <p>This page is restricted to:</p>
                  <ul className="list-disc list-inside mt-1 ml-4">
                    <li>Organization owners</li>
                    <li>Organization administrators</li>
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filter Controls - Mobile First */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <div
            className="rounded-xl p-4 backdrop-blur-lg border"
            style={{
              background: config.darkMode
                ? `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.15)} 0%, ${hexToRgba(config.secondaryColor, 0.08)} 100%)`
                : `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.08)} 0%, ${hexToRgba(config.secondaryColor, 0.04)} 100%)`,
              borderColor: hexToRgba(config.accentColor, 0.15)
            }}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search users by name or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Organization Filter */}
              <div className="sm:w-48">
                <select
                  value={filterOrg}
                  onChange={(e) => setFilterOrg(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                >
                  <option value="all">All Organizations</option>
                  {availableOrganizations.map(org => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div className="sm:w-40">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'score' | 'assignments' | 'date')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                >
                  <option value="date">Latest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="score">High Score</option>
                  <option value="assignments">Most Active</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchAnonymousUsersOptimized(true)}
                disabled={loading}
                className="px-4 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center min-w-[44px]"
                title="Refresh Data"
              >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Stats Summary */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredAndSortedUsers.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredAndSortedUsers.reduce((sum, user) => sum + user.totalAssignments, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredAndSortedUsers.length > 0
                    ? Math.round(filteredAndSortedUsers.reduce((sum, user) => sum + user.averageScore, 0) / filteredAndSortedUsers.length)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Avg Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {availableOrganizations.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Organizations</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading State with Skeletons */}
        {loading && anonymousUsers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Stats Skeleton */}
            <div
              className="rounded-xl p-4 backdrop-blur-lg border"
              style={{
                background: config.darkMode
                  ? `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.15)} 0%, ${hexToRgba(config.secondaryColor, 0.08)} 100%)`
                  : `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.08)} 0%, ${hexToRgba(config.secondaryColor, 0.04)} 100%)`,
                borderColor: hexToRgba(config.accentColor, 0.15)
              }}
            >
              <StatsSkeleton />
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <UserCardSkeleton key={index} />
                ))}
              </div>
              <div className="lg:col-span-2 space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <ActivityCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* No Data State */}
        {!loading && anonymousUsers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div
              className="rounded-xl p-8 backdrop-blur-lg border"
              style={{
                background: config.darkMode
                  ? `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.1)} 0%, ${hexToRgba(config.secondaryColor, 0.05)} 100%)`
                  : `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.05)} 0%, ${hexToRgba(config.secondaryColor, 0.02)} 100%)`,
                borderColor: hexToRgba(config.accentColor, 0.1)
              }}
            >
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Anonymous Users Found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                There are no anonymous users in the system yet. Users will appear here after they complete assignments.
              </p>
              <button
                onClick={() => fetchAnonymousUsersOptimized(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Refresh Data
              </button>
            </div>
          </motion.div>
        )}

        {/* Main Content - Mobile First Layout */}
        {!loading && filteredAndSortedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Users List - Mobile First Cards */}
            <div className="lg:col-span-1">
              <div
                className="rounded-xl p-4 backdrop-blur-lg border sticky top-4"
                style={{
                  background: config.darkMode
                    ? `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.15)} 0%, ${hexToRgba(config.secondaryColor, 0.08)} 100%)`
                    : `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.08)} 0%, ${hexToRgba(config.secondaryColor, 0.04)} 100%)`,
                  borderColor: hexToRgba(config.accentColor, 0.15)
                }}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Anonymous Users ({filteredAndSortedUsers.length})
                </h3>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  <AnimatePresence>
                    {filteredAndSortedUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        onClick={() => handleUserSelect(user.id)}
                        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedUser === user.id
                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-white/50 dark:hover:bg-white/5'
                        }`}
                        style={{
                          background: selectedUser === user.id
                            ? hexToRgba(config.primaryColor, 0.1)
                            : 'rgba(255, 255, 255, 0.3)',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {user.name}
                            </h4>
                            {user.contactInfo && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                                {user.contactInfo}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                {user.totalAssignments} assignments
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                user.averageScore >= 80
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : user.averageScore >= 60
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {user.averageScore}% avg
                              </span>
                            </div>
                            {user.organizationNames && user.organizationNames.length > 0 && (
                              <div className="mt-2">
                                <div className="flex flex-wrap gap-1">
                                  {user.organizationNames.slice(0, 2).map(org => (
                                    <span key={org} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      {org}
                                    </span>
                                  ))}
                                  {user.organizationNames.length > 2 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                      +{user.organizationNames.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Registered: {user.createdAt}
                            </p>
                          </div>

                          {selectedUser === user.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-2"
                            >
                              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Activities Panel - Mobile First */}
            <div className="lg:col-span-2">
              <div
                className="rounded-xl p-4 backdrop-blur-lg border"
                style={{
                  background: config.darkMode
                    ? `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.15)} 0%, ${hexToRgba(config.secondaryColor, 0.08)} 100%)`
                    : `linear-gradient(135deg, ${hexToRgba(config.primaryColor, 0.08)} 0%, ${hexToRgba(config.secondaryColor, 0.04)} 100%)`,
                  borderColor: hexToRgba(config.accentColor, 0.15)
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedUser ? `Activity History` : 'Select a User'}
                  </h3>
                  {selectedUser && (
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {activities.length} activities
                    </span>
                  )}
                </div>

                {!selectedUser ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Select a User to View Activities
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Choose a user from the list to see their assignment history and performance details.
                    </p>
                  </div>
                ) : activitiesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <ActivityCardSkeleton key={index} />
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No Activities Found
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      This user hasn't completed any assignments yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <AnimatePresence>
                      {activities.map((activity, index) => (
                        <motion.div
                          key={activity.submissionId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="p-4 rounded-lg"
                          style={{
                            background: 'rgba(255, 255, 255, 0.4)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${hexToRgba(config.accentColor, 0.1)}`
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {activity.assignmentName}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {activity.organizationName}
                              </p>
                              {activity.category && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {activity.category} • {activity.topic}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Completed: {activity.completedAt}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Score Badge */}
                              {activity.score !== undefined && activity.score !== null ? (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  activity.score >= 80
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : activity.score >= 60
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {activity.score}%
                                </span>
                              ) : activity.totalQuestions > 0 && activity.correctAnswers >= 0 ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {Math.round((activity.correctAnswers / activity.totalQuestions) * 100)}%
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">No Score</span>
                              )}

                              {/* Certificate Button */}
                              {activity.status === 'SUBMITTED' && (
                                <button
                                  onClick={() => viewCertificate(activity)}
                                  className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                                  title="View Certificate"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                  </svg>
                                  <span className="hidden sm:inline">Certificate</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Additional Details - Mobile Optimized */}
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <div>
                              <span className="font-medium">Questions:</span> {activity.totalQuestions}
                            </div>
                            <div>
                              <span className="font-medium">Correct:</span> {activity.correctAnswers}
                            </div>
                            <div>
                              <span className="font-medium">Started:</span> {new Date(activity.startedAt).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Status:</span> {activity.status}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Floating Action Button - Mobile Only */}
        {!loading && anonymousUsers.length > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-colors duration-200"
            style={{
              background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%)`,
              boxShadow: `0 8px 25px ${hexToRgba(config.primaryColor, 0.3)}`
            }}
          >
            <svg className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.button>
        )}

        {/* Certificate Viewer Modal */}
        <AnimatePresence>
          {showCertificate && selectedCertificateData && (
            <CertificateViewer
              submission={selectedCertificateData.submission}
              onClose={() => {
                setShowCertificate(false);
                setSelectedCertificateData(null);
              }}
              assignmentTitle={selectedCertificateData.assignmentTitle}
              assignmentOrganizationId={selectedCertificateData.assignmentOrganizationId}
              username={selectedCertificateData.username}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default EnhancedAnonymousUserActivity;
