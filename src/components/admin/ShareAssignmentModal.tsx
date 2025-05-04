// src/components/admin/ShareAssignmentModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInteractiveAssignment } from '../../context/InteractiveAssignmentContext';
import { InteractiveAssignment } from '../../types/interactiveAssignment';
import toast from 'react-hot-toast';

interface ShareAssignmentModalProps {
  assignment: InteractiveAssignment | null;
  onClose: () => void;
}

const ShareAssignmentModal = ({ assignment, onClose }: ShareAssignmentModalProps) => {
  const { generateShareableLink } = useInteractiveAssignment();
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // Reset state when assignment changes
  useEffect(() => {
    if (assignment) {
      setShareableLink(assignment.shareableLink || null);
      setCopied(false);
    } else {
      setShareableLink(null);
      setCopied(false);
    }
  }, [assignment]);

  // Handle generate link
  const handleGenerateLink = async () => {
    if (!assignment) return;

    setIsGenerating(true);
    try {
      const link = await generateShareableLink(assignment.id, expiresInDays);
      setShareableLink(link);
      toast.success('Shareable link generated successfully');
    } catch (error) {
      console.error('Error generating shareable link:', error);
      toast.error('Failed to generate shareable link');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle copy link
  const handleCopyLink = () => {
    if (!shareableLink) return;

    // Create the full URL
    const fullUrl = `${window.location.origin}/play/share/${shareableLink}`;

    navigator.clipboard.writeText(fullUrl)
      .then(() => {
        setCopied(true);
        toast.success('Link copied to clipboard');

        // Reset copied state after 3 seconds
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        toast.error('Failed to copy link');
      });
  };

  // Handle test link
  const handleTestLink = () => {
    if (!shareableLink) return;

    // Use React Router navigation
    navigate(`/play/share/${shareableLink}`);
    onClose();
  };

  if (!assignment) return null;

  return (
    <AnimatePresence>
      {assignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Share Assignment</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-gray-900">{assignment.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{assignment.description}</p>
            </div>

            {shareableLink ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shareable Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/play/share/${shareableLink}`}
                    className="flex-1 px-4 py-2 rounded-l-lg border border-gray-300 bg-gray-50 text-gray-800"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-r-lg ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {copied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This link will expire on {assignment.shareableLinkExpiresAt
                    ? new Date(assignment.shareableLinkExpiresAt).toLocaleDateString()
                    : new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toLocaleDateString()
                  }
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <label htmlFor="expiresInDays" className="block text-sm font-medium text-gray-700 mb-1">
                  Link Expiration (days)
                </label>
                <input
                  type="number"
                  id="expiresInDays"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 30)}
                  min="1"
                  max="365"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>

              {shareableLink ? (
                <button
                  onClick={handleTestLink}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg"
                >
                  Test Link
                </button>
              ) : (
                <button
                  onClick={handleGenerateLink}
                  disabled={isGenerating}
                  className={`px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg ${
                    isGenerating ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isGenerating ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Generate Link'
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShareAssignmentModal;
