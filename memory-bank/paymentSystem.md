# Payment System Documentation

## Overview

MockupSuite uses İyzico payment gateway for subscription and credit-based payments. The system supports:
- 4 subscription tiers (Free, Starter, Pro, Business)
- 3 credit packages for pay-as-you-go
- Secure payment processing via edge functions
- Automatic subscription renewal
- Quota management

## Architecture

### Components

1. **Edge Function** (`supabase/functions/iyzico-payment/index.ts`)
   - Handles payment initialization and verification
   - Uses SUPABASE_SERVICE_ROLE_KEY for database access
   - Implements İyzico API authentication (HMAC-SHA256)
   - Updates subscriptions and credits after successful payment

2. **Payment Service** (`services/paymentService.ts`)
   - Client-side payment operations
   - Initializes payment flow
   - Handles callbacks
   - Manages payment history

3. **Subscription Service** (`services/subscriptionService.ts`)
   - Manages subscription plans
   - Handles quota tracking
   - Processes upgrades/downgrades
   - Automatic renewal logic

4. **Credit Service** (`services/creditService.ts`)
   - Manages credit balance
   - Processes credit purchases
   - Tracks credit transactions

## Database Schema

### subscriptions
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to profiles)
- plan_id: TEXT (free, starter, pro, business)
- status: TEXT (active, cancelled, expired)
- current_period_start: TIMESTAMP
- current_period_end: TIMESTAMP
- expires_at: TIMESTAMP (CRITICAL: must be set)
- remaining_quota: INTEGER
- auto_renew: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### payment_transactions
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key)
- type: TEXT (subscription, credit)
- amount: DECIMAL
- currency: TEXT (TRY)
- status: TEXT (pending, completed, failed)
- iyzico_payment_id: TEXT
- iyzico_token: TEXT
- iyzico_conversation_id: TEXT
- metadata: JSONB
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### credit_balances
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key)
- balance: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### credit_transactions
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key)
- type: TEXT (purchase, deduction, refund)
- amount: INTEGER
- balance_after: INTEGER
- description: TEXT
- payment_transaction_id: UUID (foreign key)
- created_at: TIMESTAMP
```

## Subscription Plans

| Plan | Price (TRY) | Monthly Quota | Features |
|------|-------------|---------------|----------|
| Free | 0 | 5 | 512px, watermark, low priority |
| Starter | 299 | 50 | 2048px, no watermark, high priority |
| Pro | 649 | 200 | 4096px, no watermark, high priority |
| Business | 1199 | 700 | 4096px, no watermark, high priority |

## Credit Packages

| Package | Price (TRY) | Credits | Price per Image |
|---------|-------------|---------|-----------------|
| Small | 25 | 3 | 8.33 |
| Medium | 100 | 15 | 6.67 |
| Large | 250 | 40 | 6.25 |

## Payment Flow

### Subscription Purchase

1. User selects plan in PlanSelectionModal
2. PaymentCheckout component calls paymentService.initializePayment()
3. Edge function creates İyzico checkout form
4. User redirected to İyzico payment page
5. User completes payment
6. İyzico redirects to callback URL (payment-callback.html)
7. Callback page calls paymentService.verifyPayment()
8. Edge function verifies payment with İyzico
9. Edge function updates subscription:
   - Sets plan_id
   - Sets status to 'active'
   - Sets remaining_quota
   - Sets current_period_start and current_period_end
   - **CRITICAL**: Sets expires_at = current_period_end
   - Sets updated_at
10. User redirected to success page

### Credit Purchase

Similar flow but updates credit_balances instead of subscriptions.

## Critical Implementation Details

### expires_at Field

**CRITICAL**: The `expires_at` field MUST be set in ALL subscription operations:

1. **Edge Function** (payment verification):
```typescript
const { data, error } = await supabase
  .from('subscriptions')
  .update({
    plan_id: planId,
    status: 'active',
    remaining_quota: quota,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    expires_at: periodEnd.toISOString(), // MUST SET
    updated_at: now.toISOString(),
  })
  .eq('user_id', user.id)
  .select(); // MUST VERIFY

if (error) {
  throw new Error(`Failed to update: ${error.message}`);
}
```

2. **subscriptionService.createSubscription()**:
```typescript
const { data, error } = await supabase
  .from('subscriptions')
  .upsert({
    user_id: userId,
    plan_id: planId,
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    expires_at: periodEnd.toISOString(), // MUST SET
    remaining_quota: plan.monthlyQuota,
    auto_renew: true,
    updated_at: now.toISOString(),
  })
  .select()
  .single();
```

3. **subscriptionService.renewSubscription()**:
```typescript
const { data, error } = await supabase
  .from('subscriptions')
  .update({
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: newPeriodEnd.toISOString(),
    expires_at: newPeriodEnd.toISOString(), // MUST SET
    remaining_quota: plan.monthlyQuota,
    updated_at: now.toISOString(),
  })
  .eq('user_id', userId)
  .select()
  .single();
```

### Error Handling Pattern

Always use `.select()` after update/insert operations to verify success:

```typescript
const { data, error } = await supabase
  .from('table')
  .update({ ... })
  .eq('id', id)
  .select(); // Verify operation succeeded

if (error) {
  console.error('Operation failed:', error);
  throw new Error(`Failed: ${error.message}`);
}

console.log('Operation succeeded:', data);
```

## İyzico API Integration

### Authentication

İyzico uses HMAC-SHA256 signature authentication:

```typescript
const payload = randomString + endpoint + requestBody;
const signature = HMAC_SHA256(payload, secretKey);
const authHeader = base64(`apiKey:${apiKey}&randomKey:${randomString}&signature:${signature}`);
```

### Endpoints

- Initialize: `/payment/iyzipos/checkoutform/initialize/auth/ecom`
- Verify: `/payment/iyzipos/checkoutform/auth/ecom/detail`

### Environment Variables

```
IYZICO_API_KEY=your_api_key
IYZICO_SECRET_KEY=your_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com (or production URL)
IYZICO_CALLBACK_URL=https://your-domain.com/payment-callback.html
```

## Testing

### Test Cards (Sandbox)

- Success: 5528790000000008
- Failure: 5528790000000016
- 3D Secure: 5528790000000008 (password: 123456)

### Test Flow

1. Select a plan
2. Use test card
3. Complete payment
4. Verify subscription updated
5. Check expires_at is set correctly
6. Verify quota is set
7. Test quota decrement

## Common Issues and Solutions

### Issue: expires_at is null after payment

**Cause**: expires_at not set in update operation

**Solution**: Always include expires_at in subscription updates:
```typescript
expires_at: periodEnd.toISOString()
```

### Issue: Payment succeeds but subscription not updated

**Cause**: Edge function error not caught

**Solution**: Add error handling with .select():
```typescript
const { data, error } = await supabase
  .from('subscriptions')
  .update({ ... })
  .select();

if (error) throw new Error(error.message);
```

### Issue: Multiple code paths updating subscriptions inconsistently

**Cause**: Different services/functions updating same data

**Solution**: Ensure ALL code paths set ALL required fields:
- Edge function
- subscriptionService.createSubscription()
- subscriptionService.renewSubscription()
- Any other subscription update operations

## Maintenance

### Regular Tasks

1. Monitor payment transactions for failures
2. Check for expired subscriptions
3. Run quota reset for active subscriptions
4. Review İyzico logs for errors
5. Update test cards if İyzico changes them

### Database Maintenance

```sql
-- Find subscriptions with null expires_at
SELECT * FROM subscriptions WHERE expires_at IS NULL;

-- Fix null expires_at
UPDATE subscriptions 
SET expires_at = current_period_end 
WHERE expires_at IS NULL AND status = 'active';

-- Check payment success rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM payment_transactions
GROUP BY status;
```

## Future Enhancements

- [ ] Automatic subscription renewal with saved cards
- [ ] Prorated upgrades/downgrades
- [ ] Refund handling
- [ ] Invoice generation
- [ ] Payment retry logic
- [ ] Webhook integration for real-time updates
- [ ] Multiple payment methods (credit card, bank transfer)
- [ ] Discount codes and promotions
