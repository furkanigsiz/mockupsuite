import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { PersonalInfoForm } from './PersonalInfoForm';
import { SubscriptionSection } from './SubscriptionSection';
import { UpgradeModal } from './UpgradeModal';
import { getUserProfile, updateUserProfile } from '../services/profileService';
import { UserProfile, PlanId } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { useToast, ToastContainer } from './Toast';
import * as storageService from '../services/storageService';

interface ProfilePageProps {
  onNavigateToGallery: () => void;
  onUpgrade?: (planId: PlanId) => void;
}

type ProfileSection = 'profile' | 'subscription' | 'generations';

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigateToGallery, onUpgrade }) => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Profile data state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  
  // UI state
  const [activeSection, setActiveSection] = useState<ProfileSection>('profile');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Screen reader announcements
  const [srAnnouncement, setSrAnnouncement] = useState<string>('');

  // Fetch user profile on mount
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      setIsLoadingProfile(true);
      setError(null);

      const userProfile = await getUserProfile(user.id);
      
      if (userProfile) {
        setProfile(userProfile);
        setFirstName(userProfile.firstName);
        setLastName(userProfile.lastName);
        setAvatarPath(userProfile.avatarPath);
      } else {
        // Profile doesn't exist yet - this is okay, it will be created on first update
        setProfile(null);
        setFirstName(null);
        setLastName(null);
        setAvatarPath(null);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Please select an image file (JPEG, PNG, WebP, or GIF)';
      toast.error(errorMsg);
      setSrAnnouncement(`Error: ${errorMsg}`);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'Image size must be less than 5MB';
      toast.error(errorMsg);
      setSrAnnouncement(`Error: ${errorMsg}`);
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setSrAnnouncement('Uploading profile picture');

      // Upload to storage
      const { imagePath } = await storageService.uploadImageWithThumbnail(
        user.id,
        file,
        'uploads'
      );

      // Update profile with new avatar path
      await updateUserProfile(user.id, {
        firstName,
        lastName,
        avatarPath: imagePath,
      });

      // Get signed URL for display
      const avatarUrl = await storageService.getImageUrl(imagePath);
      setAvatarPath(avatarUrl);
      
      // Show success message
      const successMsg = 'Profile picture updated successfully';
      toast.success(successMsg, 3000);
      setSrAnnouncement(successMsg);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar. Please try again.';
      toast.error(errorMessage);
      setSrAnnouncement(`Error: ${errorMessage}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = (newFirstName: string | null, newLastName: string | null) => {
    setFirstName(newFirstName);
    setLastName(newLastName);
  };

  // Handle manage subscription
  const handleManageSubscription = () => {
    setShowUpgradeModal(true);
  };

  // Handle upgrade
  const handleUpgrade = async (planId: PlanId) => {
    // Close the modal first
    setShowUpgradeModal(false);
    
    // Call the parent's onUpgrade handler to open payment checkout
    if (onUpgrade) {
      onUpgrade(planId);
    }
  };

  // Show loading state
  if (isLoadingProfile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-red-500 mb-4">error</span>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadUserProfile}
            className="px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg font-medium transition-colors
                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark"
            aria-label="Retry loading profile"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get display name
  const displayName = firstName && lastName 
    ? `${firstName} ${lastName}` 
    : firstName || lastName || user.email.split('@')[0];

  // Tab configuration
  const tabs = [
    { id: 'profile' as ProfileSection, label: 'Profile', icon: 'person' },
    { id: 'subscription' as ProfileSection, label: 'Subscription', icon: 'credit_card' },
    { id: 'generations' as ProfileSection, label: 'My Generations', icon: 'photo_library' },
  ];

  return (
    <>
      <ToastContainer messages={toast.messages} onClose={toast.closeToast} />
      <div 
        className="min-h-screen bg-background-light dark:bg-background-dark"
        aria-label="User profile page"
      >
        {/* Screen reader announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {srAnnouncement}
        </div>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden mb-6">
          {/* Cover gradient */}
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />
          
          {/* Profile info */}
          <div className="px-6 pb-6 -mt-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-[#1c2527] overflow-hidden">
                  {avatarPath ? (
                    <img 
                      src={avatarPath} 
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-slate-400 dark:text-slate-500">
                        person
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Upload overlay */}
                <label 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl"
                  aria-label="Upload profile picture"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                    aria-label="Select profile picture file"
                  />
                  {isUploadingAvatar ? (
                    <div 
                      className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"
                      role="status"
                      aria-label="Uploading avatar"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-white text-3xl" aria-hidden="true">
                      photo_camera
                    </span>
                  )}
                </label>
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white truncate">
                  {displayName}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 truncate mt-1">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav 
              className="flex gap-1 mt-6 border-b border-slate-200 dark:border-white/10"
              role="navigation"
              aria-label="Profile sections"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'generations') {
                      onNavigateToGallery();
                      setSrAnnouncement('Navigating to My Generations');
                    } else {
                      setActiveSection(tab.id);
                      setSrAnnouncement(`Switched to ${tab.label} section`);
                    }
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-3 font-medium transition-colors relative
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset
                    ${activeSection === tab.id
                      ? 'text-primary'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }
                  `}
                  aria-label={`${tab.label} section`}
                  aria-current={activeSection === tab.id ? 'page' : undefined}
                >
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">
                    {tab.icon}
                  </span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  
                  {/* Active indicator */}
                  {activeSection === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" aria-hidden="true" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <PersonalInfoForm
              userId={user.id}
              initialFirstName={firstName}
              initialLastName={lastName}
              email={user.email}
              onProfileUpdate={handleProfileUpdate}
            />
          )}

          {/* Subscription Section */}
          {activeSection === 'subscription' && (
            <SubscriptionSection onManageSubscription={handleManageSubscription} />
          )}
        </div>
      </main>

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgrade}
          trigger="manual"
        />
      </div>
    </>
  );
};

export default ProfilePage;
