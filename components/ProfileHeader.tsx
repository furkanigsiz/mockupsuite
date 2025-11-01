import React, { useRef, useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { LoadingSpinner } from './LoadingSpinner';
import { getImageUrl } from '../services/storageService';
import { uploadAvatar, updateUserProfile } from '../services/profileService';
import { ProfileErrorType } from '../types';

interface ProfileHeaderProps {
  userId: string;
  avatarPath: string | null;
  userName: string;
  userEmail: string;
  onAvatarUpdate: (newAvatarPath: string) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userId,
  avatarPath,
  userName,
  userEmail,
  onAvatarUpdate,
}) => {
  const { t } = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load avatar URL when avatarPath changes
  useEffect(() => {
    if (avatarPath) {
      getImageUrl(avatarPath)
        .then(url => setAvatarUrl(url))
        .catch(err => {
          console.error('Failed to load avatar:', err);
          setAvatarUrl(null);
        });
    } else {
      setAvatarUrl(null);
    }
  }, [avatarPath]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw {
          type: ProfileErrorType.INVALID_FILE_TYPE,
          message: t('error_validation_invalid_file_type', { 
            allowedTypes: 'JPEG, PNG, WebP, GIF' 
          }),
        };
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw {
          type: ProfileErrorType.FILE_TOO_LARGE,
          message: t('error_validation_file_too_large', { maxSize: '5' }),
        };
      }

      // Upload avatar
      const newAvatarPath = await uploadAvatar(userId, file);

      // Update profile with new avatar path
      await updateUserProfile(userId, { avatarPath: newAvatarPath });

      // Update parent component
      onAvatarUpdate(newAvatarPath);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      
      // Handle specific error types
      if (err.type === ProfileErrorType.INVALID_FILE_TYPE) {
        setError(t('profile_invalid_file_type'));
      } else if (err.type === ProfileErrorType.FILE_TOO_LARGE) {
        setError(t('profile_file_too_large'));
      } else if (err.type === ProfileErrorType.AVATAR_UPLOAD_FAILED) {
        setError(t('profile_avatar_upload_error'));
      } else {
        setError(err.message || t('profile_avatar_upload_error'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Avatar Display */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName || 'User avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-3xl sm:text-4xl text-slate-400 dark:text-white/40">
                person
              </span>
            )}
          </div>
          
          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>

        {/* User Info and Upload Button */}
        <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
            {userName || 'User'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            {userEmail}
          </p>
          
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 
                     text-slate-900 dark:text-white rounded-lg text-sm font-medium
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2
                     focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-background-dark"
            aria-label={isUploading ? 'Uploading profile picture' : 'Upload new profile picture'}
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              upload
            </span>
            {isUploading ? t('profile_uploading_avatar') : t('profile_upload_avatar')}
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload profile picture"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};
