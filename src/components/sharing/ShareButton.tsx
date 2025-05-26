// src/components/sharing/ShareButton.tsx - Enhanced sharing component with OG support
import React, { useState } from 'react';
import { Share, Copy, MessageCircle, Facebook, Twitter, Linkedin } from 'lucide-react';
import { getSocialShareUrl, getDirectUrl } from '../../lib/utils/ogUtils';
import toast from 'react-hot-toast';

interface ShareButtonProps {
  type: 'assignment' | 'share';
  id: string;
  title?: string;
  description?: string;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  type,
  id,
  title = 'Interactive Assignment',
  description = 'Check out this interactive assignment!',
  className = ''
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Check if Web Share API is available
  const isWebShareSupported = typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'share' in navigator;

  // Get URLs
  const socialUrl = getSocialShareUrl(type, id);
  const directUrl = getDirectUrl(type, id);

  const copyToClipboard = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`${label} copied to clipboard!`);
      setShowShareMenu(false);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  const shareViaWebAPI = async () => {
    if (isWebShareSupported) {
      try {
        await navigator.share({
          title,
          text: description,
          url: socialUrl
        });
        setShowShareMenu(false);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copy
      copyToClipboard(socialUrl, 'Share link');
    }
  };

  const openSocialShare = (platform: string) => {
    let shareUrl = '';
    const encodedUrl = encodeURIComponent(socialUrl);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);

    switch (platform) {
      case 'whatsapp':
        // Enhanced WhatsApp message with emojis and better formatting
        const whatsappMessage = encodeURIComponent(`🎓 ${title}\n\n📚 ${description}\n\n✨ Take the assignment here: ${socialUrl}\n\n🏫 Powered by First Step School`);
        shareUrl = `https://wa.me/?text=${whatsappMessage}`;
        break;
      case 'facebook':
        // Facebook will automatically fetch OG data from the social URL
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedDescription}`;
        break;
      case 'twitter':
        // Twitter with hashtags and better formatting
        const hashtags = 'InteractiveAssignment,Education,Learning,FirstStepSchool';
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`🎓 ${title}\n\n${description}`)}&url=${encodedUrl}&hashtags=${hashtags}`;
        break;
      case 'linkedin':
        // LinkedIn with title and summary
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`;
        break;
      case 'telegram':
        // Add Telegram support
        const telegramMessage = encodeURIComponent(`🎓 ${title}\n\n${description}`);
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${telegramMessage}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowShareMenu(!showShareMenu)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Share size={16} />
        <span>Share</span>
      </button>

      {showShareMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowShareMenu(false)}
          />

          {/* Share Menu */}
          <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-64">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Share Assignment
              </h3>

              {/* Social Media Buttons */}
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => openSocialShare('whatsapp')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <MessageCircle size={18} className="text-green-600" />
                  <span className="text-gray-700 dark:text-gray-300">WhatsApp</span>
                </button>

                <button
                  onClick={() => openSocialShare('facebook')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Facebook size={18} className="text-blue-600" />
                  <span className="text-gray-700 dark:text-gray-300">Facebook</span>
                </button>

                <button
                  onClick={() => openSocialShare('twitter')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Twitter size={18} className="text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300">Twitter</span>
                </button>

                <button
                  onClick={() => openSocialShare('linkedin')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Linkedin size={18} className="text-blue-700" />
                  <span className="text-gray-700 dark:text-gray-300">LinkedIn</span>
                </button>
              </div>

              {/* Copy Links */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3 space-y-2">
                <button
                  onClick={() => copyToClipboard(socialUrl, 'Social share link')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Copy size={18} className="text-gray-600" />
                  <div className="flex-1">
                    <div className="text-gray-700 dark:text-gray-300">Copy Social Link</div>
                    <div className="text-xs text-gray-500">Best for WhatsApp, Facebook, etc.</div>
                  </div>
                </button>

                <button
                  onClick={() => copyToClipboard(directUrl, 'Direct link')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Copy size={18} className="text-gray-600" />
                  <div className="flex-1">
                    <div className="text-gray-700 dark:text-gray-300">Copy Direct Link</div>
                    <div className="text-xs text-gray-500">For direct access</div>
                  </div>
                </button>
              </div>

              {/* Native Share (if available) */}
              {isWebShareSupported && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                  <button
                    onClick={shareViaWebAPI}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <Share size={18} className="text-gray-600" />
                    <span className="text-gray-700 dark:text-gray-300">More Options</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareButton;
