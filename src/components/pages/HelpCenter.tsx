import React from 'react';

const HelpCenter: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Help Center</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium mb-2">How to Access Assignments</h3>
              <p className="text-gray-600">
                You can access assignments through the main dashboard or via a shared link. Click on any assignment to begin working on it.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Types of Exercises</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Matching exercises - Match pairs of related items</li>
                <li>Completion exercises - Fill in missing words or phrases</li>
                <li>Multiple choice - Select the correct answer(s)</li>
                <li>Ordering exercises - Arrange items in the correct sequence</li>
                <li>Drawing exercises - Create drawings or trace patterns</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Common Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium mb-2">How is my progress saved?</h3>
              <p className="text-gray-600">
                Your progress is automatically saved as you work through assignments. You can return to an assignment at any time to continue where you left off.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">What if I need help?</h3>
              <p className="text-gray-600">
                Each exercise includes clear instructions and hints. If you need additional assistance, look for the help icon or contact your instructor.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Can I retry an assignment?</h3>
              <p className="text-gray-600">
                Yes, you can retry assignments multiple times to improve your score and understanding of the material.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Technical Support</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium mb-2">Browser Requirements</h3>
              <p className="text-gray-600">
                We recommend using the latest version of Chrome, Firefox, Safari, or Edge for the best experience.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-2">Contact Support</h3>
              <p className="text-gray-600">
                If you encounter any technical issues, please contact our support team at support@interactiveassignments.com
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpCenter;
