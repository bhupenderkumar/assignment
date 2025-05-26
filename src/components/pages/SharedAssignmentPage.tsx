// src/components/pages/SharedAssignmentPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PlaySharedAssignment from '../assignments/PlaySharedAssignment';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import toast from 'react-hot-toast';

const SharedAssignmentPage = () => {
  const { shareableLink: urlShareableLink } = useParams<{ shareableLink: string }>();
  const [shareableLink, setShareableLink] = useState<string | undefined>(urlShareableLink);
  const { isSupabaseLoading } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [assignmentOrganization, setAssignmentOrganization] = useState<any | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<any | null>(null);
  const navigate = useNavigate();

  // Try to recover the shareable link from sessionStorage if it's not in the URL
  useEffect(() => {
    if (!urlShareableLink) {
      const storedLink = sessionStorage.getItem('current_shareable_link');
      if (storedLink) {
        console.log('Recovered shareable link from sessionStorage:', storedLink);
        setShareableLink(storedLink);
      } else {
        console.error('No shareable link in URL or sessionStorage');
      }
    } else {
      setShareableLink(urlShareableLink);
    }
  }, [urlShareableLink]);

  // Handle loading state
  useEffect(() => {
    if (!isSupabaseLoading) {
      setIsLoading(false);
    }
  }, [isSupabaseLoading]);

  // Handle invalid shareable link
  useEffect(() => {
    if (!shareableLink) {
      toast.error('Invalid shareable link');
      navigate('/');
    } else {
      // Log the shareable link for debugging
      console.log('SharedAssignmentPage received shareable link:', shareableLink);

      // Store the current shareable link in sessionStorage to help with page refreshes
      sessionStorage.setItem('current_shareable_link', shareableLink);
    }
  }, [shareableLink, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Dynamic page title based on organization */}
      <Helmet>
        <title>
          {assignmentOrganization?.name
            ? `${assignmentOrganization.name} | ${currentAssignment?.title || 'Assignment'}`
            : currentAssignment?.title
            ? `${currentAssignment.title} | Educational Assignment`
            : 'Educational Assignment'
          }
        </title>
        {assignmentOrganization?.logo_url && (
          <link rel="icon" type="image/png" href={assignmentOrganization.logo_url} />
        )}
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        {shareableLink && (
          <PlaySharedAssignment
            shareableLink={shareableLink}
            onOrganizationLoad={setAssignmentOrganization}
            onAssignmentLoad={setCurrentAssignment}
          />
        )}
      </div>
    </>
  );
};

export default SharedAssignmentPage;
