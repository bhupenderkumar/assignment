// src/components/pages/SharedAssignmentPage.tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PlaySharedAssignment from '../assignments/PlaySharedAssignment';

const SharedAssignmentPage = () => {
  const { shareableLink } = useParams<{ shareableLink: string }>();

  // Set document title
  useEffect(() => {
    document.title = 'Interactive Assignment';
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      {shareableLink && <PlaySharedAssignment shareableLink={shareableLink} />}
    </div>
  );
};

export default SharedAssignmentPage;
