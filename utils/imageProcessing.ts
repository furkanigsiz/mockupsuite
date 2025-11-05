// Image processing utilities for background removal and smart alignment

/**
 * Remove background from an image using canvas manipulation
 * This is a simple implementation - for production, consider using:
 * - @imgly/background-removal (client-side)
 * - remove.bg API
 * - Cloudinary API
 */
export const removeBackground = async (base64Image: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple background removal: make white/light pixels transparent
      // This is a basic implementation - adjust threshold as needed
      const threshold = 240;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // If pixel is close to white, make it transparent
        if (r > threshold && g > threshold && b > threshold) {
          data[i + 3] = 0; // Set alpha to 0
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Convert back to base64
      const result = canvas.toDataURL('image/png').split(',')[1];
      resolve(result);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = `data:image/png;base64,${base64Image}`;
  });
};

/**
 * Smart alignment: fit image to target dimensions while maintaining aspect ratio
 */
export const smartAlign = async (
  base64Image: string,
  targetWidth: number,
  targetHeight: number,
  mode: 'contain' | 'cover' = 'contain'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Calculate scaling and positioning
      const imgAspect = img.width / img.height;
      const targetAspect = targetWidth / targetHeight;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (mode === 'contain') {
        // Fit entire image within target dimensions
        if (imgAspect > targetAspect) {
          drawWidth = targetWidth;
          drawHeight = targetWidth / imgAspect;
          offsetX = 0;
          offsetY = (targetHeight - drawHeight) / 2;
        } else {
          drawHeight = targetHeight;
          drawWidth = targetHeight * imgAspect;
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = 0;
        }
      } else {
        // Cover entire target area
        if (imgAspect > targetAspect) {
          drawHeight = targetHeight;
          drawWidth = targetHeight * imgAspect;
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = 0;
        } else {
          drawWidth = targetWidth;
          drawHeight = targetWidth / imgAspect;
          offsetX = 0;
          offsetY = (targetHeight - drawHeight) / 2;
        }
      }
      
      // Fill background with transparent
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      
      // Draw image with smart alignment
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      // Convert to base64
      const result = canvas.toDataURL('image/png').split(',')[1];
      resolve(result);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = `data:image/png;base64,${base64Image}`;
  });
};

/**
 * Copy image to clipboard
 */
export const copyImageToClipboard = async (base64Image: string): Promise<void> => {
  try {
    // Convert base64 to blob
    const response = await fetch(`data:image/png;base64,${base64Image}`);
    const blob = await response.blob();
    
    // Use Clipboard API
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob
      })
    ]);
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error);
    throw new Error('Failed to copy image. Your browser may not support this feature.');
  }
};
