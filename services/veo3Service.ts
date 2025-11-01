import { GoogleGenAI } from "@google/genai";

export interface Veo3GenerationOptions {
  prompt: string;
  sourceImage: string; // base64
  duration?: number; // 5-10 seconds
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

const VIDEO_GENERATION_TIMEOUT = 90000; // 90 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable (transient failure)
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  
  // Network errors, timeouts, and rate limits are retryable
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('503') ||
    errorMessage.includes('502') ||
    errorMessage.includes('429')
  );
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Video generation timed out after ${ms / 1000} seconds`));
    }, ms);
  });
}

/**
 * Generate a video using Google's Veo 3 model with timeout and retry logic
 * @param options Video generation options including prompt, source image, duration, and aspect ratio
 * @returns Base64 encoded video data
 * @throws Error if video generation fails
 */
export async function generateVideo(
  options: Veo3GenerationOptions
): Promise<string> {
  const { prompt, sourceImage, duration = 7, aspectRatio = '16:9' } = options;

  let lastError: Error | null = null;

  // Retry loop for transient failures
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Add delay before retry attempts
      if (attempt > 0) {
        console.log(`Retrying video generation (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);
        await sleep(RETRY_DELAY * attempt); // Exponential backoff
      }

      // Note: Google's Veo video generation API is not yet publicly available
      // This is a placeholder implementation that will need to be updated when the API is released
      
      // Throw a user-friendly error for now
      throw new Error(
        'Video generation is currently unavailable. Google\'s Veo API is not yet publicly accessible. ' +
        'This feature will be enabled once the API becomes available.'
      );

      // Initialize Google GenAI client (commented out until API is available)
      // const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Create the generation promise
      // const generationPromise = ai.models.generateContent({
      //   model: 'veo-2',
      //   contents: {
      //     parts: [
      //       {
      //         inlineData: {
      //           data: sourceImage,
      //           mimeType: 'image/jpeg',
      //         },
      //       },
      //       {
      //         text: `${prompt}\n\nDuration: ${duration}s\nAspect Ratio: ${aspectRatio}`,
      //       },
      //     ],
      //   },
      // });

      // Race between generation and timeout
      // const response = await Promise.race([
      //   generationPromise,
      //   createTimeoutPromise(VIDEO_GENERATION_TIMEOUT)
      // ]);

      // Extract video data from response
      // if (response.candidates && response.candidates.length > 0) {
      //   for (const part of response.candidates[0].content.parts) {
      //     if (part.inlineData && part.inlineData.data) {
      //       return part.inlineData.data;
      //     }
      //   }
      // }

      // Check for text response which might indicate an error
      // const textResponse = response.text ? response.text.trim() : "";
      // if (textResponse) {
      //   throw new Error(`Model returned a text response instead of a video: "${textResponse}"`);
      // }

      // throw new Error("No video was generated. The request may have been blocked due to safety settings.");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error occurred");
      
      console.error(`Error generating video (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, error);

      // If this is a retryable error and we have retries left, continue
      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        continue;
      }

      // Otherwise, throw the error with user-friendly message
      break;
    }
  }

  // If we exhausted all retries, throw the last error
  if (lastError) {
    const errorMessage = lastError.message || "Unknown error";
    
    // Provide user-friendly error messages with type information
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      const error = new Error('Video generation took too long. Please try again with a simpler prompt or shorter duration.');
      (error as any).type = 'GENERATION_TIMEOUT';
      throw error;
    } else if (errorMessage.includes('rate limit')) {
      const error = new Error('Too many requests. Please wait a moment and try again.');
      (error as any).type = 'VIDEO_GENERATION_FAILED';
      throw error;
    } else if (errorMessage.includes('safety')) {
      const error = new Error('Your request was blocked by safety filters. Please try a different prompt.');
      (error as any).type = 'VIDEO_GENERATION_FAILED';
      throw error;
    } else if (errorMessage.includes('network')) {
      const error = new Error('Network error occurred. Please check your connection and try again.');
      (error as any).type = 'NETWORK_ERROR';
      throw error;
    } else if (errorMessage.includes('invalid') || errorMessage.includes('source')) {
      const error = new Error('Invalid source image. Please upload a valid image for video generation.');
      (error as any).type = 'INVALID_SOURCE_IMAGE';
      throw error;
    } else {
      const error = new Error(`Failed to generate video: ${errorMessage}`);
      (error as any).type = 'VIDEO_GENERATION_FAILED';
      throw error;
    }
  }

  const error = new Error("An unknown error occurred while generating the video.");
  (error as any).type = 'VIDEO_GENERATION_FAILED';
  throw error;
}
