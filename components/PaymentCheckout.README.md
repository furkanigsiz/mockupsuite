# PaymentCheckout Component

## Overview

The `PaymentCheckout` component provides a secure payment interface integrated with İyzico payment gateway. It handles the complete payment flow including initialization, iframe rendering, callback handling, and error management.

## Features

- ✅ İyzico checkout form iframe integration
- ✅ Loading states during payment initialization
- ✅ Success/failure callback handling
- ✅ Error messages with retry functionality
- ✅ Secure payment verification
- ✅ Support for both subscription and credit purchases
- ✅ Responsive design with dark mode support
- ✅ Accessible UI with proper ARIA labels

## Props

```typescript
interface PaymentCheckoutProps {
  userId: string;              // User ID for payment
  plan?: SubscriptionPlan;     // Subscription plan (for subscription payments)
  creditPackage?: CreditPackage; // Credit package (for credit purchases)
  onSuccess: (transactionId: string) => void; // Success callback
  onCancel: () => void;        // Cancel callback
  onError: (error: string) => void; // Error callback
}
```

## Usage

### Subscription Payment

```tsx
import { PaymentCheckout } from './components/PaymentCheckout';
import { SUBSCRIPTION_PLANS } from './types';

function MyComponent() {
  const [showCheckout, setShowCheckout] = useState(false);
  const selectedPlan = SUBSCRIPTION_PLANS[1]; // Starter plan

  const handleSuccess = (transactionId: string) => {
    console.log('Payment successful:', transactionId);
    // Activate subscription, update UI, etc.
    setShowCheckout(false);
  };

  const handleCancel = () => {
    setShowCheckout(false);
  };

  const handleError = (error: string) => {
    console.error('Payment error:', error);
    // Show error notification
  };

  return (
    <>
      <button onClick={() => setShowCheckout(true)}>
        Subscribe to {selectedPlan.displayName}
      </button>

      {showCheckout && (
        <PaymentCheckout
          userId={currentUser.id}
          plan={selectedPlan}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onError={handleError}
        />
      )}
    </>
  );
}
```

### Credit Purchase

```tsx
import { PaymentCheckout } from './components/PaymentCheckout';
import { CREDIT_PACKAGES } from './types';

function MyComponent() {
  const [showCheckout, setShowCheckout] = useState(false);
  const selectedPackage = CREDIT_PACKAGES[0]; // Small package

  return (
    <>
      <button onClick={() => setShowCheckout(true)}>
        Buy {selectedPackage.name}
      </button>

      {showCheckout && (
        <PaymentCheckout
          userId={currentUser.id}
          creditPackage={selectedPackage}
          onSuccess={(txId) => {
            console.log('Credits purchased:', txId);
            // Add credits to user balance
            setShowCheckout(false);
          }}
          onCancel={() => setShowCheckout(false)}
          onError={(err) => console.error(err)}
        />
      )}
    </>
  );
}
```

## Component States

### 1. Loading State
Displayed while initializing payment with İyzico API:
- Shows loading spinner
- Displays "Preparing payment page..." message
- Cannot be dismissed

### 2. Checkout State
Displays İyzico checkout form in iframe:
- Full-screen modal with iframe
- Header showing plan/package details and price
- Close button to cancel payment
- Secure payment badge in footer

### 3. Error State
Displayed when payment initialization or processing fails:
- Error icon and message
- "Retry" button to attempt payment again
- "Cancel" button to close modal
- Detailed error message from İyzico

## Payment Flow

```
1. User clicks "Choose Plan" or "Buy Credits"
   ↓
2. PaymentCheckout component mounts
   ↓
3. Initialize payment with İyzico API
   ↓
4. Display checkout form in iframe
   ↓
5. User completes payment in iframe
   ↓
6. İyzico sends callback via postMessage
   ↓
7. Verify payment on backend
   ↓
8. Call onSuccess() or onError()
```

## Error Handling

The component handles various error scenarios:

- **Initialization Errors**: Network issues, invalid credentials, API errors
- **Payment Errors**: Card declined, insufficient funds, cancelled by user
- **Verification Errors**: Token mismatch, payment not found

All errors display user-friendly messages with retry option.

## Security Considerations

1. **Iframe Sandbox**: Checkout form runs in sandboxed iframe with restricted permissions
2. **Token Verification**: Payment tokens are verified on backend before activation
3. **Origin Validation**: PostMessage events are validated (should check İyzico domain in production)
4. **HTTPS Only**: Payment flow requires HTTPS in production
5. **No Card Storage**: Card details never touch your application

## Environment Variables

Required environment variables:

```env
VITE_IYZICO_API_KEY=your_api_key
VITE_IYZICO_SECRET_KEY=your_secret_key
VITE_IYZICO_BASE_URL=https://sandbox-api.iyzipay.com  # or production URL
VITE_IYZICO_CALLBACK_URL=https://yourdomain.com/payment/callback
```

## Styling

The component uses Tailwind CSS with dark mode support:
- Responsive design (mobile-first)
- Smooth transitions and animations
- Accessible color contrast
- Focus states for keyboard navigation

## Accessibility

- Proper ARIA labels for buttons and modals
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Testing

See `PaymentCheckoutExample.tsx` for a complete working example with both subscription and credit purchase flows.

## Related Components

- `PlanSelectionModal`: For selecting subscription plans
- `UpgradeModal`: For upgrading existing subscriptions
- `QuotaWidget`: For displaying remaining quota

## Related Services

- `paymentService`: Handles İyzico API integration
- `subscriptionService`: Manages subscription activation
- `creditService`: Manages credit balance

## Requirements Covered

This component implements the following requirements from the spec:

- **5.1**: İyzico API integration for payment processing
- **5.2**: Checkout form creation with transaction details
- **5.3**: Callback response handling for success/failure
- **5.4**: Error message display and retry functionality
