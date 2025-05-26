// src/utils/exportUtils.ts

export interface ExportData {
  userId: string;
  userName: string;
  userContactInfo?: string;
  assignmentId: string;
  assignmentTitle: string;
  questionsAnswered: number;
  totalQuestions: number;
  score?: number;
  timeSpent: number;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  organizationId: string;
  accuracy?: number;
}

export interface ExportMetrics {
  totalUsers: number;
  totalAssignments: number;
  averageScore: number;
  averageTimeSpent: number;
  completionRate: number;
}

// Export to CSV with Excel compatibility
export const exportToCSV = (data: ExportData[], filename?: string): void => {
  const headers = [
    'User ID',
    'User Name',
    'Contact Info',
    'Assignment ID',
    'Assignment Title',
    'Questions Answered',
    'Total Questions',
    'Progress (%)',
    'Score (%)',
    'Time Spent (minutes)',
    'Time Spent (seconds)',
    'Status',
    'Started At',
    'Completed At',
    'Organization ID',
    'Accuracy (%)'
  ];

  const csvData = data.map(item => [
    item.userId,
    item.userName,
    item.userContactInfo || '',
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
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
    .join('\n');

  downloadFile(csvContent, filename || `user_progress_${getCurrentDate()}.csv`, 'text/csv');
};

// Export to JSON with metadata
export const exportToJSON = (
  data: ExportData[],
  metrics: ExportMetrics,
  metadata: any = {},
  filename?: string
): void => {
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      totalRecords: data.length,
      version: '1.0',
      ...metadata
    },
    summary: {
      metrics
    },
    data: data.map(item => ({
      userId: item.userId,
      userName: item.userName,
      userContactInfo: item.userContactInfo || null,
      assignmentId: item.assignmentId,
      assignmentTitle: item.assignmentTitle,
      progress: {
        questionsAnswered: item.questionsAnswered,
        totalQuestions: item.totalQuestions,
        progressPercentage: item.totalQuestions > 0 ?
          Math.round((item.questionsAnswered / item.totalQuestions) * 100) : 0
      },
      performance: {
        score: item.score,
        accuracy: item.accuracy,
        timeSpent: {
          seconds: item.timeSpent,
          minutes: Math.round(item.timeSpent / 60),
          formatted: formatDuration(item.timeSpent)
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
  downloadFile(jsonContent, filename || `user_progress_detailed_${getCurrentDate()}.json`, 'application/json');
};

// Export to Excel-compatible HTML table
export const exportToExcel = (data: ExportData[], filename?: string): void => {
  const headers = [
    'User ID', 'User Name', 'Contact Info', 'Assignment ID', 'Assignment Title',
    'Questions Answered', 'Total Questions', 'Progress (%)', 'Score (%)',
    'Time Spent (minutes)', 'Status', 'Started At', 'Completed At',
    'Organization ID', 'Accuracy (%)'
  ];

  const htmlContent = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .number { text-align: right; }
        </style>
      </head>
      <body>
        <h2>User Progress Report</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total Records: ${data.length}</p>
        <table>
          <thead>
            <tr>
              ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                <td>${item.userId}</td>
                <td>${item.userName}</td>
                <td>${item.userContactInfo || '-'}</td>
                <td>${item.assignmentId}</td>
                <td>${item.assignmentTitle}</td>
                <td class="number">${item.questionsAnswered}</td>
                <td class="number">${item.totalQuestions}</td>
                <td class="number">${item.totalQuestions > 0 ? Math.round((item.questionsAnswered / item.totalQuestions) * 100) : 0}%</td>
                <td class="number">${item.score !== undefined ? item.score : 0}%</td>
                <td class="number">${Math.round(item.timeSpent / 60)}</td>
                <td>${item.status}</td>
                <td>${item.startedAt.toLocaleString()}</td>
                <td>${item.completedAt ? item.completedAt.toLocaleString() : '-'}</td>
                <td>${item.organizationId || '-'}</td>
                <td class="number">${item.accuracy !== undefined ? item.accuracy : 0}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  downloadFile(htmlContent, filename || `user_progress_${getCurrentDate()}.xls`, 'application/vnd.ms-excel');
};

// Utility functions
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Export summary report
export const exportSummaryReport = (data: ExportData[], metrics: ExportMetrics): void => {
  const reportContent = `
# User Progress Summary Report

**Generated:** ${new Date().toLocaleString()}
**Total Records:** ${data.length}

## Key Metrics
- **Total Users:** ${metrics.totalUsers}
- **Total Assignments:** ${metrics.totalAssignments}
- **Average Score:** ${metrics.averageScore.toFixed(1)}%
- **Average Time Spent:** ${Math.round(metrics.averageTimeSpent / 60)} minutes
- **Completion Rate:** ${metrics.completionRate.toFixed(1)}%

## Status Distribution
${getStatusDistribution(data)}

## Top Performing Users
${getTopPerformers(data)}

## Assignment Performance
${getAssignmentPerformance(data)}
  `;

  downloadFile(reportContent, `progress_summary_${getCurrentDate()}.md`, 'text/markdown');
};

const getStatusDistribution = (data: ExportData[]): string => {
  const statusCounts = data.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(statusCounts)
    .map(([status, count]) => `- **${status}:** ${count} (${((count / data.length) * 100).toFixed(1)}%)`)
    .join('\n');
};

const getTopPerformers = (data: ExportData[]): string => {
  const topUsers = data
    .filter(item => item.score !== undefined)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);

  return topUsers
    .map((user, index) => `${index + 1}. **${user.userName}** - ${user.score}% (${user.assignmentTitle})`)
    .join('\n');
};

const getAssignmentPerformance = (data: ExportData[]): string => {
  const assignmentStats = data.reduce((acc, item) => {
    if (!acc[item.assignmentTitle]) {
      acc[item.assignmentTitle] = { scores: [], count: 0 };
    }
    if (item.score !== undefined) {
      acc[item.assignmentTitle].scores.push(item.score);
    }
    acc[item.assignmentTitle].count++;
    return acc;
  }, {} as Record<string, { scores: number[], count: number }>);

  return Object.entries(assignmentStats)
    .map(([title, stats]) => {
      const avgScore = stats.scores.length > 0
        ? (stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length).toFixed(1)
        : 'N/A';
      return `- **${title}:** ${stats.count} attempts, Avg Score: ${avgScore}%`;
    })
    .join('\n');
};
