// src/components/admin/AnonymousUserActivity.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import toast from 'react-hot-toast';

interface AnonymousUserData {
  id: string;
  name: string;
  contactInfo?: string;
  createdAt: string;
  lastActiveAt?: string;
  totalAssignments: number;
  averageScore: number;
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
}

interface DetailedResponse {
  id: string;
  questionId: string;
  questionText: string;
  questionType: string;
  responseData: any;
  isCorrect?: boolean;
  questionData: any;
}

interface AssignmentFilters {
  category: string | null;
  topic: string | null;
  difficulty: string | null;
  status: string | null;
  dateRange: string | null;
}

const AnonymousUserActivity = () => {
  const [anonymousUsers, setAnonymousUsers] = useState<AnonymousUserData[]>([]);
  const [activities, setActivities] = useState<AnonymousActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<AnonymousActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [detailedResponses, setDetailedResponses] = useState<DetailedResponse[]>([]);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [filters, setFilters] = useState<AssignmentFilters>({
    category: null,
    topic: null,
    difficulty: null,
    status: null,
    dateRange: null
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([]);
  const { user } = useSupabaseAuth();

  // Function to create sample anonymous users for testing
  const createSampleData = async () => {
    try {
      console.log('Creating sample anonymous users...');

      // Create sample anonymous users
      const sampleUsers = [
        { name: 'John Doe', contact_info: 'john@example.com' },
        { name: 'Jane Smith', contact_info: '555-1234' },
        { name: 'Bob Johnson', contact_info: 'bob@test.com' },
        { name: 'Alice Brown', contact_info: '555-5678' },
        { name: 'Charlie Wilson', contact_info: null }
      ];

      for (const userData of sampleUsers) {
        const { data, error } = await supabase
          .from('anonymous_user')
          .insert({
            name: userData.name,
            contact_info: userData.contact_info,
            created_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating user:', error);
        } else {
          console.log('Created user:', data);
        }
      }

      toast.success('Sample data created successfully!');
      // Refresh the data
      window.location.reload();
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast.error('Failed to create sample data');
    }
  };

  // Fetch anonymous users with enhanced data
  useEffect(() => {
    const fetchAnonymousUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching anonymous users...');

        // First, let's check if the table exists and get basic data
        const { data: users, error: usersError } = await supabase
          .from('anonymous_user')
          .select('*')
          .order('created_at', { ascending: false });

        console.log('Anonymous users query result:', { users, usersError });

        if (usersError) {
          console.error('Error fetching anonymous users:', usersError);
          throw usersError;
        }

        if (!users || users.length === 0) {
          console.log('No anonymous users found in database');
          setAnonymousUsers([]);
          return;
        }

        console.log(`Found ${users.length} anonymous users`);

        // Get submission statistics for each user
        const usersWithStats = await Promise.all(
          users.map(async (user) => {
            console.log(`Fetching submissions for user: ${user.name} (${user.id})`);

            const { data: submissions, error: submissionsError } = await supabase
              .from('interactive_submission')
              .select('score')
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

            return {
              id: user.id,
              name: user.name,
              contactInfo: user.contact_info,
              createdAt: new Date(user.created_at).toLocaleDateString(),
              lastActiveAt: user.last_active_at ? new Date(user.last_active_at).toLocaleDateString() : undefined,
              totalAssignments,
              averageScore
            };
          })
        );

        console.log('Users with stats:', usersWithStats);
        setAnonymousUsers(usersWithStats);
      } catch (err) {
        console.error('Error fetching anonymous users:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load anonymous users';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAnonymousUsers();
  }, []);

  // Fetch activities for a selected user with enhanced data
  useEffect(() => {
    const fetchUserActivities = async () => {
      if (!selectedUser) {
        setActivities([]);
        setFilteredActivities([]);
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
            created_at,
            updated_at,
            started_at,
            submitted_at,
            interactive_assignment(
              title,
              category,
              topic,
              difficulty_level,
              estimated_time_minutes
            )
          `)
          .eq('user_id', selectedUser)
          .order('created_at', { ascending: false });

        if (submissionsError) throw submissionsError;

        // Find the user's name
        const selectedUserData = anonymousUsers.find(u => u.id === selectedUser);

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

            return {
              userId: selectedUser,
              userName: selectedUserData?.name || 'Unknown User',
              assignmentId: submission.assignment_id,
              assignmentName: assignment?.title || 'Unknown Assignment',
              submissionId: submission.id,
              score: submission.score,
              completedAt: new Date(submission.updated_at).toLocaleString(),
              startedAt: new Date(submission.created_at).toLocaleString(),
              status: submission.status,
              timeSpent,
              attempts: 1, // For now, we'll assume 1 attempt per submission
              category: assignment?.category,
              topic: assignment?.topic,
              difficultyLevel: assignment?.difficulty_level,
              estimatedTimeMinutes: assignment?.estimated_time_minutes,
              totalQuestions,
              correctAnswers
            };
          })
        );

        setActivities(activitiesWithDetails);
        setFilteredActivities(activitiesWithDetails);

        // Extract unique filter values
        const categories = [...new Set(activitiesWithDetails.map(a => a.category).filter(Boolean))];
        const topics = [...new Set(activitiesWithDetails.map(a => a.topic).filter(Boolean))];
        const difficulties = [...new Set(activitiesWithDetails.map(a => a.difficultyLevel).filter(Boolean))];

        setAvailableCategories(categories);
        setAvailableTopics(topics);
        setAvailableDifficulties(difficulties);

      } catch (err) {
        console.error('Error fetching user activities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user activities');
        toast.error('Failed to load user activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivities();
  }, [selectedUser, anonymousUsers]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <span>Anonymous User Activity</span>
        {selectedUser && (
          <span className="ml-2 text-sm text-gray-500">
            ({anonymousUsers.find(u => u.id === selectedUser)?.name})
          </span>
        )}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map(activity => (
                    <tr key={activity.submissionId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{activity.assignmentName}</div>
                        <div className="text-xs text-gray-500">{activity.assignmentId}</div>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnonymousUserActivity;