import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="space-y-8 text-gray-600">
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Information We Collect</h2>
          <p className="mb-4">
            We collect information that you provide directly to us, including:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Name and contact information</li>
            <li>Assignment responses and progress data</li>
            <li>Usage information and interaction data</li>
            <li>Device and browser information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">How We Use Your Information</h2>
          <p className="mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Provide and improve our educational services</li>
            <li>Track progress and generate performance reports</li>
            <li>Personalize your learning experience</li>
            <li>Communicate with you about your assignments</li>
            <li>Analyze and improve our platform</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Data Storage and Security</h2>
          <p className="mb-4">
            We implement appropriate security measures to protect your personal information:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Secure data encryption in transit and at rest</li>
            <li>Regular security audits and updates</li>
            <li>Access controls and authentication</li>
            <li>Secure backup systems</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share your information with:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Your educational institution or instructor</li>
            <li>Service providers who assist in platform operations</li>
            <li>When required by law or to protect rights</li>
          </ul>
          <p>
            Any third-party service providers are bound by confidentiality agreements and data protection requirements.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Rights</h2>
          <p className="mb-4">
            You have the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Access your personal information</li>
            <li>Request corrections to your data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of certain data collection</li>
            <li>Export your data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="mt-2">
            Email: privacy@interactiveassignments.com<br />
            Address: [Your Company Address]<br />
            Phone: [Your Contact Number]
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Updates to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
          <p className="mt-4">
            Last Updated: May 1, 2025
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
