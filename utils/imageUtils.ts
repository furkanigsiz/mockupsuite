export const applyWatermark = (baseImageBase64: string, watermarkImageBase64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const baseImage = new Image();
    baseImage.src = `data:image/png;base64,${baseImageBase64}`;
    baseImage.onload = () => {
      const watermarkImage = new Image();
      watermarkImage.src = `data:image/png;base64,${watermarkImageBase64}`;
      watermarkImage.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = baseImage.width;
        canvas.height = baseImage.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        // Draw base image
        ctx.drawImage(baseImage, 0, 0);

        // Calculate watermark size and position
        const padding = canvas.width * 0.05; // 5% padding
        const maxWatermarkWidth = canvas.width * 0.2; // Max 20% of canvas width
        const maxWatermarkHeight = canvas.height * 0.2; // Max 20% of canvas height
        
        let watermarkWidth = watermarkImage.width;
        let watermarkHeight = watermarkImage.height;

        if (watermarkWidth > maxWatermarkWidth) {
          watermarkHeight = (maxWatermarkWidth / watermarkWidth) * watermarkHeight;
          watermarkWidth = maxWatermarkWidth;
        }
        if (watermarkHeight > maxWatermarkHeight) {
          watermarkWidth = (maxWatermarkHeight / watermarkHeight) * watermarkWidth;
          watermarkHeight = maxWatermarkHeight;
        }
        
        const x = canvas.width - watermarkWidth - padding;
        const y = canvas.height - watermarkHeight - padding;

        // Draw watermark
        ctx.globalAlpha = 0.8; // Set opacity
        ctx.drawImage(watermarkImage, x, y, watermarkWidth, watermarkHeight);
        
        // Resolve with new image
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl.split(',')[1]);
      };
      watermarkImage.onerror = (err) => reject(err);
    };
    baseImage.onerror = (err) => reject(err);
  });
};

/**
 * Generates a thumbnail from an image
 * @param imageSource - Base64 string or URL of the image
 * @param maxWidth - Maximum width of the thumbnail (default: 300px)
 * @param maxHeight - Maximum height of the thumbnail (default: 300px)
 * @returns Promise resolving to base64 encoded thumbnail
 */
export const generateThumbnail = (
  imageSource: string,
  maxWidth: number = 300,
  maxHeight: number = 300
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    
    // Handle base64 strings
    if (!imageSource.startsWith('data:') && !imageSource.startsWith('http')) {
      image.src = `data:image/png;base64,${imageSource}`;
    } else {
      image.src = imageSource;
    }

    image.onload = () => {
      // Calculate thumbnail dimensions while maintaining aspect ratio
      let width = image.width;
      let height = image.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      // Use better image smoothing for thumbnails
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(image, 0, 0, width, height);

      // Convert to base64 (JPEG for smaller file size)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve(dataUrl.split(',')[1]);
    };

    image.onerror = (err) => reject(new Error('Failed to load image for thumbnail generation'));
  });
};
