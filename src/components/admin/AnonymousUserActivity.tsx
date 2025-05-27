// src/components/admin/AnonymousUserActivity.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useUserRole } from '../../hooks/useUserRole';
import { usePageVisibility } from '../../hooks/usePageVisibility';
import toast from 'react-hot-toast';
import CertificateViewer from '../certificates/CertificateViewer';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { hexToRgba } from '../../utils/colorUtils';

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
  organizationName?: string;
  organizationId?: string;
}

// Removed unused interfaces:
// - DetailedResponse: was declared but never used
// - AssignmentFilters: was declared but never used

interface AnonymousUserActivityProps {
  shouldLoad?: boolean;
}

const AnonymousUserActivity: React.FC<AnonymousUserActivityProps> = ({ shouldLoad = true }) => {
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
  const { user, supabase } = useSupabaseAuth();
  const { isAdmin, isOwner, isLoading: roleLoading } = useUserRole();
  const { config } = useConfiguration();
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedCertificateData, setSelectedCertificateData] = useState<any>(null);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [dataCache, setDataCache] = useState<Map<string, { data: any; timestamp: number }>>(new Map());

  // Page visibility for performance optimization
  const { shouldPauseApiCalls } = usePageVisibility({
    onVisible: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ AnonymousUserActivity: Page visible, resuming API calls');
      }
    },
    onHidden: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 AnonymousUserActivity: Page hidden, pausing API calls');
      }
    }
  });
  const [hasInitialized, setHasInitialized] = useState(false);

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

  // Check if user is a global admin (owner of any organization)
  useEffect(() => {
    const checkGlobalAdminStatus = async () => {
      if (!supabase || !user) {
        setIsGlobalAdmin(false);
        return;
      }

      try {
        // Check if user is owner of any organization
        const { data, error } = await supabase
          .from('user_organization')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'owner')
          .limit(1);

        if (error) {
          console.error('Error checking global admin status:', error);
          setIsGlobalAdmin(false);
          return;
        }

        setIsGlobalAdmin(data && data.length > 0);
      } catch (err) {
        console.error('Error in checkGlobalAdminStatus:', err);
        setIsGlobalAdmin(false);
      }
    };

    checkGlobalAdminStatus();
  }, [supabase, user]);

  // Function to view certificate for a submission
  const viewCertificate = async (activity: AnonymousActivity) => {
    if (!supabase) {
      toast.error('Database connection not available');
      return;
    }

    try {
      // Get assignment organization data
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

      // Create submission object for certificate
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
        username: activity.userName  // Pass the username directly
      });
      setShowCertificate(true);
    } catch (error) {
      console.error('Error preparing certificate data:', error);
      toast.error('Failed to prepare certificate');
    }
  };



  // Optimized fetch function with caching
  const fetchAnonymousUsersOptimized = useCallback(async (forceRefresh = false) => {
    if (!supabase || roleLoading || shouldPauseApiCalls) {
      return;
    }

    // Check cache first
    const cacheKey = 'anonymous_users_data';
    if (!forceRefresh) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setAnonymousUsers(cachedData);
        setLoading(false);
        return;
      }
    }

    // Check permissions
    if (!isGlobalAdmin && !isAdmin && !isOwner) {
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
        return;
      }

        // Get submission statistics for each user with organization information
        const usersWithStats = await Promise.all(
          users.map(async (user) => {
            console.log(`Fetching submissions for user: ${user.name} (${user.id})`);

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

            console.log(`User ${user.name} has ${submissions?.length || 0} submissions`);

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

        console.log('Users with stats:', usersWithStats);
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
  }, [supabase, isGlobalAdmin, isAdmin, isOwner, roleLoading, shouldLoad, hasInitialized, getCachedData, setCachedData]);

  // Effect to fetch anonymous users
  useEffect(() => {
    if (shouldLoad && !hasInitialized) {
      fetchAnonymousUsersOptimized();
    }
  }, [shouldLoad, hasInitialized, fetchAnonymousUsersOptimized]);

  // Fetch activities for a selected user with enhanced data
  useEffect(() => {
    const fetchUserActivities = async () => {
      if (!selectedUser || !supabase) {
        setActivities([]);
        return;
      }

      setLoading(true);
      try {
        // Get submissions for the selected user with detailed assignment data
        const { data: submissions, error: submissionsError } = await supabase
          .from('interactive_submission')
          .select(`
            id,
            assignment_id,
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
              organization_id
            )
          `)
          .eq('user_id', selectedUser)
          .order('started_at', { ascending: false });

        if (submissionsError) throw submissionsError;

        // Find the user's name
        const selectedUserData = anonymousUsers.find(u => u.id === selectedUser);

        // Get organization information for all assignments
        const organizationIds = [...new Set(
          submissions
            .map(sub => {
              const assignment = Array.isArray(sub.interactive_assignment)
                ? sub.interactive_assignment[0]
                : sub.interactive_assignment;
              return assignment?.organization_id;
            })
            .filter(Boolean)
        )];

        // Fetch organization data
        const { data: organizations } = await supabase
          .from('organization')
          .select('id, name')
          .in('id', organizationIds);

        const orgMap = new Map(organizations?.map(org => [org.id, org.name]) || []);

        // Get detailed data for each submission
        const activitiesWithDetails = await Promise.all(
          (submissions || []).map(async (submission) => {
            // Get question count and correct answers
            const { data: responses, error: responsesError } = await supabase
              .from('interactive_response')
              .select('is_correct')
              .eq('submission_id', submission.id);

            if (responsesError) {
              console.error('Error fetching responses:', responsesError);
            }

            const totalQuestions = responses?.length || 0;
            const correctAnswers = responses?.filter(r => r.is_correct === true).length || 0;

            // Calculate time spent
            const timeSpent = submission.started_at && submission.submitted_at
              ? Math.round((new Date(submission.submitted_at).getTime() - new Date(submission.started_at).getTime()) / 1000 / 60) // in minutes
              : undefined;

            const assignment = Array.isArray(submission.interactive_assignment)
              ? submission.interactive_assignment[0]
              : submission.interactive_assignment;

            const organizationName = orgMap.get(assignment?.organization_id) || 'Unknown Organization';

            return {
              userId: selectedUser,
              userName: selectedUserData?.name || 'Unknown User',
              assignmentId: submission.assignment_id,
              assignmentName: assignment?.title || 'Unknown Assignment',
              submissionId: submission.id,
              score: submission.score,
              completedAt: submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'Not completed',
              startedAt: submission.started_at ? new Date(submission.started_at).toLocaleString() : 'Unknown',
              status: submission.status,
              timeSpent,
              attempts: 1, // For now, we'll assume 1 attempt per submission
              category: assignment?.category,
              topic: assignment?.topic,
              difficultyLevel: assignment?.difficulty_level,
              estimatedTimeMinutes: assignment?.estimated_time_minutes,
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
        setError(err instanceof Error ? err.message : 'Failed to load user activities');
        toast.error('Failed to load user activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivities();
  }, [selectedUser, anonymousUsers, supabase]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <span>Anonymous User Activity</span>
        {isGlobalAdmin && (
          <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
            Global Admin View
          </span>
        )}
        {selectedUser && (
          <span className="ml-2 text-sm text-gray-500">
            ({anonymousUsers.find(u => u.id === selectedUser)?.name})
          </span>
        )}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          {error.includes('permission') && (
            <div className="mt-2 text-sm">
              <p>This page is restricted to:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Organization owners</li>
                <li>Organization administrators</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold mb-2">Anonymous Users</h3>
            <p className="text-sm text-gray-600">Select a user to view their assignment history</p>
          </div>

          {loading && anonymousUsers.length === 0 ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : anonymousUsers.length === 0 ? (
            <div className="text-gray-500 py-4">No anonymous users found</div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-white">
              <ul className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
                {anonymousUsers.map(user => (
                  <li
                    key={user.id}
                    className={`cursor-pointer hover:bg-gray-50 p-4 transition-colors ${selectedUser === user.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    onClick={() => setSelectedUser(user.id)}
                  >
                    <div className="font-medium text-gray-900">{user.name}</div>
                    {user.contactInfo && (
                      <div className="text-sm text-gray-600 mt-1">{user.contactInfo}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">Registered: {user.createdAt}</div>
                    {user.organizationNames && user.organizationNames.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        Organizations: {user.organizationNames.join(', ')}
                      </div>
                    )}
                    <div className="text-xs text-green-600 mt-1">
                      {user.totalAssignments} assignments • {user.averageScore}% avg score
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold mb-2">Assignment History</h3>
            <p className="text-sm text-gray-600">
              {selectedUser ? 'Viewing completed assignments and scores' : 'Select a user to view their assignments'}
            </p>
          </div>

          {!selectedUser ? (
            <div className="text-gray-500 py-4 text-center bg-gray-50 rounded-lg">Select a user to view their activity</div>
          ) : loading && activities.length === 0 ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-gray-500 py-4 text-center bg-gray-50 rounded-lg">No activity found for selected user</div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map(activity => (
                    <tr key={activity.submissionId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{activity.assignmentName}</div>
                        <div className="text-xs text-gray-500">{activity.assignmentId}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{activity.organizationName}</div>
                        {activity.category && (
                          <div className="text-xs text-gray-500">{activity.category} • {activity.topic}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {activity.completedAt}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {activity.score !== undefined && activity.score !== null ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            activity.score >= 80 ? 'bg-green-100 text-green-800' :
                            activity.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {activity.score}%
                          </span>
                        ) : activity.totalQuestions > 0 && activity.correctAnswers >= 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {Math.round((activity.correctAnswers / activity.totalQuestions) * 100)}% (calc)
                          </span>
                        ) : (
                          <span className="text-gray-400">No Score</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {activity.status === 'SUBMITTED' ? (
                          <button
                            onClick={() => viewCertificate(activity)}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                            title="View Certificate"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            View
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">Not Available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Certificate Viewer Modal */}
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
    </div>
  );
};

export default AnonymousUserActivity;