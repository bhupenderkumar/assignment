// src/components/Router.tsx
import { useState, useEffect } from 'react';

import Layout from './layout/Layout';
import SharedAssignmentPage from './pages/SharedAssignmentPage';
import PlayAssignmentPage from './pages/PlayAssignmentPage';
import AssignmentManagementList from './admin/AssignmentManagementList';
import { InteractiveAssignment } from '../types/interactiveAssignment';
import HelpCenter from './pages/HelpCenter';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import toast from 'react-hot-toast';

const Router = () => {
  const [currentRoute, setCurrentRoute] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: isAuthLoading } = useSupabaseAuth();
  // Navigation is handled through custom events

  useEffect(() => {
    const handleNavigation = (path: string) => {
      setIsLoading(true);
      if (path.startsWith('/play/share/')) {
        try {
          const link = path.substring('/play/share/'.length);
          console.log('Extracted shareable link from URL:', link);

          if (link && link.trim() !== '') {
            setShareableLink(link.trim());
            setCurrentRoute('shared');
          } else {
            console.error('Empty shareable link extracted from URL');
            setCurrentRoute('home');
          }
        } catch (error) {
          console.error('Error parsing URL:', error);
          setCurrentRoute('home');
        }
      }
      // Check if it's a direct assignment link
      else if (path.startsWith('/play/assignment/')) {
        try {
          const id = path.substring('/play/assignment/'.length);
          console.log('Extracted assignment ID from URL:', id);

          if (id && id.trim() !== '') {
            setAssignmentId(id.trim());
            setCurrentRoute('assignment');
          } else {
            console.error('Empty assignment ID extracted from URL');
            setCurrentRoute('home');
          }
        } catch (error) {
          console.error('Error parsing assignment URL:', error);
          setCurrentRoute('home');
        }
      }
      // Check if it's the management page
      else if (path === '/manage-assignments') {
        // Require authentication for management page
        if (!isAuthenticated && !isAuthLoading) {
          toast.error('Please sign in to access the management page');
          setCurrentRoute('sign-in');
        } else {
          setCurrentRoute('manage');
        }
      }
      // Check if it's the sign-in page
      else if (path === '/sign-in') {
        setCurrentRoute('sign-in');
      }
      // Check if it's the sign-up page
      else if (path === '/sign-up') {
        setCurrentRoute('sign-up');
      }
      // Check if it's the help center page
      else if (path === '/help') {
        setCurrentRoute('help');
      }
      // Check if it's the privacy policy page
      else if (path === '/privacy') {
        setCurrentRoute('privacy');
      }
      // Check if it's the terms of service page
      else if (path === '/terms') {
        setCurrentRoute('terms');
      }
      // Check if it's the test matching audio page
      else if (path === '/test-matching-audio') {
        setCurrentRoute('test-matching-audio');
      }
      // Check if it's the test matching page
      else if (path === '/test-matching') {
        setCurrentRoute('test-matching');
      }
      // Default to home
      else {
        setCurrentRoute('home');
      }
      setIsLoading(false);
    };

    // Listen for custom navigation events
    const handleCustomNavigation = (event: CustomEvent) => {
      const newPath = event.detail.path;
      window.history.pushState({}, '', newPath);
      handleNavigation(newPath);
    };

    window.addEventListener('navigationChange', handleCustomNavigation as EventListener);

    // Initial route handling
    const path = window.location.pathname;
    handleNavigation(path);

    // Listen for popstate events (browser back/forward buttons)
    const handlePopState = () => {
      handleNavigation(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('navigationChange', handleCustomNavigation as EventListener);
    };
  }, []);

  // Handle edit assignment
  const handleEdit = (assignment: InteractiveAssignment) => {
    const event = new CustomEvent('navigationChange', {
      detail: { path: `/edit-assignment/${assignment.id}` }
    });
    window.dispatchEvent(event);
  };

  // Handle share assignment
  const handleShare = (assignment: InteractiveAssignment) => {
    const event = new CustomEvent('navigationChange', {
      detail: { path: `/play/share/${assignment.id}` }
    });
    window.dispatchEvent(event);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Get the content based on the current route
  const getContent = () => {
    if (currentRoute === 'shared' && shareableLink) {
      return <SharedAssignmentPage />;
    }

    if (currentRoute === 'assignment' && assignmentId) {
      return <PlayAssignmentPage />;
    }

    if (currentRoute === 'manage') {
      // Require authentication for management page
      if (!isAuthenticated && !isAuthLoading) {
        // Redirect to sign-in page
        setTimeout(() => {
          const event = new CustomEvent('navigationChange', {
            detail: { path: '/sign-in' }
          });
          window.dispatchEvent(event);
        }, 0);
        return null;
      }
      return <AssignmentManagementList onEdit={handleEdit} onShare={handleShare} />;
    }

    if (currentRoute === 'sign-in') {
      return <SignInPage />;
    }

    if (currentRoute === 'sign-up') {
      return <SignUpPage />;
    }

    if (currentRoute === 'help') {
      return <HelpCenter />;
    }

    if (currentRoute === 'privacy') {
      return <PrivacyPolicy />;
    }

    if (currentRoute === 'terms') {
      return <TermsOfService />;
    }

    return null;
  };

  // Get the content for the current route
  const content = getContent();

  // If there's specific content, wrap it in the Layout
  if (content) {
    return <Layout>{content}</Layout>;
  }

  // Default to the main layout
  return <Layout />;
};

export default Router;
