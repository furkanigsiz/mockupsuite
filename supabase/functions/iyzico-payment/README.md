# İyzico Payment Edge Function

## Overview

This Supabase Edge Function handles secure payment processing with İyzico payment gateway. It runs on Deno runtime and keeps API credentials secure on the backend.

## Endpoints

### POST /functions/v1/iyzico-payment

Handles two actions:

1. **Initialize Payment** - Creates İyzico checkout form
2. **Verify Payment** - Verifies payment status after callback

## Request Format

### Initialize Payment

```json
{
  "action": "initialize",
  "userId": "user-uuid",
  "type": "subscription" | "credit",
  "amount": 299,
  "planId": "starter",  // for subscriptions
  "packageId": "small", // for credits
  "conversationId": "optional-conversation-id"
}
```

### Verify Payment

```json
{
  "action": "verify",
  "userId": "user-uuid",
  "token": "iyzico-payment-token",
  "conversationId": "conversation-id"
}
```

## Response Format

### Initialize Success

```json
{
  "success": true,
  "token": "payment-token",
  "checkoutFormContent": "html-content",
  "paymentPageUrl": "https://sandbox-api.iyzipay.com/..."
}
```

### Verify Success

```json
{
  "success": true,
  "status": "success",
  "paymentId": "iyzico-payment-id"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

## Environment Variables

Required environment variables in Supabase:

```bash
IYZICO_API_KEY=your_api_key
IYZICO_SECRET_KEY=your_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com  # or production URL
IYZICO_CALLBACK_URL=https://yourdomain.com/payment/callback
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Security Features

1. **Authentication Required** - All requests must include valid Bearer token
2. **User ID Validation** - Ensures authenticated user matches request user
3. **Backend API Keys** - İyzico credentials never exposed to client
4. **Transaction Logging** - All payments logged to `payment_transactions` table

## Database Operations

### Payment Initialization

Inserts record into `payment_transactions`:
- `user_id`
- `type` (subscription/credit)
- `amount`
- `currency` (TRY)
- `status` (pending)
- `iyzico_token`
- `iyzico_conversation_id`
- `metadata` (planId/packageId)

### Payment Verification

Updates `payment_transactions`:
- `status` (success/failed)
- `iyzico_payment_id`
- `updated_at`

## İyzico API Integration

### Authorization

Uses İyzico's IYZWSv2 authorization scheme:
1. Generate random UUID
2. Create auth string: `apiKey:{key}&randomKey:{uuid}&signature:{secret}`
3. Base64 encode
4. Send as `Authorization: IYZWSv2 {encoded}`

### Endpoints Used

- `/payment/iyzipos/checkoutform/initialize/auth/ecom` - Initialize payment
- `/payment/iyzipos/checkoutform/auth/ecom/detail` - Verify payment

## Testing

### Sandbox Mode

Use sandbox credentials and test cards from İyzico documentation:
- Test Card: 5528790000000008
- Expiry: 12/30
- CVV: 123

### Local Testing

```bash
# Deploy function
supabase functions deploy iyzico-payment

# Test with curl
curl -X POST https://your-project.supabase.co/functions/v1/iyzico-payment \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "initialize",
    "userId": "user-id",
    "type": "subscription",
    "amount": 299,
    "planId": "starter"
  }'
```

## Error Handling

Common errors:
- `Missing authorization header` - No Bearer token provided
- `Invalid authentication token` - Token expired or invalid
- `User ID mismatch` - Request userId doesn't match authenticated user
- `İyzico credentials not configured` - Missing API keys
- `İyzico API error` - Payment gateway error

## Deployment

```bash
# Deploy to Supabase
supabase functions deploy iyzico-payment

# Set environment variables
supabase secrets set IYZICO_API_KEY=your_key
supabase secrets set IYZICO_SECRET_KEY=your_secret
supabase secrets set IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
supabase secrets set IYZICO_CALLBACK_URL=https://yourdomain.com/payment/callback
```

## Related Files

- `services/paymentService.ts` - Client-side payment service
- `components/PaymentCheckout.tsx` - Payment UI component
- `types.ts` - TypeScript type definitions

## Notes

- This is a Deno runtime function, not Node.js
- TypeScript errors for Deno imports are expected in IDE
- Function runs on Supabase infrastructure
- CORS enabled for all origins (configure for production)
