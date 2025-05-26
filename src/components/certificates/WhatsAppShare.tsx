// src/components/certificates/WhatsAppShare.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { 
  shareCertificateOnWhatsApp, 
  getDefaultCertificateMessage, 
  isWhatsAppSupported,
  detectPlatform,
  WhatsAppShareResult 
} from '../../utils/whatsappUtils';
import toast from 'react-hot-toast';

interface WhatsAppShareProps {
  isOpen: boolean;
  onClose: () => void;
  certificateDataUrl: string;
  userName?: string;
  assignmentTitle?: string;
  score?: number;
  onShareSuccess?: () => void;
}

const WhatsAppShare: React.FC<WhatsAppShareProps> = ({
  isOpen,
  onClose,
  certificateDataUrl,
  userName,
  assignmentTitle,
  score,
  onShareSuccess
}) => {
  const { config } = useConfiguration();
  const [isSharing, setIsSharing] = useState(false);
  const [message, setMessage] = useState('');
  const [phoneNumber] = useState('+91 9717267473'); // Fixed recipient number
  const [platform, setPlatform] = useState(detectPlatform());

  // Initialize message when component opens
  useEffect(() => {
    if (isOpen) {
      const defaultMessage = getDefaultCertificateMessage(userName, assignmentTitle, score);
      setMessage(defaultMessage);
      setPlatform(detectPlatform());
    }
  }, [isOpen, userName, assignmentTitle, score]);

  const handleShare = async () => {
    if (!certificateDataUrl) {
      toast.error('Certificate image not available');
      return;
    }

    setIsSharing(true);

    try {
      const result: WhatsAppShareResult = await shareCertificateOnWhatsApp({
        phoneNumber: phoneNumber,
        message: message,
        imageDataUrl: certificateDataUrl
      });

      if (result.success) {
        toast.success('Opening WhatsApp...');
        onShareSuccess?.();
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        toast.error(result.error || 'Failed to share certificate');
      }
    } catch (error) {
      console.error('WhatsApp sharing error:', error);
      toast.error('Failed to share certificate');
    } finally {
      setIsSharing(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isWhatsAppSupported()) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full mt-8 mb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <svg 
                      className="w-6 h-6 text-white" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Share Certificate</h3>
                    <p className="text-sm text-gray-500">Share your achievement on WhatsApp</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Platform Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-blue-800">
                    {platform.isMobile 
                      ? 'Will open WhatsApp app on your device' 
                      : 'Will open WhatsApp Web in a new tab'
                    }
                  </span>
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sending to:
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <span className="text-gray-900 font-medium">{phoneNumber}</span>
                </div>
              </div>

              {/* Message Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message:
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter your message..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can edit this message before sharing
                </p>
              </div>

              {/* Certificate Preview */}
              {certificateDataUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Preview:
                  </label>
                  <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <img 
                      src={certificateDataUrl} 
                      alt="Certificate Preview" 
                      className="w-full h-32 object-contain rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 flex space-x-3">
              <button
                onClick={handleSkip}
                disabled={isSharing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={handleShare}
                disabled={isSharing || !message.trim()}
                className="flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                style={{ backgroundColor: config.primaryColor }}
              >
                {isSharing ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    <span>Sharing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    <span>Share on WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppShare;
