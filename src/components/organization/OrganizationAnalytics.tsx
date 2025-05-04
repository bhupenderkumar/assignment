// src/components/organization/OrganizationAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { Organization } from '../../types/organization';
import toast from 'react-hot-toast';

interface OrganizationAnalyticsProps {
  organization: Organization;
}

interface AnalyticsData {
  totalUsers: number;
  totalAssignments: number;
  totalSubmissions: number;
  averageScore: number;
  completionRate: number;
  usersByRole: {
    owner: number;
    admin: number;
    member: number;
  };
  recentActivity: {
    date: string;
    action: string;
    user: string;
  }[];
}

const OrganizationAnalytics: React.FC<OrganizationAnalyticsProps> = ({ organization }) => {
  const { supabase } = useSupabaseAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!supabase) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get total users in organization
        const { data: users, error: usersError } = await supabase
          .from('user_organization')
          .select('role')
          .eq('organization_id', organization.id);
          
        if (usersError) throw usersError;
        
        // Get total assignments in organization
        const { data: assignments, error: assignmentsError } = await supabase
          .from('interactive_assignment')
          .select('id')
          .eq('organization_id', organization.id);
          
        if (assignmentsError) throw assignmentsError;
        
        // Get assignment IDs for submissions query
        const assignmentIds = assignments?.map(a => a.id) || [];
        
        // Get total submissions for organization's assignments
        let submissions = [];
        let averageScore = 0;
        let completionRate = 0;
        
        if (assignmentIds.length > 0) {
          const { data: subs, error: subsError } = await supabase
            .from('interactive_submission')
            .select('id, score, status')
            .in('assignment_id', assignmentIds);
            
          if (subsError) throw subsError;
          
          submissions = subs || [];
          
          // Calculate average score
          const scores = submissions.filter(s => s.score !== null).map(s => s.score);
          averageScore = scores.length > 0 
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
            : 0;
            
          // Calculate completion rate
          const completed = submissions.filter(s => s.status === 'SUBMITTED').length;
          completionRate = submissions.length > 0 
            ? (completed / submissions.length) * 100 
            : 0;
        }
        
        // Count users by role
        const usersByRole = {
          owner: users?.filter(u => u.role === 'owner').length || 0,
          admin: users?.filter(u => u.role === 'admin').length || 0,
          member: users?.filter(u => u.role === 'member').length || 0
        };
        
        // For demo purposes, generate some recent activity
        const recentActivity = [
          {
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            action: 'Created assignment',
            user: 'John Doe'
          },
          {
            date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
            action: 'Completed assignment',
            user: 'Jane Smith'
          },
          {
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            action: 'Joined organization',
            user: 'Bob Johnson'
          }
        ];
        
        // Set analytics data
        setAnalytics({
          totalUsers: users?.length || 0,
          totalAssignments: assignments?.length || 0,
          totalSubmissions: submissions.length,
          averageScore,
          completionRate,
          usersByRole,
          recentActivity
        });
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load organization analytics');
        toast.error('Failed to load organization analytics');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [supabase, organization.id]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Organization Analytics
      </h3>
      
      {analytics && (
        <div className="space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 uppercase">Users</h4>
              <div className="mt-2 flex justify-between items-end">
                <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{analytics.totalUsers}</p>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  <div>Owners: {analytics.usersByRole.owner}</div>
                  <div>Admins: {analytics.usersByRole.admin}</div>
                  <div>Members: {analytics.usersByRole.member}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-700 dark:text-green-300 uppercase">Assignments</h4>
              <div className="mt-2 flex justify-between items-end">
                <p className="text-3xl font-bold text-green-800 dark:text-green-200">{analytics.totalAssignments}</p>
                <div className="text-xs text-green-600 dark:text-green-400">
                  <div>Submissions: {analytics.totalSubmissions}</div>
                  <div>Completion: {analytics.completionRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 uppercase">Performance</h4>
              <div className="mt-2 flex justify-between items-end">
                <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">{analytics.averageScore.toFixed(1)}%</p>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  <div>Average Score</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent activity */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase mb-2">Recent Activity</h4>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {analytics.recentActivity.map((activity, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(activity.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {activity.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {activity.user}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationAnalytics;
