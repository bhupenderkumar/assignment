import toast from 'react-hot-toast';
import i18n from '../i18n/config';

// Helper function to ensure string type
const ensureString = (value: any): string => {
  return typeof value === 'string' ? value : String(value);
};

// Enhanced toast utility functions with i18n support
export const toastUtils = {
  // Success toasts
  success: (key: string, options?: any, fallback?: string) => {
    const translation = i18n.t(`toast.success.${key}`, options);
    const message = ensureString(translation) || fallback || key;
    return toast.success(message);
  },

  // Error toasts
  error: (key: string, options?: any, fallback?: string) => {
    const translation = i18n.t(`toast.error.${key}`, options);
    const message = ensureString(translation) || fallback || key;
    return toast.error(message);
  },

  // Info toasts
  info: (key: string, options?: any, fallback?: string) => {
    const translation = i18n.t(`toast.info.${key}`, options);
    const message = ensureString(translation) || fallback || key;
    return toast(message, { icon: 'ℹ️' });
  },

  // Warning toasts
  warning: (key: string, options?: any, fallback?: string) => {
    const translation = i18n.t(`toast.warning.${key}`, options);
    const message = ensureString(translation) || fallback || key;
    return toast(message, { icon: '⚠️' });
  },

  // Loading toasts
  loading: (key: string, options?: any, fallback?: string) => {
    const translation = i18n.t(`toast.info.${key}`, options);
    const message = ensureString(translation) || fallback || key;
    return toast.loading(message);
  },

  // Promise toasts with i18n
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: any
  ) => {
    return toast.promise(promise, {
      loading: ensureString(i18n.t(`toast.info.${messages.loading}`, options)) || messages.loading,
      success: ensureString(i18n.t(`toast.success.${messages.success}`, options)) || messages.success,
      error: ensureString(i18n.t(`toast.error.${messages.error}`, options)) || messages.error,
    });
  },

  // Custom toast with translation
  custom: (key: string, options?: any, toastOptions?: any, fallback?: string) => {
    const translation = i18n.t(key, options);
    const message = ensureString(translation) || fallback || key;
    return toast(message, toastOptions);
  },

  // Dismiss all toasts
  dismiss: () => {
    toast.dismiss();
  },

  // Remove specific toast
  remove: (toastId: string) => {
    toast.remove(toastId);
  }
};

// Specific toast functions for common use cases
export const showSuccessToast = (key: string, options?: any, fallback?: string) => {
  return toastUtils.success(key, options, fallback);
};

export const showErrorToast = (key: string, options?: any, fallback?: string) => {
  return toastUtils.error(key, options, fallback);
};

export const showInfoToast = (key: string, options?: any, fallback?: string) => {
  return toastUtils.info(key, options, fallback);
};

export const showWarningToast = (key: string, options?: any, fallback?: string) => {
  return toastUtils.warning(key, options, fallback);
};

export const showLoadingToast = (key: string, options?: any, fallback?: string) => {
  return toastUtils.loading(key, options, fallback);
};

// Assignment-specific toasts
export const assignmentToasts = {
  completed: () => toastUtils.success('assignmentCompleted', undefined, 'Assignment completed!'),
  saved: () => toastUtils.success('saved', undefined, 'Assignment saved!'),
  submitted: () => toastUtils.success('submitted', undefined, 'Assignment submitted!'),
  loadFailed: () => toastUtils.error('loadFailed', undefined, 'Failed to load assignment'),
  saveFailed: () => toastUtils.error('saveFailed', undefined, 'Failed to save assignment'),
  submitFailed: () => toastUtils.error('submitFailed', undefined, 'Failed to submit assignment'),
};

// Authentication-specific toasts
export const authToasts = {
  signInSuccess: () => toastUtils.success('signInSuccess', undefined, 'Welcome back!'),
  signOutSuccess: () => toastUtils.success('signOutSuccess', undefined, 'Signed out successfully!'),
  accountCreated: () => toastUtils.success('accountCreated', undefined, 'Account created successfully!'),
  authenticationFailed: () => toastUtils.error('authenticationFailed', undefined, 'Authentication failed'),
  networkError: () => toastUtils.error('network', undefined, 'Network error. Please check your connection.'),
  permissionDenied: () => toastUtils.error('permissionDenied', undefined, 'Permission denied'),
};

// Exercise-specific toasts
export const exerciseToasts = {
  correct: () => toastUtils.success('correct', undefined, 'Correct!'),
  incorrect: () => toastUtils.error('incorrect', undefined, 'Incorrect'),
  tryAgain: () => toastUtils.info('tryAgain', undefined, 'Try again'),
  excellent: () => toastUtils.success('excellent', undefined, 'Excellent!'),
  perfect: () => toastUtils.success('perfect', undefined, 'Perfect!'),
  great: () => toastUtils.success('great', undefined, 'Great!'),
};

// Certificate-specific toasts
export const certificateToasts = {
  shared: () => toastUtils.success('certificateShared', undefined, 'Certificate shared successfully!'),
  downloaded: () => toastUtils.success('downloaded', undefined, 'Certificate downloaded!'),
  generateFailed: () => toastUtils.error('createFailed', undefined, 'Failed to generate certificate'),
};

// Organization-specific toasts
export const organizationToasts = {
  created: () => toastUtils.success('organizationCreated', undefined, 'Organization created successfully!'),
  updated: () => toastUtils.success('organizationUpdated', undefined, 'Organization updated successfully!'),
  userInvited: () => toastUtils.success('userInvited', undefined, 'User invited successfully!'),
  requestApproved: () => toastUtils.success('requestApproved', undefined, 'Request approved successfully!'),
  requestRejected: () => toastUtils.success('requestRejected', undefined, 'Request rejected successfully!'),
};

// File operation toasts
export const fileToasts = {
  uploaded: () => toastUtils.success('uploaded', undefined, 'File uploaded successfully!'),
  uploadFailed: () => toastUtils.error('uploadFailed', undefined, 'File upload failed'),
  downloaded: () => toastUtils.success('downloaded', undefined, 'File downloaded successfully!'),
  downloadFailed: () => toastUtils.error('downloadFailed', undefined, 'File download failed'),
  fileTooBig: () => toastUtils.error('fileTooBig', undefined, 'File is too large'),
  invalidFileType: () => toastUtils.error('invalidFileType', undefined, 'Invalid file type'),
};

// Generic operation toasts
export const operationToasts = {
  saving: () => toastUtils.loading('saving', undefined, 'Saving...'),
  loading: () => toastUtils.loading('loading', undefined, 'Loading...'),
  processing: () => toastUtils.loading('processing', undefined, 'Processing...'),
  updating: () => toastUtils.loading('updating', undefined, 'Updating...'),
  deleting: () => toastUtils.loading('deleting', undefined, 'Deleting...'),
  creating: () => toastUtils.loading('creating', undefined, 'Creating...'),
};

// Validation toasts
export const validationToasts = {
  required: (field: string) => toastUtils.error('validation', { field }, `${field} is required`),
  invalidEmail: () => toastUtils.error('validation', undefined, 'Please enter a valid email address'),
  invalidInput: () => toastUtils.error('invalidInput', undefined, 'Invalid input. Please check your data'),
  duplicateEntry: () => toastUtils.error('duplicateEntry', undefined, 'This entry already exists'),
};

// System toasts
export const systemToasts = {
  offline: () => toastUtils.warning('offlineMode', undefined, 'You are currently offline'),
  maintenance: () => toastUtils.warning('maintenanceMode', undefined, 'The system is under maintenance'),
  sessionExpiring: () => toastUtils.warning('sessionExpiring', undefined, 'Your session is about to expire'),
  unsavedChanges: () => toastUtils.warning('unsavedChanges', undefined, 'You have unsaved changes'),
};

// Export the main toast utility as default
export default toastUtils;
