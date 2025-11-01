import { supabase } from './supabaseClient';

// Storage folder types
type StorageFolder = 'uploads' | 'mockups' | 'logos' | 'videos';

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

// URL cache to minimize API calls
const urlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Validates file type and size
 */
function validateFile(file: File): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }
}

/**
 * Generates a unique file path with userId and timestamp
 */
function generateFilePath(
  userId: string,
  folder: StorageFolder,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${folder}/${timestamp}_${sanitizedFileName}`;
}

/**
 * Uploads an image file to Supabase storage
 */
export async function uploadImage(
  userId: string,
  file: File,
  folder: StorageFolder
): Promise<string> {
  // Validate file
  validateFile(file);

  // Generate unique file path
  const filePath = generateFilePath(userId, folder, file.name);

  // Upload to Supabase storage
  const { data, error } = await supabase.storage
    .from('user-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  return data.path;
}

/**
 * Converts base64 string to Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  
  // Decode base64
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Uploads a base64 encoded image to Supabase storage
 */
export async function uploadBase64Image(
  userId: string,
  base64: string,
  fileName: string,
  folder: StorageFolder
): Promise<string> {
  // Extract MIME type from base64 string
  let mimeType = 'image/png'; // default
  if (base64.startsWith('data:')) {
    const match = base64.match(/data:([^;]+);/);
    if (match) {
      mimeType = match[1];
    }
  }

  // Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    throw new Error(
      `Invalid image type: ${mimeType}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    );
  }

  // Convert base64 to Blob
  const blob = base64ToBlob(base64, mimeType);

  // Validate size
  if (blob.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  // Generate unique file path
  const filePath = generateFilePath(userId, folder, fileName);

  // Upload to Supabase storage
  const { data, error } = await supabase.storage
    .from('user-files')
    .upload(filePath, blob, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload base64 image: ${error.message}`);
  }

  return data.path;
}

/**
 * Gets a signed URL for an image with caching
 * Signed URLs expire after 1 hour (3600 seconds)
 */
export async function getImageUrl(path: string): Promise<string> {
  // Check cache first
  const cached = urlCache.get(path);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  // Generate signed URL (expires in 1 hour)
  const { data, error } = await supabase.storage
    .from('user-files')
    .createSignedUrl(path, 3600);

  if (error) {
    throw new Error(`Failed to get image URL: ${error.message}`);
  }

  if (!data.signedUrl) {
    throw new Error('Failed to generate signed URL');
  }

  // Cache the URL (expire 5 minutes before actual expiration to be safe)
  const expiresAt = Date.now() + (3600 - 300) * 1000;
  urlCache.set(path, { url: data.signedUrl, expiresAt });

  return data.signedUrl;
}

/**
 * Deletes an image from Supabase storage
 */
export async function deleteImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('user-files')
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }

  // Remove from cache
  urlCache.delete(path);
}

/**
 * Clears the URL cache (useful for testing or manual cache invalidation)
 */
export function clearUrlCache(): void {
  urlCache.clear();
}

/**
 * Uploads an image with its thumbnail version
 * @param userId - User ID
 * @param file - Image file to upload
 * @param folder - Storage folder
 * @returns Object containing paths to both full-size and thumbnail images
 */
export async function uploadImageWithThumbnail(
  userId: string,
  file: File,
  folder: StorageFolder
): Promise<{ imagePath: string; thumbnailPath: string }> {
  // Upload the full-size image first
  const imagePath = await uploadImage(userId, file, folder);

  try {
    // Generate thumbnail
    const { generateThumbnail } = await import('../utils/imageUtils');
    
    // Read file as base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const thumbnailBase64 = await generateThumbnail(base64);
    
    // Upload thumbnail with _thumb suffix
    const thumbnailFileName = file.name.replace(/(\.[^.]+)$/, '_thumb$1');
    const thumbnailPath = await uploadBase64Image(
      userId,
      thumbnailBase64,
      thumbnailFileName,
      folder
    );

    return { imagePath, thumbnailPath };
  } catch (error) {
    // If thumbnail generation fails, return only the main image path
    console.error('Failed to generate thumbnail:', error);
    return { imagePath, thumbnailPath: imagePath };
  }
}

/**
 * Uploads a base64 image with its thumbnail version
 * @param userId - User ID
 * @param base64 - Base64 encoded image
 * @param fileName - File name
 * @param folder - Storage folder
 * @returns Object containing paths to both full-size and thumbnail images
 */
export async function uploadBase64ImageWithThumbnail(
  userId: string,
  base64: string,
  fileName: string,
  folder: StorageFolder
): Promise<{ imagePath: string; thumbnailPath: string }> {
  // Upload the full-size image first
  const imagePath = await uploadBase64Image(userId, base64, fileName, folder);

  try {
    // Generate thumbnail
    const { generateThumbnail } = await import('../utils/imageUtils');
    const thumbnailBase64 = await generateThumbnail(base64);
    
    // Upload thumbnail with _thumb suffix
    const thumbnailFileName = fileName.replace(/(\.[^.]+)$/, '_thumb$1');
    const thumbnailPath = await uploadBase64Image(
      userId,
      thumbnailBase64,
      thumbnailFileName,
      folder
    );

    return { imagePath, thumbnailPath };
  } catch (error) {
    // If thumbnail generation fails, return only the main image path
    console.error('Failed to generate thumbnail:', error);
    return { imagePath, thumbnailPath: imagePath };
  }
}

/**
 * Validates video file type and size
 */
function validateVideoFile(file: File): void {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    const error = new Error(
      `Invalid video type: ${file.type}. Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`
    );
    (error as any).type = 'UNSUPPORTED_FORMAT';
    throw error;
  }

  if (file.size > MAX_VIDEO_SIZE) {
    const error = new Error(
      `Video size exceeds maximum allowed size of ${MAX_VIDEO_SIZE / 1024 / 1024}MB`
    );
    (error as any).type = 'VALIDATION_ERROR';
    throw error;
  }
}

/**
 * Uploads a video file to Supabase storage with retry logic
 * @param userId - User ID
 * @param file - Video file to upload
 * @param folder - Storage folder (should be 'videos')
 * @returns Storage path of the uploaded video
 */
export async function uploadVideo(
  userId: string,
  file: File,
  folder: StorageFolder = 'videos'
): Promise<string> {
  // Validate video file
  validateVideoFile(file);

  // Generate unique file path
  const filePath = generateFilePath(userId, folder, file.name);

  // Retry logic for upload
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('user-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        const uploadError = new Error(`Failed to upload video: ${error.message}`);
        (uploadError as any).type = 'VIDEO_UPLOAD_FAILED';
        throw uploadError;
      }

      return data.path;
    } catch (error) {
      lastError = error as Error;
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If all retries failed, throw the last error with type information
  const finalError = new Error(`Failed to upload video after ${maxRetries} attempts: ${lastError?.message}`);
  (finalError as any).type = 'VIDEO_UPLOAD_FAILED';
  throw finalError;
}

/**
 * Gets a signed URL for a video with caching
 * Signed URLs expire after 1 hour (3600 seconds)
 * @param path - Storage path of the video
 * @returns Signed URL for the video
 */
export async function getVideoUrl(path: string): Promise<string> {
  // Check cache first
  const cached = urlCache.get(path);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  try {
    // Generate signed URL (expires in 1 hour)
    const { data, error } = await supabase.storage
      .from('user-files')
      .createSignedUrl(path, 3600);

    if (error) {
      throw new Error(`Failed to get video URL: ${error.message}`);
    }

    if (!data.signedUrl) {
      throw new Error('Failed to generate signed URL for video');
    }

    // Cache the URL (expire 5 minutes before actual expiration to be safe)
    const expiresAt = Date.now() + (3600 - 300) * 1000;
    urlCache.set(path, { url: data.signedUrl, expiresAt });

    return data.signedUrl;
  } catch (error) {
    throw new Error(`Failed to retrieve video URL: ${(error as Error).message}`);
  }
}

/**
 * Deletes a video from Supabase storage
 * @param path - Storage path of the video
 */
export async function deleteVideo(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('user-files')
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete video: ${error.message}`);
    }

    // Remove from cache
    urlCache.delete(path);
  } catch (error) {
    throw new Error(`Failed to delete video: ${(error as Error).message}`);
  }
}
