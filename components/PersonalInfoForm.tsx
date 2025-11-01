import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { updateUserProfile } from '../services/profileService';
import { ProfileErrorType } from '../types';
import { useToast } from './Toast';

interface PersonalInfoFormProps {
  userId: string;
  initialFirstName: string | null;
  initialLastName: string | null;
  email: string;
  onProfileUpdate: (firstName: string | null, lastName: string | null) => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  userId,
  initialFirstName,
  initialLastName,
  email,
  onProfileUpdate,
}) => {
  const { t } = useTranslations();
  const toast = useToast();
  
  // Form state
  const [firstName, setFirstName] = useState(initialFirstName || '');
  const [lastName, setLastName] = useState(initialLastName || '');
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    firstName?: string;
    lastName?: string;
  }>({});

  // Screen reader announcements
  const [srAnnouncement, setSrAnnouncement] = useState<string>('');
  const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Announce to screen readers
  const announceToScreenReader = (message: string) => {
    setSrAnnouncement(message);
    
    // Clear previous timeout
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }
    
    // Clear announcement after 3 seconds
    announcementTimeoutRef.current = setTimeout(() => {
      setSrAnnouncement('');
    }, 3000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
    };
  }, []);

  // Handle keyboard events
  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    // Handle Enter key to submit form
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isSaving && hasUnsavedChanges && isFormValid) {
        handleSave();
      }
    }
    
    // Handle Escape key to cancel
    if (event.key === 'Escape') {
      event.preventDefault();
      if (hasUnsavedChanges) {
        handleCancel();
      }
    }
  };

  // Track unsaved changes
  const hasUnsavedChanges = 
    firstName !== (initialFirstName || '') || 
    lastName !== (initialLastName || '');

  // Reset form when initial values change
  useEffect(() => {
    setFirstName(initialFirstName || '');
    setLastName(initialLastName || '');
  }, [initialFirstName, initialLastName]);

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: { firstName?: string; lastName?: string } = {};

    if (!firstName.trim()) {
      errors.firstName = t('profile_first_name_required');
    } else if (firstName.length > 50) {
      errors.firstName = t('profile_first_name_too_long');
    }

    if (!lastName.trim()) {
      errors.lastName = t('profile_last_name_required');
    } else if (lastName.length > 50) {
      errors.lastName = t('profile_last_name_too_long');
    }

    setValidationErrors(errors);
    
    // Announce validation errors to screen readers
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors).join('. ');
      announceToScreenReader(`Form validation failed. ${errorMessages}`);
    }
    
    return Object.keys(errors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    setError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    announceToScreenReader('Saving profile changes');

    try {
      // Update profile
      await updateUserProfile(userId, {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
      });

      // Update parent component
      onProfileUpdate(firstName.trim() || null, lastName.trim() || null);

      // Show success toast (auto-dismisses after 3 seconds)
      toast.success(t('profile_update_success'), 3000);
      
      // Announce success to screen readers
      announceToScreenReader('Profile updated successfully');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      
      // Handle specific error types
      let errorMessage: string;
      if (err.type === ProfileErrorType.UPDATE_FAILED) {
        errorMessage = t('profile_update_failed');
      } else if (err.type === ProfileErrorType.PROFILE_NOT_FOUND) {
        errorMessage = t('profile_not_found');
      } else {
        errorMessage = err.message || t('profile_update_failed');
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Announce error to screen readers
      announceToScreenReader(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFirstName(initialFirstName || '');
    setLastName(initialLastName || '');
    setValidationErrors({});
    setError(null);
  };

  const isFormValid = !validationErrors.firstName && !validationErrors.lastName;

  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6">
      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {srAnnouncement}
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
        {t('profile_personal_info_title')}
      </h3>

      {/* Form Grid */}
      <form onKeyDown={handleKeyDown}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* First Name Input */}
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
          >
            {t('profile_first_name')}
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setValidationErrors({ ...validationErrors, firstName: undefined });
            }}
            className={`w-full px-4 py-2 rounded-lg border ${
              validationErrors.firstName
                ? 'border-red-500 dark:border-red-500'
                : 'border-slate-300 dark:border-white/20'
            } bg-white dark:bg-white/5 text-slate-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark
                       placeholder:text-slate-400 dark:placeholder:text-slate-500`}
            placeholder={t('profile_first_name_placeholder')}
            maxLength={50}
            aria-invalid={!!validationErrors.firstName}
            aria-describedby={validationErrors.firstName ? 'firstName-error' : undefined}
          />
          {validationErrors.firstName && (
            <p id="firstName-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {validationErrors.firstName}
            </p>
          )}
        </div>

        {/* Last Name Input */}
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
          >
            {t('profile_last_name')}
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setValidationErrors({ ...validationErrors, lastName: undefined });
            }}
            className={`w-full px-4 py-2 rounded-lg border ${
              validationErrors.lastName
                ? 'border-red-500 dark:border-red-500'
                : 'border-slate-300 dark:border-white/20'
            } bg-white dark:bg-white/5 text-slate-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark
                       placeholder:text-slate-400 dark:placeholder:text-slate-500`}
            placeholder={t('profile_last_name_placeholder')}
            maxLength={50}
            aria-invalid={!!validationErrors.lastName}
            aria-describedby={validationErrors.lastName ? 'lastName-error' : undefined}
          />
          {validationErrors.lastName && (
            <p id="lastName-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {validationErrors.lastName}
            </p>
          )}
        </div>

        {/* Email Input (Read-only) */}
        <div className="md:col-span-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
          >
            {t('profile_email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            readOnly
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-white/20
                     bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400
                     cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('profile_email_readonly_note')}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges || !isFormValid}
          className="w-full sm:w-auto px-5 py-3 bg-primary/20 text-primary hover:bg-primary/30
                   rounded-lg font-medium transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2
                   focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark"
          aria-label={isSaving ? 'Saving profile changes' : 'Save profile changes'}
        >
          {isSaving ? (
            <>
              <span className="material-symbols-outlined text-lg animate-spin" aria-hidden="true">
                progress_activity
              </span>
              {t('profile_saving')}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg" aria-hidden="true">
                save
              </span>
              {t('profile_save_changes')}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving || !hasUnsavedChanges}
          className="w-full sm:w-auto px-5 py-3 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20
                   text-slate-900 dark:text-white rounded-lg font-medium transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-background-dark"
          aria-label="Cancel profile changes"
        >
          {t('profile_cancel')}
        </button>
      </div>
      </form>
    </div>
  );
};
