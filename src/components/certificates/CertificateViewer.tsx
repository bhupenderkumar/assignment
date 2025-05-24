// src/components/certificates/CertificateViewer.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { InteractiveSubmission } from '../../types/interactiveAssignment';
import CertificateTemplate from './CertificateTemplate';

interface CertificateViewerProps {
  submission: InteractiveSubmission;
  onClose: () => void;
  assignmentTitle?: string;
  assignmentOrganizationId?: string;
  username?: string;
}

const CertificateViewer = ({
  submission,
  onClose,
  assignmentTitle: propAssignmentTitle,
  assignmentOrganizationId,
  username
}: CertificateViewerProps) => {
  const [downloading, setDownloading] = useState(false);
  const [certificateDataUrl, setCertificateDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const { config } = useConfiguration();
  // Extract assignment title from submission
  const assignmentTitle = propAssignmentTitle || 'Interactive Assignment';

  // No need to load assignment data separately - we already have what we need in the submission

  // Handle export from Konva
  const handleExport = (dataUrl: string) => {
    setIsGenerating(false);
    setCertificateDataUrl(dataUrl || null);

    if (dataUrl) {
      console.log('Certificate image received in viewer');
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
      link.download = `certificate-${submission.id.substring(0, 8)}.png`;

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
    if (!certificateDataUrl) return;

    // Create a new window with just the image
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - Interactive Assignment</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
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
                window.close();
              }, 200);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // Handle opening certificate in a new tab
  const handleOpenInNewTab = () => {
    // Navigate to the standalone certificate page with the submission ID as a query parameter
    const url = `/certificate?submissionId=${submission.id}`;

    // Open in a new tab with specific window features to ensure it's a clean view
    const newWindow = window.open(
      url,
      '_blank',
      'noopener,noreferrer,toolbar=yes,menubar=yes,scrollbars=yes,resizable=yes,width=1000,height=800'
    );

    // Focus the new window if it was successfully opened
    if (newWindow) newWindow.focus();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4 print:p-0"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible border-4 border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Certificate Header - Hidden when printing */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center print:hidden">
            <h2 className="text-2xl font-bold flex items-center" style={{ color: config.primaryColor }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: config.primaryColor }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Your Certificate
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handleDownloadImage}
                disabled={downloading || !certificateDataUrl || isGenerating}
                className="px-4 py-2 rounded-lg text-white font-medium flex items-center space-x-1 transition-all duration-300 disabled:opacity-50 shadow-sm hover:shadow-md"
                style={{ backgroundColor: config.secondaryColor }}
                title={isGenerating ? "Certificate is being generated..." : !certificateDataUrl ? "Certificate generation failed" : "Download certificate as image"}
              >
                {downloading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    <span>Downloading...</span>
                  </>
                ) : isGenerating ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Image</span>
                  </>
                )}
              </button>
              <button
                onClick={handleOpenInNewTab}
                className="px-4 py-2 rounded-lg text-white font-medium flex items-center space-x-1 transition-all duration-300 shadow-sm hover:shadow-md"
                style={{ backgroundColor: config.accentColor }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Open in New Tab</span>
              </button>
              <button
                onClick={handlePrint}
                disabled={!certificateDataUrl || isGenerating}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 font-medium flex items-center space-x-1 hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 shadow-sm hover:shadow-md border border-gray-200"
                title={isGenerating ? "Certificate is being generated..." : !certificateDataUrl ? "Certificate generation failed" : "Print certificate"}
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-gray-800 border-t-transparent rounded-full mr-2"></span>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-all duration-300 shadow-sm hover:shadow-md border border-gray-200"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Certificate Content */}
          <div className="p-8 print:p-0 flex justify-center bg-gray-50">
            <div className="shadow-lg rounded-lg overflow-hidden bg-white p-4">
              <CertificateTemplate
                submission={submission}
                assignmentTitle={assignmentTitle}
                assignmentOrganizationId={assignmentOrganizationId}
                username={username}
                width={800}
                height={600}
                onExport={handleExport}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CertificateViewer;
