// src/components/organization/OrganizationSwitcher.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrganization } from '../../context/OrganizationContext';
import { Organization } from '../../types/organization';
import { useNavigate } from 'react-router-dom';
import { hexToRgba } from '../../utils/colorUtils';

const OrganizationSwitcher: React.FC = () => {
  const { organizations, currentOrganization, setCurrentOrganization, isLoading: isLoadingOrganizations } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle organization switching
  const handleSwitchOrganization = (org: Organization) => {
    console.log('OrganizationSwitcher: Switching to organization:', org.name, org.id);

    // Only switch if it's different from the current one
    if (!currentOrganization || currentOrganization.id !== org.id) {
      // Update the context - this will handle localStorage updates internally
      setCurrentOrganization(org);

      console.log('OrganizationSwitcher: Organization switched to:', org.name, 'with logo:', org.logoUrl);

      // Navigate to the organization page
      navigate(`/organizations/${org.id}`, { replace: true });
    }

    setIsOpen(false);
  };

  // Navigate to organization management
  const handleManageOrganizations = () => {
    navigate('/organizations');
    setIsOpen(false);
  };

  // If loading or no organizations, show placeholder
  if (isLoadingOrganizations) {
    return (
      <div className="h-9 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></div>
    );
  }

  if (!currentOrganization || organizations.length === 0) {
    return (
      <button
        onClick={handleManageOrganizations}
        className="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center space-x-1"
        style={{
          background: hexToRgba('#6366F1', 0.05),
          color: '#6366F1',
          border: '1px solid rgba(99, 102, 241, 0.1)'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>Join Organization</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300"
        style={{
          background: hexToRgba('#6366F1', 0.05),
          color: '#6366F1',
          border: '1px solid rgba(99, 102, 241, 0.1)'
        }}
      >
        {currentOrganization.logoUrl ? (
          <img
            src={currentOrganization.logoUrl}
            alt={currentOrganization.name}
            className="w-6 h-6 rounded-lg object-cover border"
            style={{ borderColor: hexToRgba('#6366F1', 0.2) }}
          />
        ) : (
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: `linear-gradient(135deg, #6366F1, #8B5CF6)` }}
          >
            {currentOrganization.name.charAt(0)}
          </div>
        )}
        <span className="max-w-[120px] truncate font-medium">{currentOrganization.name}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden backdrop-blur-sm"
            style={{
              boxShadow: `0 10px 25px ${hexToRgba('#6366F1', 0.15)}`,
              border: `1px solid ${hexToRgba('#6366F1', 0.1)}`
            }}
          >
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 uppercase tracking-wider">
                Your Organizations
              </div>

              <div className="max-h-60 overflow-y-auto py-1">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSwitchOrganization(org)}
                    className={`flex items-center space-x-3 w-full text-left px-4 py-2 text-sm transition-all duration-300 ${
                      currentOrganization.id === org.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.name}
                        className={`w-8 h-8 rounded-lg object-cover border-2 transition-all duration-300 ${
                          currentOrganization.id === org.id ? 'border-indigo-400' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold transition-all duration-300 ${
                          currentOrganization.id === org.id ? 'scale-110' : ''
                        }`}
                        style={{ background: `linear-gradient(135deg, #6366F1, #8B5CF6)` }}
                      >
                        {org.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium truncate">{org.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {org.type || 'Organization'}
                      </div>
                    </div>
                    {currentOrganization.id === org.id && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                <button
                  onClick={handleManageOrganizations}
                  className="flex items-center justify-between w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300"
                  style={{ color: '#6366F1' }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1 rounded-lg" style={{ backgroundColor: hexToRgba('#6366F1', 0.1) }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="font-medium">Manage Organizations</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrganizationSwitcher;
