# Design Document: Unified Credit System

## Overview

This document outlines the technical design for transitioning MockupSuite from a dual quota/credit system to a unified credit-based system. The new system will support both subscription-based credits (monthly allocation) and pay-as-you-go credit purchases, with different credit costs for image (1 credit) and video (5 credits) generation.

### Key Design Principles

1. **Backward Compatibility**: Existing users and data must be migrated seamlessly
2. **Credit Separation**: Subscription credits and pay-as-you-go credits tracked separately but presented as unified balance
3. **Priority-based Deduction**: Subscription credits consumed first, then pay-as-you-go
4. **Free Tier Lock**: One-time free tier usage enforced at database level
5. **Atomic Operations**: Credit deductions and generation operations must be transactional

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  - UnifiedHeader (Credit Display)                           │
│  - ProfilePage (Credit Breakdown)                           │
│  - PaymentCheckout (Subscriptions + Pay-as-you-go)         │
│  - GeneratorControls (Credit Validation)                    │
│  - VideoGeneratorControls (Credit Validation)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                          │
├─────────────────────────────────────────────────────────────┤
│  - creditService.ts (Unified Credit Management)             │
│  - subscriptionService.ts (Subscription Credits)            │
│  - paymentService.ts (Payment Processing)                   │
│  - migrationService.ts (Data Migration)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  - subscriptions (subscription_credits, has_used_free_tier) │
│  - credit_balances (payg_credits)                           │
│  - credit_transactions (type, credit_source)                │
│  - payment_transactions (payment_type)                      │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### Database Schema Changes

#### 1. Subscriptions Table (Modified)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  
  -- Credit fields (replacing remaining_quota)
  subscription_credits INTEGER NOT NULL DEFAULT 0,
  has_used_free_tier BOOLEAN NOT NULL DEFAULT false,
  
  -- Billing fields
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Index for efficient queries
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

#### 2. Credit Balances Table (Modified)

```sql
CREATE TABLE credit_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pay-as-you-go credits only
  payg_credits INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_credit_balances_user_id ON credit_balances(user_id);
```

#### 3. Credit Transactions Table (Modified)

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('purchase', 'deduction', 'refund', 'reset')),
  credit_source TEXT NOT NULL CHECK (credit_source IN ('subscription', 'payg')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  -- Context
  description TEXT,
  payment_transaction_id UUID REFERENCES payment_transactions(id),
  generation_type TEXT CHECK (generation_type IN ('image', 'video')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
```

#### 4. Payment Transactions Table (Modified)

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment details
  type TEXT NOT NULL CHECK (type IN ('subscription', 'payg')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  
  -- Iyzico integration
  iyzico_payment_id TEXT,
  iyzico_token TEXT,
  iyzico_conversation_id TEXT,
  
  -- Additional data
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
```

### TypeScript Type Definitions

```typescript
// Updated types.ts

export interface CreditBalance {
  userId: string;
  subscriptionCredits: number;
  paygCredits: number;
  totalCredits: number;
  hasUsedFreeTier: boolean;
  nextResetDate?: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'deduction' | 'refund' | 'reset';
  creditSource: 'subscription' | 'payg';
  amount: number;
  balanceAfter: number;
  description?: string;
  generationType?: 'image' | 'video';
  createdAt: string;
}

export interface PaygCreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  equivalentImages: number;
  equivalentVideos: number;
}

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  displayName: string;
  price: number;
  monthlyCredits: number; // Changed from monthlyQuota
  features: PlanFeatures;
  equivalentImages: number;
  equivalentVideos: number;
}

export const PAYG_CREDIT_PACKAGES: PaygCreditPackage[] = [
  {
    id: 'small',
    name: 'Küçük Paket',
    credits: 5,
    price: 25,
    pricePerCredit: 5.0,
    equivalentImages: 5,
    equivalentVideos: 1,
  },
  {
    id: 'medium',
    name: 'Orta Paket',
    credits: 20,
    price: 90,
    pricePerCredit: 4.5,
    equivalentImages: 20,
    equivalentVideos: 4,
  },
  {
    id: 'large',
    name: 'Büyük Paket',
    credits: 50,
    price: 200,
    pricePerCredit: 4.0,
    equivalentImages: 50,
    equivalentVideos: 10,
  },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'free',
    displayName: 'Free Tier',
    price: 0,
    monthlyCredits: 5,
    equivalentImages: 5,
    equivalentVideos: 1,
    features: {
      maxResolution: 512,
      hasWatermark: true,
      queuePriority: 'low',
      supportLevel: 'community',
    },
  },
  {
    id: 'starter',
    name: 'starter',
    displayName: 'Starter',
    price: 299,
    monthlyCredits: 50,
    equivalentImages: 50,
    equivalentVideos: 10,
    features: {
      maxResolution: 2048,
      hasWatermark: false,
      queuePriority: 'high',
      supportLevel: 'email',
    },
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro',
    price: 649,
    monthlyCredits: 200,
    equivalentImages: 200,
    equivalentVideos: 40,
    features: {
      maxResolution: 4096,
      hasWatermark: false,
      queuePriority: 'high',
      supportLevel: 'priority',
    },
  },
  {
    id: 'business',
    name: 'business',
    displayName: 'Business',
    price: 1199,
    monthlyCredits: 700,
    equivalentImages: 700,
    equivalentVideos: 140,
    features: {
      maxResolution: 4096,
      hasWatermark: false,
      queuePriority: 'high',
      supportLevel: 'priority',
    },
  },
];

export const CREDIT_COSTS = {
  IMAGE: 1,
  VIDEO: 5,
} as const;
```

## Components and Interfaces

### Service Layer Design

#### creditService.ts (Refactored)

```typescript
/**
 * Get unified credit balance for a user
 * Combines subscription credits and pay-as-you-go credits
 */
export async function getCreditBalance(userId: string): Promise<CreditBalance>

/**
 * Deduct credits with priority: subscription first, then pay-as-you-go
 * Returns breakdown of which credit sources were used
 */
export async function deductCredits(
  userId: string,
  amount: number,
  generationType: 'image' | 'video'
): Promise<{
  success: boolean;
  subscriptionCreditsUsed: number;
  paygCreditsUsed: number;
  remainingBalance: CreditBalance;
}>

/**
 * Add pay-as-you-go credits after successful payment
 */
export async function addPaygCredits(
  userId: string,
  amount: number,
  paymentTransactionId: string
): Promise<CreditBalance>

/**
 * Check if user can perform generation
 */
export async function canGenerate(
  userId: string,
  generationType: 'image' | 'video'
): Promise<{
  canGenerate: boolean;
  requiredCredits: number;
  availableCredits: number;
  reason?: string;
}>

/**
 * Get credit transaction history
 */
export async function getCreditTransactions(
  userId: string,
  limit?: number
): Promise<CreditTransaction[]>
```

#### subscriptionService.ts (Refactored)

```typescript
/**
 * Create subscription with free tier lock check
 */
export async function createSubscription(
  userId: string,
  planId: PlanId,
  paymentToken?: string
): Promise<UserSubscription>

/**
 * Reset subscription credits (paid plans only)
 */
export async function resetSubscriptionCredits(
  userId: string
): Promise<void>

/**
 * Check if user can select free tier
 */
export async function canSelectFreeTier(
  userId: string
): Promise<boolean>

/**
 * Upgrade subscription with credit adjustment
 */
export async function upgradeSubscription(
  userId: string,
  newPlanId: PlanId
): Promise<UserSubscription>
```

#### paymentService.ts (Extended)

```typescript
/**
 * Initiate pay-as-you-go credit purchase
 */
export async function initiateCreditPurchase(
  userId: string,
  packageId: string,
  callbackUrl: string
): Promise<{
  checkoutFormContent: string;
  token: string;
  conversationId: string;
}>

/**
 * Process credit purchase callback
 */
export async function processCreditPurchaseCallback(
  token: string
): Promise<{
  success: boolean;
  credits: number;
  balance: CreditBalance;
}>
```

#### migrationService.ts (New)

```typescript
/**
 * Migrate existing quota system to credit system
 */
export async function migrateToCredits(): Promise<{
  usersProcessed: number;
  errors: Array<{ userId: string; error: string }>;
}>

/**
 * Migrate single user
 */
async function migrateUser(userId: string): Promise<void>
```

### Frontend Components

#### UnifiedHeader.tsx (Modified)

```typescript
// Display total credit balance
interface CreditDisplayProps {
  balance: CreditBalance;
}

function CreditDisplay({ balance }: CreditDisplayProps) {
  return (
    <div className="credit-display">
      <span className="credit-icon">💳</span>
      <span className="credit-amount">{balance.totalCredits}</span>
      <span className="credit-label">Credits</span>
    </div>
  );
}
```

#### ProfilePage.tsx (Modified)

```typescript
// Show credit breakdown
interface CreditBreakdownProps {
  balance: CreditBalance;
}

function CreditBreakdown({ balance }: CreditBreakdownProps) {
  return (
    <div className="credit-breakdown">
      <div className="credit-row">
        <span>Subscription Credits</span>
        <span>{balance.subscriptionCredits}</span>
        {balance.nextResetDate && (
          <span className="reset-info">
            Resets on {formatDate(balance.nextResetDate)}
          </span>
        )}
      </div>
      <div className="credit-row">
        <span>Pay-as-you-go Credits</span>
        <span>{balance.paygCredits}</span>
        <span className="permanent-info">Never expires</span>
      </div>
      <div className="credit-row total">
        <span>Total Available</span>
        <span>{balance.totalCredits}</span>
      </div>
    </div>
  );
}
```

#### PaymentCheckout.tsx (Modified)

```typescript
// Display both subscriptions and pay-as-you-go options
interface PaymentOptionsProps {
  currentPlan: UserSubscription | null;
  hasUsedFreeTier: boolean;
}

function PaymentOptions({ currentPlan, hasUsedFreeTier }: PaymentOptionsProps) {
  return (
    <div className="payment-options">
      <section className="subscriptions-section">
        <h2>Monthly Subscriptions</h2>
        <div className="plan-grid">
          {SUBSCRIPTION_PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              disabled={plan.id === 'free' && hasUsedFreeTier}
              current={currentPlan?.planId === plan.id}
            />
          ))}
        </div>
      </section>
      
      <section className="payg-section">
        <h2>Pay-as-you-go Credits</h2>
        <p className="payg-description">
          Purchase credits that never expire. Use them anytime!
        </p>
        <div className="package-grid">
          {PAYG_CREDIT_PACKAGES.map(pkg => (
            <CreditPackageCard key={pkg.id} package={pkg} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

#### GeneratorControls.tsx (Modified)

```typescript
// Validate credits before generation
async function handleGenerate() {
  const canGenerate = await creditService.canGenerate(userId, 'image');
  
  if (!canGenerate.canGenerate) {
    showInsufficientCreditsModal({
      required: canGenerate.requiredCredits,
      available: canGenerate.availableCredits,
      reason: canGenerate.reason,
    });
    return;
  }
  
  // Proceed with generation
  await generateImage();
}
```

## Error Handling

### Credit-Related Errors

```typescript
export enum CreditErrorType {
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  FREE_TIER_ALREADY_USED = 'FREE_TIER_ALREADY_USED',
  CREDIT_DEDUCTION_FAILED = 'CREDIT_DEDUCTION_FAILED',
  INVALID_CREDIT_PACKAGE = 'INVALID_CREDIT_PACKAGE',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export interface CreditError {
  type: CreditErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  suggestedAction?: 'purchase_credits' | 'upgrade_plan' | 'contact_support';
}

// Error handling function
export function handleCreditError(error: any): CreditError {
  if (error.message?.includes('insufficient')) {
    return {
      type: CreditErrorType.INSUFFICIENT_CREDITS,
      message: error.message,
      userMessage: 'You don\'t have enough credits. Purchase more credits or upgrade your plan.',
      retryable: false,
      suggestedAction: 'purchase_credits',
    };
  }
  
  if (error.message?.includes('free tier')) {
    return {
      type: CreditErrorType.FREE_TIER_ALREADY_USED,
      message: error.message,
      userMessage: 'Free tier is only available once per account. Please select a paid plan.',
      retryable: false,
      suggestedAction: 'upgrade_plan',
    };
  }
  
  // ... other error cases
}
```

## Testing Strategy

### Unit Tests

1. **creditService.ts**
   - Test credit deduction priority (subscription first, then pay-as-you-go)
   - Test insufficient credit scenarios
   - Test credit balance calculation
   - Test transaction logging

2. **subscriptionService.ts**
   - Test free tier lock enforcement
   - Test credit reset for paid plans only
   - Test subscription upgrade credit adjustment

3. **migrationService.ts**
   - Test quota to credit conversion
   - Test free tier flag setting
   - Test error handling during migration

### Integration Tests

1. **End-to-end Generation Flow**
   - User with sufficient credits generates image
   - User with insufficient credits is blocked
   - Credits are deducted correctly after generation

2. **Payment Flow**
   - Subscription purchase adds subscription credits
   - Pay-as-you-go purchase adds pay-as-you-go credits
   - Failed payments don't add credits

3. **Credit Reset Flow**
   - Paid subscription credits reset monthly
   - Free tier credits don't reset
   - Pay-as-you-go credits persist across resets

### Manual Testing Checklist

- [ ] New user registration assigns free tier with credits
- [ ] Free tier user cannot select free tier again
- [ ] Subscription credits reset monthly for paid plans
- [ ] Pay-as-you-go credits never expire
- [ ] Credit deduction uses subscription credits first
- [ ] UI displays credit breakdown correctly
- [ ] Payment interface shows both subscriptions and pay-as-you-go
- [ ] Insufficient credit modal shows correct options
- [ ] Migration converts existing data correctly

## Migration Plan

### Phase 1: Database Schema Updates

1. Add new columns to subscriptions table
2. Modify credit_balances table structure
3. Update credit_transactions table
4. Create database migration script

### Phase 2: Data Migration

1. Convert remaining_quota to subscription_credits
2. Set has_used_free_tier flag for all users
3. Convert existing credit_balances to payg_credits
4. Verify data integrity

### Phase 3: Service Layer Updates

1. Update creditService.ts
2. Update subscriptionService.ts
3. Update paymentService.ts
4. Add migrationService.ts

### Phase 4: Frontend Updates

1. Update UnifiedHeader component
2. Update ProfilePage component
3. Update PaymentCheckout component
4. Update GeneratorControls components
5. Update translation files

### Phase 5: Testing and Deployment

1. Run unit tests
2. Run integration tests
3. Perform manual testing
4. Deploy to staging
5. Monitor for issues
6. Deploy to production

## Security Considerations

1. **Transaction Atomicity**: Credit deductions and generation operations must be atomic
2. **Race Conditions**: Use database transactions to prevent concurrent credit deductions
3. **Free Tier Enforcement**: Database constraint ensures free tier lock cannot be bypassed
4. **Payment Verification**: Always verify payment status before adding credits
5. **Audit Trail**: All credit transactions logged with full context

## Performance Considerations

1. **Caching**: Cache credit balance with 1-minute TTL
2. **Indexing**: Proper indexes on user_id and created_at columns
3. **Batch Operations**: Credit resets processed in batches during off-peak hours
4. **Query Optimization**: Use joins to fetch credit balance in single query

## Monitoring and Logging

1. **Credit Deduction Events**: Log all credit deductions with generation type
2. **Payment Events**: Log all payment transactions with status
3. **Error Events**: Log all credit-related errors with context
4. **Metrics**: Track average credits per user, conversion rates, revenue per credit type
