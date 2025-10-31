# Error Handling System

This document describes the comprehensive error handling system implemented for the İyzico payment integration and quota management.

## Overview

The error handling system provides:
- Centralized error categorization and handling
- User-friendly error messages in multiple languages (EN, TR, ES)
- Automatic retry mechanisms with exponential backoff
- Toast notifications for user feedback
- Payment-specific error handling
- Quota error handling with upgrade prompts

## Components

### 1. Error Types (`utils/errorHandling.ts`)

Extended error types to include payment and quota-specific errors:

```typescript
export enum SupabaseErrorType {
  // Existing types
  AUTH_ERROR = 'AUTH_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // New payment-specific types
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  INVALID_CARD = 'INVALID_CARD',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  
  // New quota-specific types
  QUOTA_ERROR = 'QUOTA_ERROR',
  NO_CREDITS = 'NO_CREDITS',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### 2. Error Boundary (`components/ErrorBoundary.tsx`)

Enhanced React Error Boundary with:
- Localization support (EN/TR)
- User-friendly error messages
- Retry functionality
- Custom error handlers
- Component stack traces in development

Usage:
```tsx
<ErrorBoundary 
  language="tr"
  onError={(error, errorInfo) => {
    // Custom error logging
  }}
>
  <YourApp />
</ErrorBoundary>
```

### 3. Error Handler Hook (`hooks/useErrorHandler.ts`)

Custom hook for handling errors with toast notifications:

```typescript
const { 
  handleError,           // Generic error handler
  handlePaymentError,    // Payment-specific handler
  handleQuotaError,      // Quota-specific handler
  showSuccess,           // Success toast
  showWarning,           // Warning toast
  showInfo               // Info toast
} = useErrorHandler();

// Usage
try {
  await someOperation();
} catch (error) {
  handlePaymentError(error, () => retryOperation());
}
```

Features:
- Automatic toast notifications
- Retry suggestions for retryable errors
- Custom error messages
- Upgrade modal triggers for quota errors

### 4. Retry Mechanism (`utils/retryMechanism.ts`)

Exponential backoff retry logic:

```typescript
// Generic retry
const result = await retryOperation(
  () => someAsyncOperation(),
  {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}`);
    }
  }
);

// Payment-specific retry (max 2 attempts)
const paymentResult = await retryPaymentOperation(
  () => processPayment(),
  (attempt) => {
    console.log(`Payment retry ${attempt}`);
  }
);

// Quota check retry
const quotaResult = await retryQuotaCheck(
  () => checkQuota()
);
```

### 5. Localized Error Messages

All error messages are available in three languages:

**English (en.ts):**
```typescript
error_payment_failed: 'Payment failed. Please check your payment details and try again.',
error_quota_exhausted: 'Your monthly quota is exhausted. Please upgrade your plan to continue.',
```

**Turkish (tr.ts):**
```typescript
error_payment_failed: 'Ödeme başarısız oldu. Lütfen ödeme bilgilerinizi kontrol edin ve tekrar deneyin.',
error_quota_exhausted: 'Aylık kotanız tükendi. Devam etmek için lütfen planınızı yükseltin.',
```

**Spanish (es.ts):**
```typescript
error_payment_failed: 'Pago fallido. Por favor, verifica tus detalles de pago e inténtalo de nuevo.',
error_quota_exhausted: 'Tu cuota mensual se ha agotado. Por favor, actualiza tu plan para continuar.',
```

## Error Flow

### Payment Error Flow

```
User Action (Payment)
  ↓
Try Payment Operation
  ↓
Error Occurs
  ↓
Categorize Error (PAYMENT_FAILED, INVALID_CARD, etc.)
  ↓
Check if Retryable (Network/Generic Payment Errors)
  ↓
If Retryable:
  - Show retry toast
  - Retry with exponential backoff (max 2 attempts)
  ↓
If Not Retryable or Max Retries:
  - Show error toast with user-friendly message
  - Display error modal with retry/cancel options
  - Log error for analytics
```

### Quota Error Flow

```
User Action (Generate Mockup)
  ↓
Check Quota
  ↓
Quota Exhausted
  ↓
Throw QUOTA_ERROR
  ↓
handleQuotaError()
  ↓
Show error toast
  ↓
Trigger Upgrade Modal
  ↓
User can upgrade or cancel
```

## Integration Examples

### PaymentCheckout Component

```typescript
const { handlePaymentError } = useErrorHandler();
const t = useTranslations();

const initializePayment = async () => {
  try {
    const response = await retryPaymentOperation(
      () => paymentService.createSubscriptionPayment(userId, plan)
    );
    
    if (response.success) {
      setCheckoutUrl(response.checkoutFormUrl);
    }
  } catch (err) {
    const supabaseError = handlePaymentError(err, () => handleRetry());
    setError(supabaseError.message || t.error_payment_processing);
  }
};
```

### Quota Check Integration

```typescript
const { handleQuotaError } = useErrorHandler();

const generateMockup = async () => {
  try {
    // Check quota before generation
    const canGenerate = await subscriptionService.canGenerateImage(userId);
    
    if (!canGenerate) {
      throw new SupabaseError(
        'QUOTA_ERROR',
        'Monthly quota exhausted',
        null,
        false
      );
    }
    
    // Proceed with generation
    await generateImage();
  } catch (err) {
    handleQuotaError(err);
  }
};
```

## Best Practices

1. **Always use error handlers**: Use `handleError`, `handlePaymentError`, or `handleQuotaError` instead of raw try-catch
2. **Provide retry callbacks**: For retryable operations, always provide a retry callback
3. **Use appropriate retry functions**: Use `retryPaymentOperation` for payments, `retryQuotaCheck` for quota checks
4. **Localize all messages**: Always use translation keys from locales files
5. **Log errors**: All errors are automatically logged, but add custom logging for critical operations
6. **Show user feedback**: Always show toast notifications or modals for user-facing errors
7. **Limit retries**: Payment operations are limited to 2 attempts to avoid frustrating users
8. **Track errors**: Use the `onError` callback in ErrorBoundary for analytics

## Testing

To test error handling:

1. **Network Errors**: Disconnect network and try operations
2. **Payment Errors**: Use İyzico sandbox test cards for different error scenarios
3. **Quota Errors**: Exhaust quota and try to generate mockups
4. **Retry Logic**: Simulate intermittent failures to test retry mechanism
5. **Localization**: Test error messages in all supported languages

## Future Enhancements

- [ ] Add error analytics tracking
- [ ] Implement error rate limiting
- [ ] Add custom error recovery strategies
- [ ] Implement error reporting to external service (e.g., Sentry)
- [ ] Add A/B testing for error messages
- [ ] Implement smart retry delays based on error type
