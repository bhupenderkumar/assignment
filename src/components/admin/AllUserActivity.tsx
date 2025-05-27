// src/components/admin/AllUserActivity.tsx
import { useState, useEffect, useRef } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useUserRole } from '../../hooks/useUserRole';
import { usePageVisibility } from '../../hooks/usePageVisibility';
import toast from 'react-hot-toast';
import CertificateViewer from '../certificates/CertificateViewer';

interface UserActivityData {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userType: 'authenticated' | 'anonymous';
  contactInfo?: string;
  assignmentId: string;
  assignmentName: string;
  submissionId?: string;
  score?: number;
  completedAt?: string;
  startedAt: string;
  status: string;
  timeSpent?: number;
  attempts?: number;
  category?: string;
  topic?: string;
  difficultyLevel?: string;
  estimatedTimeMinutes?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  organizationName?: string;
  organizationId?: string;
  activityType?: string;
  activityDescription?: string;
  pageUrl?: string;
  component?: string;
}

interface ActivityFilters {
  userType: 'all' | 'authenticated' | 'anonymous';
  organization: string;
  timeRange: '24h' | '7d' | '30d' | 'all';
  status: 'all' | 'completed' | 'in_progress' | 'abandoned';
  searchTerm: string;
}

interface AllUserActivityProps {
  shouldLoad?: boolean;
}

const AllUserActivity: React.FC<AllUserActivityProps> = ({ shouldLoad = true }) => {
  const { supabase, user } = useSupabaseAuth();
  const { isAdmin } = useUserRole();
  const [activities, setActivities] = useState<UserActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<UserActivityData | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [filters, setFilters] = useState<ActivityFilters>({
    userType: 'all',
    organization: 'all',
    timeRange: '7d',
    status: 'all',
    searchTerm: ''
  });
  const [organizations, setOrganizations] = useState<Array<{id: string, name: string}>>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Ref to track previous filters to prevent unnecessary re-renders
  const prevFiltersRef = useRef<ActivityFilters>(filters);

  // Cache for activities data to prevent repeated API calls
  const activitiesCache = useRef<{
    data: UserActivityData[];
    timestamp: number;
    filters: ActivityFilters;
  } | null>(null);

  // Cache expiration time (2 minutes for activity data)
  const CACHE_EXPIRATION = 2 * 60 * 1000;

  // Use page visibility to prevent API calls when page is not visible
  const { shouldPauseApiCalls } = usePageVisibility({
    onHidden: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 AllUserActivity: Page hidden, pausing API calls');
      }
    },
    onVisible: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ AllUserActivity: Page visible, resuming API calls');
      }
    }
  });

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      return;
    }

    // Don't make API calls if page is not visible
    if (shouldPauseApiCalls) {
      if (process.env.NODE_ENV === 'development') {
        console.log('AllUserActivity: Page not visible, skipping fetch');
      }
      return;
    }

    // Only load data if shouldLoad is true and we haven't initialized yet
    if (shouldLoad && !hasInitialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('AllUserActivity: Loading data for the first time');
      }
      fetchActivities();
      fetchOrganizations();
      setHasInitialized(true);
    } else if (shouldLoad && hasInitialized && JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current)) {
      // If already initialized, only refetch when filters actually change
      if (process.env.NODE_ENV === 'development') {
        console.log('AllUserActivity: Refetching due to filter changes');
      }
      fetchActivities();
      prevFiltersRef.current = filters;
    }
  }, [isAdmin, shouldLoad, hasInitialized, shouldPauseApiCalls]); // Added shouldPauseApiCalls to dependencies

  const fetchOrganizations = async () => {
    if (!supabase) return;

    // Don't make API calls if page is not visible
    if (shouldPauseApiCalls) {
      if (process.env.NODE_ENV === 'development') {
        console.log('AllUserActivity: Page not visible, skipping fetchOrganizations');
      }
      return;
    }

    try {
      const { data: orgs, error } = await supabase
        .from('organization')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching organizations:', error);
        return;
      }

      setOrganizations(orgs || []);
    } catch (error) {
      console.error('Error in fetchOrganizations:', error);
    }
  };

  const fetchActivities = async () => {
    if (!supabase || !user) return;

    // Don't make API calls if page is not visible
    if (shouldPauseApiCalls) {
      if (process.env.NODE_ENV === 'development') {
        console.log('AllUserActivity: Page not visible, skipping fetchActivities');
      }
      return;
    }

    // Check if we have cached data that's still valid
    const cache = activitiesCache.current;
    const now = Date.now();

    if (cache &&
        (now - cache.timestamp < CACHE_EXPIRATION) &&
        JSON.stringify(cache.filters) === JSON.stringify(filters)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('AllUserActivity: Using cached data');
      }
      setActivities(cache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const activities: UserActivityData[] = [];

      // Calculate date filter
      let dateFilter = '';
      const nowDate = new Date();
      switch (filters.timeRange) {
        case '24h':
          dateFilter = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000).toISOString();
          break;
        case '7d':
          dateFilter = new Date(nowDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '30d':
          dateFilter = new Date(nowDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          dateFilter = '';
      }

      // Fetch anonymous user submissions
      if (filters.userType === 'all' || filters.userType === 'anonymous') {
        await fetchAnonymousUserActivities(activities, dateFilter);
      }

      // Fetch authenticated user submissions
      if (filters.userType === 'all' || filters.userType === 'authenticated') {
        await fetchAuthenticatedUserActivities(activities, dateFilter);
      }

      // Apply additional filters
      let filteredActivities = activities;

      if (filters.organization !== 'all') {
        filteredActivities = filteredActivities.filter(activity =>
          activity.organizationId === filters.organization
        );
      }

      if (filters.status !== 'all') {
        filteredActivities = filteredActivities.filter(activity => {
          const status = activity.status?.toLowerCase();
          switch (filters.status) {
            case 'completed':
              return status === 'completed' || status === 'submitted';
            case 'in_progress':
              return status === 'in_progress' || status === 'pending';
            case 'abandoned':
              return status === 'abandoned';
            default:
              return true;
          }
        });
      }

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredActivities = filteredActivities.filter(activity =>
          activity.userName?.toLowerCase().includes(searchLower) ||
          activity.userEmail?.toLowerCase().includes(searchLower) ||
          activity.assignmentName?.toLowerCase().includes(searchLower) ||
          activity.organizationName?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by most recent activity
      filteredActivities.sort((a, b) =>
        new Date(b.startedAt || b.completedAt || '').getTime() -
        new Date(a.startedAt || a.completedAt || '').getTime()
      );

      // Update cache with new data
      activitiesCache.current = {
        data: filteredActivities,
        timestamp: now,
        filters: { ...filters }
      };

      setActivities(filteredActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load user activities');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnonymousUserActivities = async (activities: UserActivityData[], dateFilter: string) => {
    if (!supabase) return;

    try {
      // Build query for anonymous user submissions
      let query = supabase
        .from('interactive_submission')
        .select(`
          id,
          assignment_id,
          user_id,
          status,
          score,
          started_at,
          submitted_at,
          feedback,
          interactive_assignment(
            title,
            category,
            topic,
            difficulty_level,
            estimated_time_minutes,
            organization_id,
            organization(name)
          )
        `)
        .not('user_id', 'is', null);

      if (dateFilter) {
        query = query.gte('started_at', dateFilter);
      }

      const { data: submissions, error: submissionsError } = await query
        .order('started_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching anonymous submissions:', submissionsError);
        return;
      }

      // Get anonymous user details
      const userIds = [...new Set(submissions?.map(s => s.user_id).filter(Boolean))];
      let anonymousUsers: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('anonymous_user')
          .select('id, name, contact_info, created_at')
          .in('id', userIds);

        if (!usersError && users) {
          anonymousUsers = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Transform anonymous submissions to activities
      submissions?.forEach(submission => {
        const user = anonymousUsers[submission.user_id];
        const assignment = Array.isArray(submission.interactive_assignment)
          ? submission.interactive_assignment[0]
          : submission.interactive_assignment;

        activities.push({
          id: `anonymous-${submission.id}`,
          userId: submission.user_id,
          userName: user?.name || 'Unknown User',
          userType: 'anonymous',
          contactInfo: user?.contact_info,
          assignmentId: submission.assignment_id,
          assignmentName: assignment?.title || 'Unknown Assignment',
          submissionId: submission.id,
          score: submission.score,
          completedAt: submission.submitted_at,
          startedAt: submission.started_at,
          status: submission.status || 'unknown',
          category: assignment?.category,
          topic: assignment?.topic,
          difficultyLevel: assignment?.difficulty_level,
          estimatedTimeMinutes: assignment?.estimated_time_minutes,
          organizationName: Array.isArray(assignment?.organization)
            ? assignment?.organization[0]?.name
            : (assignment?.organization as any)?.name,
          organizationId: assignment?.organization_id,
          activityType: 'assignment_submission',
          activityDescription: `Submitted assignment: ${assignment?.title || 'Unknown'}`
        });
      });
    } catch (error) {
      console.error('Error fetching anonymous user activities:', error);
    }
  };

  const fetchAuthenticatedUserActivities = async (activities: UserActivityData[], dateFilter: string) => {
    if (!supabase) return;

    try {
      // Fetch authenticated user submissions
      let submissionQuery = supabase
        .from('interactive_submission')
        .select(`
          id,
          assignment_id,
          user_id,
          status,
          score,
          started_at,
          submitted_at,
          feedback,
          interactive_assignment(
            title,
            category,
            topic,
            difficulty_level,
            estimated_time_minutes,
            organization_id,
            organization(name)
          )
        `);

      if (dateFilter) {
        submissionQuery = submissionQuery.gte('started_at', dateFilter);
      }

      const { data: submissions, error: submissionsError } = await submissionQuery
        .order('started_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching authenticated submissions:', submissionsError);
        return;
      }

      // Get authenticated user details
      const userIds = [...new Set(submissions?.map(s => s.user_id).filter(Boolean))];
      let authenticatedUsers: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, raw_user_meta_data')
          .in('id', userIds);

        if (!usersError && users) {
          authenticatedUsers = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Filter out anonymous users (those that exist in anonymous_user table)
      const anonymousUserIds = new Set();
      if (userIds.length > 0) {
        const { data: anonUsers } = await supabase
          .from('anonymous_user')
          .select('id')
          .in('id', userIds);

        anonUsers?.forEach(user => anonymousUserIds.add(user.id));
      }

      // Transform authenticated submissions to activities
      submissions?.forEach(submission => {
        // Skip if this is actually an anonymous user
        if (anonymousUserIds.has(submission.user_id)) return;

        const user = authenticatedUsers[submission.user_id];
        const assignment = Array.isArray(submission.interactive_assignment)
          ? submission.interactive_assignment[0]
          : submission.interactive_assignment;

        activities.push({
          id: `authenticated-${submission.id}`,
          userId: submission.user_id,
          userName: user?.raw_user_meta_data?.full_name || user?.email?.split('@')[0] || 'Unknown User',
          userEmail: user?.email,
          userType: 'authenticated',
          assignmentId: submission.assignment_id,
          assignmentName: assignment?.title || 'Unknown Assignment',
          submissionId: submission.id,
          score: submission.score,
          completedAt: submission.submitted_at,
          startedAt: submission.started_at,
          status: submission.status || 'unknown',
          category: assignment?.category,
          topic: assignment?.topic,
          difficultyLevel: assignment?.difficulty_level,
          estimatedTimeMinutes: assignment?.estimated_time_minutes,
          organizationName: Array.isArray(assignment?.organization)
            ? assignment?.organization[0]?.name
            : (assignment?.organization as any)?.name,
          organizationId: assignment?.organization_id,
          activityType: 'assignment_submission',
          activityDescription: `Submitted assignment: ${assignment?.title || 'Unknown'}`
        });
      });

      // Also fetch user activity logs for authenticated users
      await fetchUserActivityLogs(activities, dateFilter, authenticatedUsers);

    } catch (error) {
      console.error('Error fetching authenticated user activities:', error);
    }
  };

  const fetchUserActivityLogs = async (activities: UserActivityData[], dateFilter: string, authenticatedUsers: Record<string, any>) => {
    if (!supabase) return;

    try {
      let activityQuery = supabase
        .from('user_activity_log')
        .select('*');

      if (dateFilter) {
        activityQuery = activityQuery.gte('timestamp', dateFilter);
      }

      const { data: activityLogs, error: activityError } = await activityQuery
        .order('timestamp', { ascending: false });

      if (activityError) {
        console.error('Error fetching activity logs:', activityError);
        return;
      }

      // Transform activity logs to activities
      activityLogs?.forEach(log => {
        const user = authenticatedUsers[log.user_id];

        activities.push({
          id: `activity-${log.id}`,
          userId: log.user_id,
          userName: user?.raw_user_meta_data?.full_name || user?.email?.split('@')[0] || 'Unknown User',
          userEmail: user?.email,
          userType: 'authenticated',
          assignmentId: log.metadata?.assignment_id || '',
          assignmentName: log.metadata?.assignment_title || 'System Activity',
          startedAt: log.timestamp,
          status: 'activity',
          activityType: log.activity_type,
          activityDescription: log.activity_description,
          pageUrl: log.page_url,
          component: log.component,
          organizationId: log.metadata?.organization_id
        });
      });
    } catch (error) {
      console.error('Error fetching user activity logs:', error);
    }
  };

  const handleViewCertificate = (activity: UserActivityData) => {
    if (activity.submissionId && activity.score !== null && activity.score !== undefined) {
      setSelectedActivity(activity);
      setShowCertificate(true);
    } else {
      toast.error('No certificate available for this activity');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvContent = generateCSV(activities);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `all-user-activity-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Activity data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (data: UserActivityData[]): string => {
    const headers = [
      'User Type',
      'User Name',
      'User Email',
      'Contact Info',
      'Assignment Name',
      'Organization',
      'Activity Type',
      'Activity Description',
      'Status',
      'Score',
      'Started At',
      'Completed At',
      'Time Spent (min)',
      'Category',
      'Topic',
      'Difficulty',
      'Page URL',
      'Component'
    ];

    const csvRows = [
      headers.join(','),
      ...data.map(activity => [
        activity.userType,
        `"${activity.userName || ''}"`,
        `"${activity.userEmail || ''}"`,
        `"${activity.contactInfo || ''}"`,
        `"${activity.assignmentName || ''}"`,
        `"${activity.organizationName || ''}"`,
        `"${activity.activityType || ''}"`,
        `"${activity.activityDescription || ''}"`,
        activity.status,
        activity.score || '',
        activity.startedAt || '',
        activity.completedAt || '',
        activity.timeSpent ? Math.round(activity.timeSpent / 60) : '',
        `"${activity.category || ''}"`,
        `"${activity.topic || ''}"`,
        `"${activity.difficultyLevel || ''}"`,
        `"${activity.pageUrl || ''}"`,
        `"${activity.component || ''}"`
      ].join(','))
    ];

    return csvRows.join('\n');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatScore = (score?: number) => {
    if (score === null || score === undefined) return 'N/A';
    return `${score}%`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'abandoned':
        return 'bg-red-100 text-red-800';
      case 'activity':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case 'authenticated':
        return 'bg-blue-100 text-blue-800';
      case 'anonymous':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All User Activity</h2>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive view of all user activities including authenticated and anonymous users
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleExport}
            disabled={isExporting || activities.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* User Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Type
            </label>
            <select
              value={filters.userType}
              onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Users</option>
              <option value="authenticated">Authenticated</option>
              <option value="anonymous">Anonymous</option>
            </select>
          </div>

          {/* Organization Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization
            </label>
            <select
              value={filters.organization}
              onChange={(e) => setFilters(prev => ({ ...prev, organization: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Range
            </label>
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search users, assignments..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Activities</p>
              <p className="text-2xl font-semibold text-gray-900">{activities.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activities.filter(a => a.status?.toLowerCase() === 'completed' || a.status?.toLowerCase() === 'submitted').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">🔐</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Authenticated</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activities.filter(a => a.userType === 'authenticated').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold">👤</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Anonymous</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activities.filter(a => a.userType === 'anonymous').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-500">Loading activities...</span>
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activities found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No user activities match the current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeBadgeColor(activity.userType)}`}>
                            {activity.userType === 'authenticated' ? '🔐' : '👤'} {activity.userType}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {activity.userName}
                          </div>
                          {activity.userEmail && (
                            <div className="text-sm text-gray-500">
                              {activity.userEmail}
                            </div>
                          )}
                          {activity.contactInfo && (
                            <div className="text-sm text-gray-500">
                              {activity.contactInfo}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {activity.assignmentName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {activity.activityDescription || activity.activityType}
                      </div>
                      {activity.category && (
                        <div className="text-xs text-gray-400">
                          {activity.category} • {activity.topic} • {activity.difficultyLevel}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {activity.organizationName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatScore(activity.score)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(activity.completedAt || activity.startedAt)}
                      </div>
                      {activity.completedAt && activity.startedAt && (
                        <div className="text-xs text-gray-500">
                          Started: {formatDate(activity.startedAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {activity.submissionId && activity.score !== null && activity.score !== undefined && (
                          <button
                            onClick={() => handleViewCertificate(activity)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Certificate"
                          >
                            📜
                          </button>
                        )}
                        {activity.pageUrl && (
                          <a
                            href={activity.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900"
                            title="View Page"
                          >
                            🔗
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {showCertificate && selectedActivity && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Certificate - {selectedActivity.assignmentName}
              </h3>
              <button
                onClick={() => setShowCertificate(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CertificateViewer
              submission={{
                id: selectedActivity.submissionId!,
                assignmentId: selectedActivity.assignmentId,
                userId: selectedActivity.userId,
                status: 'SUBMITTED' as const,
                startedAt: new Date(selectedActivity.startedAt || ''),
                submittedAt: selectedActivity.completedAt ? new Date(selectedActivity.completedAt) : undefined,
                score: selectedActivity.score || 0
              }}
              onClose={() => setShowCertificate(false)}
              assignmentTitle={selectedActivity.assignmentName}
              assignmentOrganizationId={selectedActivity.organizationId}
              username={selectedActivity.userName}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUserActivity;