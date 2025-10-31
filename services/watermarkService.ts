import { getCurrentPlan } from './subscriptionService';

/**
 * Watermark Service
 * Handles watermark application and image resizing for free tier users
 */

/**
 * Add watermark to an image
 * @param imageBase64 - Base64 encoded image string (with or without data URL prefix)
 * @param text - Watermark text to display
 * @returns Base64 encoded image with watermark
 */
export async function addWatermark(imageBase64: string, text: string = 'MockupSuite AI generated'): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create an image element
    const img = new Image();
    
    // Handle image load
    img.onload = () => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Configure watermark styling
        const fontSize = 16;
        const padding = 10;
        const font = `${fontSize}px Arial`;
        
        ctx.font = font;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;
        
        // Calculate position (bottom-right corner)
        const x = canvas.width - textWidth - padding * 2;
        const y = canvas.height - padding * 2;
        
        // Draw semi-transparent black background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(
          x - padding,
          y - textHeight - padding,
          textWidth + padding * 2,
          textHeight + padding * 2
        );
        
        // Draw semi-transparent white text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = font;
        ctx.textBaseline = 'top';
        ctx.fillText(text, x, y - textHeight);
        
        // Convert canvas to base64
        const watermarkedImage = canvas.toDataURL('image/png');
        resolve(watermarkedImage);
      } catch (error) {
        reject(error);
      }
    };
    
    // Handle image load error
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Set image source
    // Handle both data URL and raw base64
    if (imageBase64.startsWith('data:')) {
      img.src = imageBase64;
    } else {
      img.src = `data:image/png;base64,${imageBase64}`;
    }
  });
}

/**
 * Check if watermark should be applied for a user
 * @param userId - User ID to check
 * @returns True if user is on free tier and should have watermark applied
 */
export async function shouldApplyWatermark(userId: string): Promise<boolean> {
  try {
    const subscription = await getCurrentPlan(userId);
    
    // If no subscription found, apply watermark (default to free tier behavior)
    if (!subscription) {
      return true;
    }
    
    // Apply watermark only for free tier users
    return subscription.planId === 'free';
  } catch (error) {
    console.error('Error checking if watermark should be applied:', error);
    // Default to applying watermark on error (safer option)
    return true;
  }
}

/**
 * Resize image to maximum dimension
 * @param imageBase64 - Base64 encoded image string (with or without data URL prefix)
 * @param maxDimension - Maximum width or height in pixels
 * @returns Base64 encoded resized image
 */
export async function resizeImage(imageBase64: string, maxDimension: number = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create an image element
    const img = new Image();
    
    // Handle image load
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let newWidth = img.width;
        let newHeight = img.height;
        
        if (img.width > img.height) {
          // Landscape or square
          if (img.width > maxDimension) {
            newWidth = maxDimension;
            newHeight = Math.round((img.height * maxDimension) / img.width);
          }
        } else {
          // Portrait
          if (img.height > maxDimension) {
            newHeight = maxDimension;
            newWidth = Math.round((img.width * maxDimension) / img.height);
          }
        }
        
        // Create canvas with new dimensions
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Convert canvas to base64
        const resizedImage = canvas.toDataURL('image/png');
        resolve(resizedImage);
      } catch (error) {
        reject(error);
      }
    };
    
    // Handle image load error
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Set image source
    // Handle both data URL and raw base64
    if (imageBase64.startsWith('data:')) {
      img.src = imageBase64;
    } else {
      img.src = `data:image/png;base64,${imageBase64}`;
    }
  });
}

/**
 * Process image for free tier users
 * Applies both resizing and watermark
 * @param imageBase64 - Base64 encoded image string
 * @param userId - User ID to check tier
 * @returns Processed image (resized and watermarked if free tier, original if paid)
 */
export async function processImageForUser(imageBase64: string, userId: string): Promise<string> {
  const shouldWatermark = await shouldApplyWatermark(userId);
  
  if (!shouldWatermark) {
    // Paid user - return original image
    return imageBase64;
  }
  
  // Free tier user - resize and add watermark
  const resized = await resizeImage(imageBase64, 512);
  const watermarked = await addWatermark(resized);
  
  return watermarked;
}
