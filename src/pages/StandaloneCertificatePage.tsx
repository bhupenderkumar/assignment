import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { getSupabaseService } from '../lib/services/supabaseService';
import CertificateTemplate from '../components/certificates/CertificateTemplate';
import { InteractiveAssignment } from '../types/interactiveAssignment';
import { InteractiveSubmissionExtended } from '../types/interactiveSubmissionExtended';
import { motion } from 'framer-motion';
import '../styles/certificate-print.css';

const StandaloneCertificatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('submissionId');
  const [submission, setSubmission] = useState<InteractiveSubmissionExtended | null>(null);
  const [assignment, setAssignment] = useState<InteractiveAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificateDataUrl, setCertificateDataUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!submissionId) {
        setError('No submission ID provided');
        setLoading(false);
        return;
      }

      try {
        // Get the Supabase service
        const supabaseService = getSupabaseService();

        // Fetch submission - using the correct table name 'interactive_submission'
        const submissionData = await supabaseService.fetchById<InteractiveSubmissionExtended>('interactive_submission', submissionId);

        if (!submissionData) {
          throw new Error('Submission not found');
        }

        setSubmission(submissionData);

        // Fetch assignment if we have an assignmentId - using the correct table name 'interactive_assignment'
        if (submissionData.assignment_id) { // Using snake_case field name from the database
          const assignmentData = await supabaseService.fetchById<InteractiveAssignment>('interactive_assignment', submissionData.assignment_id);
          if (assignmentData) {
            setAssignment(assignmentData);
          }
        }
      } catch (err) {
        console.error('Error fetching certificate data:', err);
        setError('Failed to load certificate data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [submissionId]);

  // Handle export from Konva
  const handleExport = (dataUrl: string) => {
    setIsGenerating(false);
    setCertificateDataUrl(dataUrl || null);

    if (dataUrl) {
      console.log('Certificate image generated successfully');
    } else {
      console.warn('Failed to generate certificate image');
    }
  };

  // Handle download as image
  const handleDownloadImage = () => {
    if (!certificateDataUrl) return;

    try {
      setDownloading(true);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = certificateDataUrl;
      link.download = `certificate-${submission?.id.substring(0, 8) || 'download'}.png`;

      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setDownloading(false);
    }
  };

  // Handle print certificate
  const handlePrint = () => {
    if (!certificateDataUrl) {
      console.warn('Certificate image not ready yet');
      return;
    }

    // Create a new window with just the image for better printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the certificate');
      return;
    }

    // Create HTML content for the print window
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate of Achievement | ${assignment?.title || 'Interactive Assignment'}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background-color: white;
            }
            img {
              max-width: 100%;
              max-height: 100vh;
            }
            @media print {
              body {
                height: auto;
              }
              img {
                width: 100%;
                height: auto;
              }
            }
          </style>
        </head>
        <body>
          <img src="${certificateDataUrl}" alt="Certificate" />
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    // Use document.open/document.write/document.close pattern to avoid deprecation warning
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-700">{error || 'Certificate not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="standalone-certificate-page">
      <Helmet>
        <title>Certificate of Achievement | {assignment?.title || 'Interactive Assignment'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex" />
        <style type="text/css">{`
          body {
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
            overflow-x: hidden;
          }
        `}</style>
      </Helmet>
      {/* Header with buttons - hidden when printing */}
      <div className="certificate-header print:hidden">
        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">Certificate of Achievement</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleDownloadImage}
            disabled={downloading || !certificateDataUrl || isGenerating}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50"
            title={isGenerating ? "Certificate is being generated..." : !certificateDataUrl ? "Certificate generation failed" : "Download certificate as image"}
          >
            {downloading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                <span className="hidden sm:inline">Downloading...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : isGenerating ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">Download</span>
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            disabled={!certificateDataUrl || isGenerating}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 font-medium flex items-center space-x-2 hover:bg-gray-200 transition-colors duration-300 border border-gray-200 disabled:opacity-50"
            title={isGenerating ? "Certificate is being generated..." : !certificateDataUrl ? "Certificate generation failed" : "Print certificate"}
          >
            {isGenerating ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-gray-800 border-t-transparent rounded-full mr-2"></span>
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="hidden sm:inline">Print</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Certificate content */}
      <div className="certificate-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="shadow-lg rounded-lg overflow-hidden bg-white p-4 print:shadow-none print:p-0 max-w-full"
        >
          <CertificateTemplate
            submission={submission}
            assignmentTitle={assignment?.title}
            width={800}
            height={600}
            onExport={handleExport}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default StandaloneCertificatePage;
