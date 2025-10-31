import { supabase } from './supabaseClient';

// Storage folder types
type StorageFolder = 'uploads' | 'mockups' | 'logos';

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
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
