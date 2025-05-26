// src/utils/whatsappUtils.ts
export interface WhatsAppShareOptions {
  phoneNumber: string;
  message: string;
  imageBlob?: Blob;
  imageDataUrl?: string;
}

export interface WhatsAppShareResult {
  success: boolean;
  error?: string;
  method?: 'url_scheme' | 'web_api' | 'share_api';
}

/**
 * Detects if the device/browser supports WhatsApp sharing
 */
export const isWhatsAppSupported = (): boolean => {
  // Check if we're on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check if Web Share API is available (for native sharing)
  const hasWebShare = 'share' in navigator;
  
  // WhatsApp is primarily mobile, but web version exists
  return isMobile || hasWebShare || true; // Allow all devices to try
};

/**
 * Detects the platform for optimal WhatsApp sharing method
 */
export const detectPlatform = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const hasWebShare = 'share' in navigator;
  
  return {
    isMobile,
    isAndroid,
    isIOS,
    hasWebShare,
    isDesktop: !isMobile
  };
};

/**
 * Formats phone number for WhatsApp (removes non-digits and adds country code if needed)
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it starts with country code, return as is
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned;
  }
  
  // If it's a 10-digit Indian number, add country code
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  
  // Return as is for other formats
  return cleaned;
};

/**
 * Creates a WhatsApp URL for sharing text message
 */
export const createWhatsAppURL = (phoneNumber: string, message: string): string => {
  const formattedNumber = formatPhoneNumber(phoneNumber);
  const encodedMessage = encodeURIComponent(message);
  
  const platform = detectPlatform();
  
  // Use appropriate URL scheme based on platform
  if (platform.isMobile) {
    // Mobile: Use WhatsApp URL scheme
    return `whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`;
  } else {
    // Desktop: Use WhatsApp Web
    return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
  }
};

/**
 * Converts data URL to Blob for sharing
 */
export const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

/**
 * Compresses image for optimal WhatsApp sharing
 */
export const compressImageForWhatsApp = (
  dataURL: string, 
  maxWidth: number = 1024, 
  maxHeight: number = 1024, 
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      const compressedDataURL = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataURL);
    };
    
    img.src = dataURL;
  });
};

/**
 * Attempts to share certificate via Web Share API (if available)
 */
export const shareViaWebShareAPI = async (options: WhatsAppShareOptions): Promise<WhatsAppShareResult> => {
  if (!('share' in navigator)) {
    return { success: false, error: 'Web Share API not supported' };
  }
  
  try {
    const shareData: ShareData = {
      title: 'My Certificate',
      text: options.message,
    };
    
    // Add image if available
    if (options.imageBlob) {
      const file = new File([options.imageBlob], 'certificate.jpg', { type: 'image/jpeg' });
      shareData.files = [file];
    }
    
    await navigator.share(shareData);
    return { success: true, method: 'share_api' };
  } catch (error) {
    console.error('Web Share API failed:', error);
    return { success: false, error: 'Sharing cancelled or failed' };
  }
};

/**
 * Opens WhatsApp with pre-filled message (fallback method)
 */
export const shareViaWhatsAppURL = (options: WhatsAppShareOptions): WhatsAppShareResult => {
  try {
    const whatsappURL = createWhatsAppURL(options.phoneNumber, options.message);
    
    // Open WhatsApp
    window.open(whatsappURL, '_blank');
    
    return { 
      success: true, 
      method: detectPlatform().isMobile ? 'url_scheme' : 'web_api' 
    };
  } catch (error) {
    console.error('WhatsApp URL sharing failed:', error);
    return { success: false, error: 'Failed to open WhatsApp' };
  }
};

/**
 * Main function to share certificate on WhatsApp
 */
export const shareCertificateOnWhatsApp = async (options: WhatsAppShareOptions): Promise<WhatsAppShareResult> => {
  if (!isWhatsAppSupported()) {
    return { success: false, error: 'WhatsApp sharing not supported on this device' };
  }
  
  const platform = detectPlatform();
  
  // Compress image if provided
  let processedImageBlob = options.imageBlob;
  if (options.imageDataUrl && !processedImageBlob) {
    try {
      const compressedDataURL = await compressImageForWhatsApp(options.imageDataUrl);
      processedImageBlob = dataURLtoBlob(compressedDataURL);
    } catch (error) {
      console.error('Image compression failed:', error);
    }
  }
  
  // Try Web Share API first (if available and has image)
  if (platform.hasWebShare && processedImageBlob) {
    const webShareResult = await shareViaWebShareAPI({
      ...options,
      imageBlob: processedImageBlob
    });
    
    if (webShareResult.success) {
      return webShareResult;
    }
  }
  
  // Fallback to WhatsApp URL (text only)
  return shareViaWhatsAppURL(options);
};

/**
 * Default message template for certificate sharing
 */
export const getDefaultCertificateMessage = (
  userName?: string, 
  assignmentTitle?: string, 
  score?: number
): string => {
  const baseMessage = "Hooray! I have completed the exam. Thanks! Here is my certificate.";
  
  if (userName && assignmentTitle && score !== undefined) {
    return `${baseMessage}\n\n📋 Assignment: ${assignmentTitle}\n👤 Name: ${userName}\n📊 Score: ${score}%`;
  }
  
  return baseMessage;
};
