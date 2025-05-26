// src/components/admin/UserProgressDashboard.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { exportToCSV, exportToJSON, exportToExcel, exportSummaryReport } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

interface UserProgressData {
  userId: string;
  userName: string;
  userContactInfo?: string;
  assignmentId: string;
  assignmentTitle: string;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  timeSpent: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  questionsAnswered: number;
  totalQuestions: number;
  accuracy: number;
  organizationId: string;
}

interface ProgressMetrics {
  totalUsers: number;
  activeUsers: number;
  completedAssignments: number;
  averageScore: number;
  averageTimeSpent: number;
  completionRate: number;
}

const UserProgressDashboard: React.FC = () => {
  const { supabase, user } = useSupabaseAuth();
  const { fetchUserProgress } = useInteractiveAssignment();
  const [progressData, setProgressData] = useState<UserProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Memoized metrics calculation for performance
  const metrics = useMemo((): ProgressMetrics => {
    if (progressData.length === 0) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        completedAssignments: 0,
        averageScore: 0,
        averageTimeSpent: 0,
        completionRate: 0,
      };
    }

    const uniqueUsers = new Set(progressData.map(p => p.userId)).size;
    const activeUsers = progressData.filter(p => p.status === 'IN_PROGRESS').length;
    const completedAssignments = progressData.filter(p => p.status === 'COMPLETED').length;
    const scoresWithValues = progressData.filter(p => p.score !== undefined && p.score !== null);
    const averageScore = scoresWithValues.length > 0
      ? Math.round(scoresWithValues.reduce((sum, p) => sum + (p.score || 0), 0) / scoresWithValues.length)
      : 0;
    const averageTimeSpent = progressData.length > 0
      ? Math.round(progressData.reduce((sum, p) => sum + p.timeSpent, 0) / progressData.length)
      : 0;
    const completionRate = progressData.length > 0
      ? Math.round((completedAssignments / progressData.length) * 100)
      : 0;

    return {
      totalUsers: uniqueUsers,
      activeUsers,
      completedAssignments,
      averageScore,
      averageTimeSpent,
      completionRate,
    };
  }, [progressData]);

  useEffect(() => {
    fetchProgressData();
  }, [selectedTimeRange, selectedOrganization]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchProgressData = async () => {
    if (!supabase || !user) return;

    setLoading(true);
    try {
      // Calculate date filter based on selected time range
      let dateFilter = '';
      const now = new Date();
      switch (selectedTimeRange) {
        case '24h':
          dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          break;
        case '7d':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '30d':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          dateFilter = '';
      }

      // Build query with filters - Fix the relationship issue
      let query = supabase
        .from('user_progress')
        .select(`
          *,
          interactive_assignment!assignment_id(
            title,
            organization_id
          )
        `);

      if (dateFilter) {
        query = query.gte('started_at', dateFilter);
      }

      if (selectedOrganization !== 'all') {
        query = query.eq('interactive_assignment.organization_id', selectedOrganization);
      }

      const { data: progressData, error } = await query.order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching progress data:', error);
        toast.error('Failed to load progress data');
        return;
      }

      // Fetch user names and contact info separately since there's no direct relationship
      const userIds = [...new Set(progressData?.map(item => item.user_id).filter(Boolean))];
      let userNames: Record<string, string> = {};
      let userContactInfo: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('anonymous_user')
          .select('id, name, contact_info')
          .in('id', userIds);

        if (!usersError && users) {
          userNames = users.reduce((acc, user) => {
            acc[user.id] = user.name;
            return acc;
          }, {} as Record<string, string>);

          userContactInfo = users.reduce((acc, user) => {
            acc[user.id] = user.contact_info || '';
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Fetch question counts for assignments
      const assignmentIds = [...new Set(progressData?.map(item => item.assignment_id).filter(Boolean))];
      let questionCounts: Record<string, number> = {};

      if (assignmentIds.length > 0) {
        const { data: assignments, error: assignmentsError } = await supabase
          .from('interactive_assignment')
          .select(`
            id,
            questions:interactive_question(count)
          `)
          .in('id', assignmentIds);

        if (!assignmentsError && assignments) {
          questionCounts = assignments.reduce((acc, assignment) => {
            acc[assignment.id] = assignment.questions?.length || 0;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      // Transform data for display with enhanced logging
      const transformedData: UserProgressData[] = (progressData || []).map((item: any) => {
        const transformed = {
          userId: item.user_id,
          userName: userNames[item.user_id] || 'Unknown User',
          userContactInfo: userContactInfo[item.user_id] || '',
          assignmentId: item.assignment_id,
          assignmentTitle: item.interactive_assignment?.title || 'Unknown Assignment',
          startedAt: new Date(item.started_at),
          completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
          score: item.score !== null && item.score !== undefined ? item.score : 0,
          timeSpent: item.time_spent || 0,
          status: item.status,
          questionsAnswered: item.questions_answered || 0,
          totalQuestions: questionCounts[item.assignment_id] || 0,
          accuracy: item.score !== null && item.score !== undefined ? item.score : 0,
          organizationId: item.interactive_assignment?.organization_id || '',
        };

        // Debug logging for progress data
        console.log('📊 UserProgressDashboard: Transformed progress item:', {
          original: item,
          transformed,
          userName: userNames[item.user_id],
          userContactInfo: userContactInfo[item.user_id],
          questionCount: questionCounts[item.assignment_id]
        });

        return transformed;
      });

      setProgressData(transformedData);
    } catch (error) {
      console.error('Error in fetchProgressData:', error);
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  // Export functions
  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = [
        'User ID',
        'User Name',
        'Assignment ID',
        'Assignment Title',
        'Questions Answered',
        'Total Questions',
        'Progress Percentage',
        'Score (%)',
        'Time Spent (minutes)',
        'Time Spent (seconds)',
        'Status',
        'Started At',
        'Completed At',
        'Organization ID',
        'Accuracy (%)'
      ];

      const csvData = progressData.map(item => [
        item.userId,
        item.userName,
        item.assignmentId,
        item.assignmentTitle,
        item.questionsAnswered,
        item.totalQuestions,
        item.totalQuestions > 0 ? Math.round((item.questionsAnswered / item.totalQuestions) * 100) : 0,
        item.score !== undefined ? item.score : 0,
        Math.round(item.timeSpent / 60),
        item.timeSpent,
        item.status,
        item.startedAt.toISOString(),
        item.completedAt ? item.completedAt.toISOString() : '',
        item.organizationId || '',
        item.accuracy !== undefined ? item.accuracy : 0
      ]);

      // Add BOM for Excel compatibility
      const BOM = '\uFEFF';
      const csvContent = BOM + [headers, ...csvData]
        .map(row => row.map(cell => {
          // Escape quotes and wrap in quotes if necessary
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `user_progress_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Progress data exported to CSV successfully! (${progressData.length} records)`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export data to CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: user?.email || 'Unknown',
          timeRange: selectedTimeRange,
          organization: selectedOrganization,
          totalRecords: progressData.length,
          version: '1.0'
        },
        summary: {
          metrics,
          filters: {
            timeRange: selectedTimeRange,
            organization: selectedOrganization
          }
        },
        data: progressData.map(item => ({
          userId: item.userId,
          userName: item.userName,
          assignmentId: item.assignmentId,
          assignmentTitle: item.assignmentTitle,
          progress: {
            questionsAnswered: item.questionsAnswered,
            totalQuestions: item.totalQuestions,
            progressPercentage: item.totalQuestions > 0 ? Math.round((item.questionsAnswered / item.totalQuestions) * 100) : 0
          },
          performance: {
            score: item.score,
            accuracy: item.accuracy,
            timeSpent: {
              seconds: item.timeSpent,
              minutes: Math.round(item.timeSpent / 60),
              formatted: `${Math.floor(item.timeSpent / 60)}:${(item.timeSpent % 60).toString().padStart(2, '0')}`
            }
          },
          timeline: {
            startedAt: item.startedAt.toISOString(),
            completedAt: item.completedAt?.toISOString() || null,
            duration: item.completedAt ?
              Math.round((item.completedAt.getTime() - item.startedAt.getTime()) / 1000) : null
          },
          status: item.status,
          organizationId: item.organizationId
        }))
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `user_progress_detailed_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Progress data exported to JSON successfully! (${progressData.length} records with metadata)`);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      toast.error('Failed to export data to JSON');
    } finally {
      setIsExporting(false);
    }
  };

  // WhatsApp messaging function
  const sendWhatsAppMessage = (user: UserProgressData) => {
    if (!user.userContactInfo) {
      toast.error('No contact information available for this user');
      return;
    }

    // Clean contact info (remove any non-digit characters except +)
    const cleanMobile = user.userContactInfo.replace(/[^\d+]/g, '');

    // Ensure mobile number starts with country code
    let formattedMobile = cleanMobile;
    if (!formattedMobile.startsWith('+')) {
      // Assume Indian number if no country code
      if (formattedMobile.startsWith('91')) {
        formattedMobile = '+' + formattedMobile;
      } else if (formattedMobile.length === 10) {
        formattedMobile = '+91' + formattedMobile;
      } else {
        formattedMobile = '+' + formattedMobile;
      }
    }

    // Create congratulatory message
    const scoreText = user.score !== undefined ? user.score : 0;
    const statusText = user.status === 'COMPLETED' ? 'completed' : 'attempted';

    const message = `Hi ${user.userName}! 🎉

Congratulations! You have ${statusText} the activity "${user.assignmentTitle}" and scored ${scoreText}%. Very good!

Keep up the excellent work! 👏

Best regards,
Your Learning Team`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${formattedMobile.replace('+', '')}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    toast.success(`WhatsApp message prepared for ${user.userName}`);
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'ABANDONED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading progress data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          User Progress Dashboard
        </h2>

        {/* Filters and Export */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>

          <button
            onClick={fetchProgressData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={progressData.length === 0 || isExporting}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isExporting ? 'Exporting...' : `Export (${progressData.length})`}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Export Options */}
            <AnimatePresence>
              {showExportDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                >
                  <div className="py-2">
                    <button
                      onClick={() => {
                        exportToCSV();
                        setShowExportDropdown(false);
                      }}
                      disabled={isExporting}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export as CSV
                      <span className="ml-auto text-xs text-gray-500">Excel compatible</span>
                    </button>
                    <button
                      onClick={() => {
                        exportToJSON();
                        setShowExportDropdown(false);
                      }}
                      disabled={isExporting}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Export as JSON
                      <span className="ml-auto text-xs text-gray-500">With metadata</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Users', value: metrics.totalUsers, color: 'blue' },
          { label: 'Active Users', value: metrics.activeUsers, color: 'green' },
          { label: 'Completed', value: metrics.completedAssignments, color: 'purple' },
          { label: 'Avg Score', value: `${metrics.averageScore}%`, color: 'orange' },
          { label: 'Avg Time', value: formatTime(metrics.averageTimeSpent), color: 'indigo' },
          { label: 'Completion Rate', value: `${metrics.completionRate}%`, color: 'pink' },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg bg-${metric.color}-50 border border-${metric.color}-200`}
          >
            <div className={`text-2xl font-bold text-${metric.color}-600`}>
              {metric.value}
            </div>
            <div className={`text-sm text-${metric.color}-600`}>
              {metric.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity ({progressData.length} entries)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  WhatsApp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {progressData.slice(0, 50).map((item, index) => (
                  <motion.tr
                    key={`${item.userId}-${item.assignmentId}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {item.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.userName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        {item.userContactInfo ? (
                          <>
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-sm">{item.userContactInfo}</span>
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="max-w-xs truncate" title={item.assignmentTitle}>
                        {item.assignmentTitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {item.questionsAnswered}/{item.totalQuestions}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${item.totalQuestions > 0 ? (item.questionsAnswered / item.totalQuestions) * 100 : 0}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        {item.score !== undefined ? (
                          <>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.score >= 80 ? 'bg-green-100 text-green-800' :
                              item.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.score}%
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(item.timeSpent)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {item.userContactInfo ? (
                        <button
                          onClick={() => sendWhatsAppMessage(item)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                          title={`Send WhatsApp message to ${item.userName}`}
                        >
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
                          </svg>
                          Send
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">No contact info</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserProgressDashboard;
