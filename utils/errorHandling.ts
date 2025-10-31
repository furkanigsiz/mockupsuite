/**
 * Error handling utilities for Supabase operations
 */

// Error types for categorization
export enum SupabaseErrorType {
  AUTH_ERROR = 'AUTH_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  INVALID_CARD = 'INVALID_CARD',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  QUOTA_ERROR = 'QUOTA_ERROR',
  NO_CREDITS = 'NO_CREDITS',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Custom error class for Supabase operations
export class SupabaseError extends Error {
  type: SupabaseErrorType;
  originalError?: any;
  retryable: boolean;

  constructor(
    type: SupabaseErrorType,
    message: string,
    originalError?: any,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'SupabaseError';
    this.type = type;
    this.originalError = originalError;
    this.retryable = retryable;
  }
}

/**
 * Categorizes an error based on its properties
 */
export function categorizeError(error: any): SupabaseErrorType {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || error?.status;
  const errorType = error?.type;

  // Payment-specific errors
  if (errorType === 'PAYMENT_FAILED' || errorMessage.includes('payment failed')) {
    return SupabaseErrorType.PAYMENT_FAILED;
  }

  if (errorType === 'PAYMENT_CANCELLED' || errorMessage.includes('payment cancelled')) {
    return SupabaseErrorType.PAYMENT_CANCELLED;
  }

  if (errorType === 'INVALID_CARD' || errorMessage.includes('invalid card') || errorMessage.includes('card declined')) {
    return SupabaseErrorType.INVALID_CARD;
  }

  if (errorType === 'INSUFFICIENT_FUNDS' || errorMessage.includes('insufficient funds') || errorMessage.includes('yetersiz bakiye')) {
    return SupabaseErrorType.INSUFFICIENT_FUNDS;
  }

  if (errorMessage.includes('payment') || errorMessage.includes('ödeme')) {
    return SupabaseErrorType.PAYMENT_ERROR;
  }

  // Quota-specific errors
  if (errorType === 'QUOTA_EXCEEDED' || errorMessage.includes('quota exceeded') || errorMessage.includes('kota aşıldı')) {
    return SupabaseErrorType.QUOTA_ERROR;
  }

  if (errorType === 'NO_CREDITS' || errorMessage.includes('no credits') || errorMessage.includes('kredi yok')) {
    return SupabaseErrorType.NO_CREDITS;
  }

  if (errorType === 'SUBSCRIPTION_EXPIRED' || errorMessage.includes('subscription expired') || errorMessage.includes('abonelik süresi doldu')) {
    return SupabaseErrorType.SUBSCRIPTION_EXPIRED;
  }

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorCode === 'NETWORK_ERROR' ||
    !navigator.onLine
  ) {
    return SupabaseErrorType.NETWORK_ERROR;
  }

  // Authentication errors
  if (
    errorMessage.includes('auth') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('invalid credentials') ||
    errorMessage.includes('session') ||
    errorCode === 401 ||
    errorCode === 403
  ) {
    return SupabaseErrorType.AUTH_ERROR;
  }

  // Storage errors
  if (
    errorMessage.includes('storage') ||
    errorMessage.includes('upload') ||
    errorMessage.includes('file') ||
    errorMessage.includes('bucket')
  ) {
    return SupabaseErrorType.STORAGE_ERROR;
  }

  // Quota exceeded errors
  if (
    errorMessage.includes('quota') ||
    errorMessage.includes('limit exceeded') ||
    errorMessage.includes('too large') ||
    errorCode === 413
  ) {
    return SupabaseErrorType.QUOTA_EXCEEDED;
  }

  // Validation errors
  if (
    errorMessage.includes('invalid') ||
    errorMessage.includes('validation') ||
    errorMessage.includes('required') ||
    errorCode === 400 ||
    errorCode === 422
  ) {
    return SupabaseErrorType.VALIDATION_ERROR;
  }

  // Database errors
  if (
    errorMessage.includes('database') ||
    errorMessage.includes('query') ||
    errorMessage.includes('table') ||
    errorMessage.includes('column') ||
    errorCode === 500
  ) {
    return SupabaseErrorType.DATABASE_ERROR;
  }

  return SupabaseErrorType.UNKNOWN_ERROR;
}

/**
 * Determines if an error is retryable
 */
export function isRetryable(errorType: SupabaseErrorType): boolean {
  return (
    errorType === SupabaseErrorType.NETWORK_ERROR ||
    errorType === SupabaseErrorType.DATABASE_ERROR ||
    errorType === SupabaseErrorType.PAYMENT_ERROR
  );
}

/**
 * Creates a SupabaseError from any error object
 */
export function createSupabaseError(error: any): SupabaseError {
  const errorType = categorizeError(error);
  const message = error?.message || 'An unknown error occurred';
  const retryable = isRetryable(errorType);

  return new SupabaseError(errorType, message, error, retryable);
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
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
  config: RetryConfig
): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Sleeps for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const supabaseError = createSupabaseError(error);

      // Don't retry if error is not retryable
      if (!supabaseError.retryable) {
        throw supabaseError;
      }

      // Don't retry if this was the last attempt
      if (attempt === retryConfig.maxAttempts) {
        throw supabaseError;
      }

      // Calculate delay and wait before retrying
      const delay = calculateBackoffDelay(attempt, retryConfig);
      console.warn(
        `Operation failed (attempt ${attempt}/${retryConfig.maxAttempts}). Retrying in ${delay}ms...`,
        supabaseError
      );
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw createSupabaseError(lastError);
}

/**
 * Wraps an async operation with error handling and retry logic
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: {
    retry?: boolean;
    retryConfig?: Partial<RetryConfig>;
    onError?: (error: SupabaseError) => void;
  } = {}
): Promise<T> {
  try {
    if (options.retry) {
      return await retryWithBackoff(operation, options.retryConfig);
    } else {
      return await operation();
    }
  } catch (error) {
    const supabaseError = createSupabaseError(error);
    
    // Call error callback if provided
    if (options.onError) {
      options.onError(supabaseError);
    }

    throw supabaseError;
  }
}

/**
 * Gets a user-friendly error message based on error type
 */
export function getUserFriendlyMessage(error: SupabaseError, language: 'en' | 'tr' = 'en'): string {
  const messages = {
    en: {
      [SupabaseErrorType.AUTH_ERROR]: 'Authentication failed. Please check your credentials and try again.',
      [SupabaseErrorType.DATABASE_ERROR]: 'Failed to save your data. Please try again.',
      [SupabaseErrorType.STORAGE_ERROR]: 'Failed to upload file. Please check the file and try again.',
      [SupabaseErrorType.NETWORK_ERROR]: 'Network connection lost. Please check your internet connection.',
      [SupabaseErrorType.QUOTA_EXCEEDED]: 'Storage quota exceeded. Please delete some files or upgrade your plan.',
      [SupabaseErrorType.VALIDATION_ERROR]: 'Invalid data provided. Please check your input and try again.',
      [SupabaseErrorType.PAYMENT_ERROR]: 'Payment processing failed. Please try again.',
      [SupabaseErrorType.PAYMENT_FAILED]: 'Payment failed. Please check your payment details and try again.',
      [SupabaseErrorType.PAYMENT_CANCELLED]: 'Payment was cancelled. Please try again if you wish to continue.',
      [SupabaseErrorType.INVALID_CARD]: 'Invalid card information. Please check your card details and try again.',
      [SupabaseErrorType.INSUFFICIENT_FUNDS]: 'Insufficient funds. Please check your account balance.',
      [SupabaseErrorType.QUOTA_ERROR]: 'Your monthly quota is exhausted. Please upgrade your plan to continue.',
      [SupabaseErrorType.NO_CREDITS]: 'You have no credits remaining. Please purchase credits to continue.',
      [SupabaseErrorType.SUBSCRIPTION_EXPIRED]: 'Your subscription has expired. Please renew to continue.',
      [SupabaseErrorType.UNKNOWN_ERROR]: error.message || 'An unexpected error occurred. Please try again.',
    },
    tr: {
      [SupabaseErrorType.AUTH_ERROR]: 'Kimlik doğrulama başarısız. Lütfen bilgilerinizi kontrol edin ve tekrar deneyin.',
      [SupabaseErrorType.DATABASE_ERROR]: 'Verileriniz kaydedilemedi. Lütfen tekrar deneyin.',
      [SupabaseErrorType.STORAGE_ERROR]: 'Dosya yüklenemedi. Lütfen dosyayı kontrol edin ve tekrar deneyin.',
      [SupabaseErrorType.NETWORK_ERROR]: 'Ağ bağlantısı kesildi. Lütfen internet bağlantınızı kontrol edin.',
      [SupabaseErrorType.QUOTA_EXCEEDED]: 'Depolama kotası aşıldı. Lütfen bazı dosyaları silin veya planınızı yükseltin.',
      [SupabaseErrorType.VALIDATION_ERROR]: 'Geçersiz veri sağlandı. Lütfen girişinizi kontrol edin ve tekrar deneyin.',
      [SupabaseErrorType.PAYMENT_ERROR]: 'Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.',
      [SupabaseErrorType.PAYMENT_FAILED]: 'Ödeme başarısız oldu. Lütfen ödeme bilgilerinizi kontrol edin ve tekrar deneyin.',
      [SupabaseErrorType.PAYMENT_CANCELLED]: 'Ödeme iptal edildi. Devam etmek isterseniz lütfen tekrar deneyin.',
      [SupabaseErrorType.INVALID_CARD]: 'Geçersiz kart bilgisi. Lütfen kart bilgilerinizi kontrol edin ve tekrar deneyin.',
      [SupabaseErrorType.INSUFFICIENT_FUNDS]: 'Yetersiz bakiye. Lütfen hesap bakiyenizi kontrol edin.',
      [SupabaseErrorType.QUOTA_ERROR]: 'Aylık kotanız tükendi. Devam etmek için lütfen planınızı yükseltin.',
      [SupabaseErrorType.NO_CREDITS]: 'Krediniz kalmadı. Devam etmek için lütfen kredi satın alın.',
      [SupabaseErrorType.SUBSCRIPTION_EXPIRED]: 'Aboneliğinizin süresi doldu. Devam etmek için lütfen yenileyin.',
      [SupabaseErrorType.UNKNOWN_ERROR]: error.message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
    },
  };

  return messages[language][error.type] || messages[language][SupabaseErrorType.UNKNOWN_ERROR];
}

/**
 * Handles Supabase errors by converting them to SupabaseError instances
 */
export function handleSupabaseError(error: any): SupabaseError {
  if (error instanceof SupabaseError) {
    return error;
  }
  return createSupabaseError(error);
}

/**
 * Checks if an error is a network error
 */
export function isNetworkError(error: SupabaseError): boolean {
  return error.type === SupabaseErrorType.NETWORK_ERROR;
}
