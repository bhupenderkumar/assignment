// src/components/certificates/CertificateImageGenerator.tsx
import React, { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';

interface CertificateImageGeneratorProps {
  certificateData: {
    userName: string;
    assignmentTitle: string;
    score: number;
    completionDate: string;
    organizationName: string;
    organizationLogo?: string;
    submissionId: string;
  };
  onImageGenerated: (imageBlob: Blob, imageUrl: string) => void;
  onError: (error: string) => void;
  isGenerating?: boolean;
}

const CertificateImageGenerator: React.FC<CertificateImageGeneratorProps> = ({
  certificateData,
  onImageGenerated,
  onError,
  isGenerating = false
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const generateCertificateImage = useCallback(async () => {
    if (!certificateRef.current) {
      onError('Certificate element not found');
      return;
    }

    try {
      console.log('🖼️ Starting certificate image generation...');
      
      // Configure html2canvas for high quality output
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // Higher resolution for mobile sharing
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: 600,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        windowHeight: 600,
        onclone: (clonedDoc) => {
          // Ensure fonts are loaded in the cloned document
          const clonedElement = clonedDoc.querySelector('[data-certificate]') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.fontFamily = 'Arial, sans-serif';
            clonedElement.style.fontSize = '16px';
          }
        }
      });

      // Convert canvas to blob with high quality
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            console.log('✅ Certificate image generated successfully');
            onImageGenerated(blob, imageUrl);
          } else {
            onError('Failed to generate certificate image');
          }
        },
        'image/png',
        0.95 // High quality
      );
    } catch (error) {
      console.error('❌ Error generating certificate image:', error);
      onError(error instanceof Error ? error.message : 'Failed to generate certificate image');
    }
  }, [onImageGenerated, onError]);

  // Auto-generate image when component mounts
  React.useEffect(() => {
    if (certificateData && !isGenerating) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(generateCertificateImage, 500);
    }
  }, [certificateData, generateCertificateImage, isGenerating]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Satisfactory';
    return 'Needs Improvement';
  };

  return (
    <div className="relative">
      {/* Certificate Design for Image Generation */}
      <div
        ref={certificateRef}
        data-certificate
        className="bg-white border-8 border-blue-600 p-8 w-[800px] h-[600px] mx-auto"
        style={{
          fontFamily: 'Arial, sans-serif',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          position: isGenerating ? 'absolute' : 'relative',
          left: isGenerating ? '-9999px' : 'auto',
          top: isGenerating ? '-9999px' : 'auto'
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            {certificateData.organizationLogo && (
              <img
                src={certificateData.organizationLogo}
                alt="Organization Logo"
                className="h-16 w-16 object-contain mr-4"
                crossOrigin="anonymous"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-blue-800 mb-1">
                {certificateData.organizationName}
              </h1>
              <p className="text-lg text-gray-600">Interactive Learning Platform</p>
            </div>
          </div>
          
          <div className="border-t-4 border-blue-600 w-32 mx-auto mb-6"></div>
          
          <h2 className="text-4xl font-bold text-gray-800 mb-2">
            CERTIFICATE OF COMPLETION
          </h2>
          <p className="text-lg text-gray-600">This is to certify that</p>
        </div>

        {/* Main Content */}
        <div className="text-center mb-6">
          <h3 className="text-3xl font-bold text-blue-800 mb-4 border-b-2 border-blue-300 pb-2 inline-block">
            {certificateData.userName}
          </h3>
          
          <p className="text-xl text-gray-700 mb-4">
            has successfully completed the assignment
          </p>
          
          <h4 className="text-2xl font-semibold text-gray-800 mb-6 bg-blue-50 p-3 rounded-lg inline-block">
            "{certificateData.assignmentTitle}"
          </h4>
          
          <div className="flex justify-center items-center space-x-8 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Score Achieved</p>
              <p className={`text-3xl font-bold ${getScoreColor(certificateData.score)}`}>
                {certificateData.score}%
              </p>
              <p className={`text-sm font-medium ${getScoreColor(certificateData.score)}`}>
                {getScoreGrade(certificateData.score)}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Completion Date</p>
              <p className="text-lg font-semibold text-gray-800">
                {new Date(certificateData.completionDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end mt-8">
          <div className="text-center">
            <div className="border-t-2 border-gray-400 w-32 mb-2"></div>
            <p className="text-sm text-gray-600">Authorized Signature</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-full">
              <p className="text-xs font-semibold">Certificate ID</p>
              <p className="text-sm">{certificateData.submissionId.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="border-t-2 border-gray-400 w-32 mb-2"></div>
            <p className="text-sm text-gray-600">Date of Issue</p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 left-4 w-16 h-16 border-4 border-blue-300 rounded-full opacity-20"></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-4 border-blue-300 rounded-full opacity-20"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-blue-300 rounded-full opacity-20"></div>
        <div className="absolute bottom-4 right-4 w-12 h-12 bg-blue-300 rounded-full opacity-20"></div>
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Generating certificate image...</p>
            <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CertificateImageGenerator;
