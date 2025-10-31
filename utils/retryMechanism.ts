import { SupabaseError, isRetryable } from './errorHandling';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: SupabaseError) => void;
  shouldRetry?: (error: SupabaseError) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'shouldRetry'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Calculates delay for exponential backoff
 */
function calculateBackoffDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Sleeps for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: SupabaseError | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      // Convert to SupabaseError if needed
      if (error instanceof SupabaseError) {
        lastError = error;
      } else {
        lastError = new SupabaseError(
          'UNKNOWN_ERROR' as any,
          error.message || 'Unknown error',
          error,
          false
        );
      }

      // Check if we should retry
      const shouldRetry = options.shouldRetry
        ? options.shouldRetry(lastError)
        : isRetryable(lastError.type);

      if (!shouldRetry) {
        throw lastError;
      }

      // Don't retry if this was the last attempt
      if (attempt === config.maxAttempts) {
        throw lastError;
      }

      // Calculate delay and wait before retrying
      const delay = calculateBackoffDelay(
        attempt,
        config.initialDelayMs,
        config.maxDelayMs,
        config.backoffMultiplier
      );

      console.warn(
        `Operation failed (attempt ${attempt}/${config.maxAttempts}). Retrying in ${delay}ms...`,
        lastError
      );

      // Call retry callback if provided
      if (options.onRetry) {
        options.onRetry(attempt, lastError);
      }

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry operation failed');
}

/**
 * Creates a retry wrapper for a function
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: Parameters<T>) => {
    return retryOperation(() => fn(...args), options);
  }) as T;
}

/**
 * Payment-specific retry with custom logic
 */
export async function retryPaymentOperation<T>(
  operation: () => Promise<T>,
  onRetry?: (attempt: number) => void
): Promise<T> {
  return retryOperation(operation, {
    maxAttempts: 2, // Only retry once for payments
    initialDelayMs: 2000,
    maxDelayMs: 5000,
    shouldRetry: (error) => {
      // Only retry network errors and generic payment errors
      return (
        error.type === 'NETWORK_ERROR' ||
        error.type === 'PAYMENT_ERROR'
      );
    },
    onRetry: (attempt, error) => {
      console.log(`Retrying payment operation (attempt ${attempt})`, error);
      if (onRetry) {
        onRetry(attempt);
      }
    },
  });
}

/**
 * Quota check retry with custom logic
 */
export async function retryQuotaCheck<T>(
  operation: () => Promise<T>
): Promise<T> {
  return retryOperation(operation, {
    maxAttempts: 2,
    initialDelayMs: 500,
    maxDelayMs: 2000,
    shouldRetry: (error) => {
      // Retry network and database errors, but not quota errors
      return (
        error.type === 'NETWORK_ERROR' ||
        error.type === 'DATABASE_ERROR'
      );
    },
  });
}
