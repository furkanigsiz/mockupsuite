import { supabase } from './supabaseClient';
import { UserProfile, ProfileErrorType } from '../types';

// Database type that matches Supabase schema
interface DbUserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
}

// File validation constants
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * Validates avatar file type and size
 */
function validateAvatarFile(file: File): void {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    const error = new Error(
      `Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image`
    );
    (error as any).type = ProfileErrorType.INVALID_FILE_TYPE;
    throw error;
  }

  if (file.size > MAX_AVATAR_SIZE) {
    const error = new Error(
      `File size exceeds 5MB limit`
    );
    (error as any).type = ProfileErrorType.FILE_TOO_LARGE;
    throw error;
  }
}

/**
 * Transforms database profile to app format
 */
function transformDbProfile(dbProfile: DbUserProfile): UserProfile {
  return {
    id: dbProfile.id,
    userId: dbProfile.user_id,
    firstName: dbProfile.first_name,
    lastName: dbProfile.last_name,
    avatarPath: dbProfile.avatar_path,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
  };
}

/**
 * Fetches user profile from database
 * @param userId - User ID
 * @returns UserProfile or null if profile doesn't exist
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return transformDbProfile(data as DbUserProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Updates user profile in database
 * @param userId - User ID
 * @param updates - Partial profile updates
 * @returns Updated UserProfile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'avatarPath'>>
): Promise<UserProfile> {
  try {
    // Build the update object
    const dbUpdates: Partial<{
      first_name: string | null;
      last_name: string | null;
      avatar_path: string | null;
      updated_at: string;
    }> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.firstName !== undefined) {
      dbUpdates.first_name = updates.firstName;
    }
    if (updates.lastName !== undefined) {
      dbUpdates.last_name = updates.lastName;
    }
    if (updates.avatarPath !== undefined) {
      dbUpdates.avatar_path = updates.avatarPath;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(dbUpdates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      const updateError = new Error(`Failed to update profile: ${error.message}`);
      (updateError as any).type = ProfileErrorType.UPDATE_FAILED;
      throw updateError;
    }

    if (!data) {
      const notFoundError = new Error('Profile not found');
      (notFoundError as any).type = ProfileErrorType.PROFILE_NOT_FOUND;
      throw notFoundError;
    }

    return transformDbProfile(data as DbUserProfile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Uploads avatar image to Supabase Storage
 * @param userId - User ID
 * @param file - Avatar image file
 * @returns Storage path of uploaded avatar
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  try {
    // Validate file
    validateAvatarFile(file);

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/avatars/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('user-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      const uploadError = new Error(`Failed to upload avatar: ${error.message}`);
      (uploadError as any).type = ProfileErrorType.AVATAR_UPLOAD_FAILED;
      throw uploadError;
    }

    return data.path;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

/**
 * Deletes avatar from storage and updates profile
 * @param userId - User ID
 * @param avatarPath - Storage path of avatar to delete
 */
export async function deleteAvatar(userId: string, avatarPath: string): Promise<void> {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('user-files')
      .remove([avatarPath]);

    if (storageError) {
      console.error('Failed to delete avatar from storage:', storageError);
      // Continue to update profile even if storage deletion fails
    }

    // Update profile to remove avatar_path
    await updateUserProfile(userId, { avatarPath: null });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    throw error;
  }
}
