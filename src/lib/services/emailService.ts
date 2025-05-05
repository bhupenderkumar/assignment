import emailjs from '@emailjs/browser';

// Replace these with your actual EmailJS service details
// You'll need to sign up at https://www.emailjs.com/ and create a service
const EMAIL_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
const EMAIL_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
const EMAIL_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';

// Initialize EmailJS
emailjs.init(EMAIL_PUBLIC_KEY);

export interface InvitationEmailParams {
  to_email: string;
  invite_link: string;
  organization_name: string;
  inviter_name: string;
}

/**
 * Send an organization invitation email using EmailJS
 */
export const sendInvitationEmail = async (params: InvitationEmailParams): Promise<void> => {
  try {
    console.log('Sending invitation email with params:', params);

    const response = await emailjs.send(
      EMAIL_SERVICE_ID,
      EMAIL_TEMPLATE_ID,
      params as unknown as Record<string, unknown>
    );

    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Check if EmailJS is properly configured
 */
export const isEmailServiceConfigured = (): boolean => {
  return (
    EMAIL_SERVICE_ID !== 'YOUR_SERVICE_ID' &&
    EMAIL_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
    EMAIL_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY'
  );
};

export default {
  sendInvitationEmail,
  isEmailServiceConfigured
};
