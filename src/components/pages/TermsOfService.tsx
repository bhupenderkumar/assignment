import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="space-y-8 text-gray-600">
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing or using Interactive Assignments, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. User Accounts</h2>
          <p className="mb-4">
            When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>You are responsible for all activities under your account</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Do not share your account credentials</li>
            <li>Keep your account information up to date</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Acceptable Use</h2>
          <p className="mb-4">
            You agree not to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Use the platform for any illegal purposes</li>
            <li>Share inappropriate or offensive content</li>
            <li>Attempt to gain unauthorized access</li>
            <li>Interfere with platform functionality</li>
            <li>Copy or distribute platform content without permission</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Intellectual Property</h2>
          <p className="mb-4">
            All content, features, and functionality of the platform are owned by Interactive Assignments and are protected by copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            Users retain ownership of their submitted content but grant us a license to use, modify, and display such content on our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Service Availability</h2>
          <p className="mb-4">
            We strive to provide uninterrupted service but cannot guarantee:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Continuous, uninterrupted access to the platform</li>
            <li>Immediate resolution of technical issues</li>
            <li>Complete error-free operation</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Data Storage and Privacy</h2>
          <p className="mb-4">
            Your use of the platform is also governed by our Privacy Policy. By using Interactive Assignments, you consent to the collection and use of information as detailed in our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Termination</h2>
          <p className="mb-4">
            We reserve the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Suspend or terminate accounts for violations</li>
            <li>Modify or discontinue services without notice</li>
            <li>Remove content that violates these terms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Disclaimer of Warranties</h2>
          <p className="mb-4">
            The platform is provided "as is" without warranties of any kind, either express or implied. We do not warrant that the platform will be error-free or uninterrupted.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Contact Information</h2>
          <p>
            For questions about these Terms of Service, please contact us at:
          </p>
          <p className="mt-2">
            Email: legal@interactiveassignments.com<br />
            Address: [Your Company Address]<br />
            Phone: [Your Contact Number]
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the platform.
          </p>
          <p className="mt-4">
            Last Updated: May 1, 2025
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
