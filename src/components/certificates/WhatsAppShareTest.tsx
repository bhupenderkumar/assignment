// src/components/certificates/WhatsAppShareTest.tsx
// This is a test component to verify WhatsApp sharing functionality
import React from 'react';
import { 
  isWhatsAppSupported, 
  detectPlatform, 
  formatPhoneNumber, 
  createWhatsAppURL,
  getDefaultCertificateMessage 
} from '../../utils/whatsappUtils';

const WhatsAppShareTest: React.FC = () => {
  const platform = detectPlatform();
  const isSupported = isWhatsAppSupported();
  
  const testPhoneNumber = '+91 9717267473';
  const testMessage = getDefaultCertificateMessage('John Doe', 'Math Quiz', 85);
  const testURL = createWhatsAppURL(testPhoneNumber, testMessage);

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">WhatsApp Share Test</h3>
      
      <div className="space-y-3">
        <div>
          <strong>Platform Detection:</strong>
          <ul className="ml-4 mt-1">
            <li>Mobile: {platform.isMobile ? '✅' : '❌'}</li>
            <li>Android: {platform.isAndroid ? '✅' : '❌'}</li>
            <li>iOS: {platform.isIOS ? '✅' : '❌'}</li>
            <li>Desktop: {platform.isDesktop ? '✅' : '❌'}</li>
            <li>Web Share API: {platform.hasWebShare ? '✅' : '❌'}</li>
          </ul>
        </div>
        
        <div>
          <strong>WhatsApp Supported:</strong> {isSupported ? '✅' : '❌'}
        </div>
        
        <div>
          <strong>Formatted Phone:</strong> {formatPhoneNumber(testPhoneNumber)}
        </div>
        
        <div>
          <strong>Test Message:</strong>
          <pre className="bg-white p-2 rounded text-sm mt-1">{testMessage}</pre>
        </div>
        
        <div>
          <strong>Generated URL:</strong>
          <div className="bg-white p-2 rounded text-sm mt-1 break-all">{testURL}</div>
        </div>
        
        <button
          onClick={() => window.open(testURL, '_blank')}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Test WhatsApp Share
        </button>
      </div>
    </div>
  );
};

export default WhatsAppShareTest;
