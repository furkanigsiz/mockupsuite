# Design Document - İyzico Payment System

## Overview

Bu design dökümanı, MockupSuite uygulamasına iyzico ödeme sistemi entegrasyonunu detaylandırır. Sistem, kullanıcıların abonelik planları satın almasını, kredi bazlı ödeme yapmasını ve ücretsiz tier kullanmasını sağlayacaktır. Ayrıca queue yönetimi, watermark ekleme ve kullanıcı dashboard'u içerecektir.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Application                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Registration │  │  Dashboard   │  │   Payment    │          │
│  │   Flow UI    │  │      UI      │  │   Flow UI    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│  ┌──────▼──────────────────▼──────────────────▼───────────┐    │
│  │           Payment & Subscription Service Layer          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │    │
│  │  │ Payment  │  │Subscript.│  │  Credit  │  │ Queue  │ │    │
│  │  │ Service  │  │ Service  │  │ Service  │  │Manager │ │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │    │
│  └───────┼─────────────┼─────────────┼────────────┼──────┘    │
└──────────┼─────────────┼─────────────┼────────────┼───────────┘
           │             │             │            │
           ▼             ▼             ▼            ▼
    ┌──────────────────────────────────────────────────────┐
    │              Supabase Backend                        │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
    │  │Postgres  │  │  Auth    │  │ Storage  │          │
    │  │  + RLS   │  │          │  │          │          │
    │  └──────────┘  └──────────┘  └──────────┘          │
    └──────────────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────┐
    │  İyzico API      │
    │  Payment Gateway │
    └──────────────────┘
```

### Technology Stack

- **Payment Gateway**: İyzico REST API
- **Backend**: Supabase (PostgreSQL + Auth)
- **Queue Management**: Supabase Realtime + PostgreSQL
- **Image Processing**: Canvas API (watermark)
- **State Management**: React Context + Hooks

## Components and Interfaces

### 1. Payment Service

**File**: `services/paymentService.ts`

```typescript
interface PaymentService {
  // İyzico Integration
  initializePayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyPayment(token: string): Promise<PaymentVerification>;
  handleCallback(callbackData: IyzicoCallback): Promise<PaymentResult>;
  
  // Subscription Payments
  createSubscriptionPayment(userId: string, plan: SubscriptionPlan): Promise<PaymentResponse>;
  
  // Credit Payments
  createCreditPayment(userId: string, package: CreditPackage): Promise<PaymentResponse>;
  
  // Payment History
  getPaymentHistory(userId: string): Promise<PaymentTransaction[]>;
}

interface PaymentRequest {
  userId: string;
  amount: number;
  currency: 'TRY';
  description: string;
  callbackUrl: string;
  type: 'subscription' | 'credit';
  metadata: {
    planId?: string;
    packageId?: string;
  };
}

interface PaymentResponse {
  success: boolean;
  checkoutFormUrl?: string;
  token?: string;
  errorMessage?: string;
}

interface IyzicoCallback {
  status: 'success' | 'failure';
  token: string;
  conversationId: string;
  paymentId: string;
}
```

**İyzico API Integration**:
- Sandbox URL: `https://sandbox-api.iyzipay.com`
- Production URL: `https://api.iyzipay.com`
- Authentication: API Key + Secret Key (HMAC-SHA256)
- Checkout Form: 3D Secure enabled

### 2. Subscription Service

**File**: `services/subscriptionService.ts`

```typescript
interface SubscriptionService {
  // Plan Management
  getAvailablePlans(): SubscriptionPlan[];
  getCurrentPlan(userId: string): Promise<UserSubscription | null>;
  
  // Subscription Operations
  createSubscription(userId: string, planId: string, paymentToken: string): Promise<UserSubscription>;
  upgradeSubscription(userId: string, newPlanId: string): Promise<UserSubscription>;
  cancelSubscription(userId: string): Promise<void>;
  renewSubscription(userId: string): Promise<UserSubscription>;
  
  // Quota Management
  getRemainingQuota(userId: string): Promise<QuotaInfo>;
  decrementQuota(userId: string, amount: number): Promise<QuotaInfo>;
  resetMonthlyQuota(userId: string): Promise<void>;
  
  // Validation
  canGenerateImage(userId: string): Promise<boolean>;
  requiresUpgrade(userId: string): Promise<boolean>;
}

interface SubscriptionPlan {
  id: string;
  name: 'free' | 'starter' | 'pro' | 'business';
  displayName: string;
  price: number; // TRY
  monthlyQuota: number; // images
  features: PlanFeatures;
}

interface PlanFeatures {
  maxResolution: number; // pixels
  hasWatermark: boolean;
  queuePriority: 'low' | 'high';
  supportLevel: 'community' | 'email' | 'priority';
}

interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  remainingQuota: number;
  autoRenew: boolean;
}

interface QuotaInfo {
  total: number;
  used: number;
  remaining: number;
  resetDate: string;
}
```

**Subscription Plans**:
```typescript
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'free',
    displayName: 'Free Tier',
    price: 0,
    monthlyQuota: 5,
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
    monthlyQuota: 50,
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
    monthlyQuota: 200,
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
    monthlyQuota: 700,
    features: {
      maxResolution: 4096,
      hasWatermark: false,
      queuePriority: 'high',
      supportLevel: 'priority',
    },
  },
];
```

### 3. Credit Service

**File**: `services/creditService.ts`

```typescript
interface CreditService {
  // Credit Management
  getCreditBalance(userId: string): Promise<number>;
  addCredits(userId: string, amount: number, transactionId: string): Promise<CreditBalance>;
  deductCredits(userId: string, amount: number): Promise<CreditBalance>;
  
  // Credit Packages
  getAvailablePackages(): CreditPackage[];
  purchaseCredits(userId: string, packageId: string, paymentToken: string): Promise<CreditBalance>;
  
  // Transaction History
  getCreditTransactions(userId: string): Promise<CreditTransaction[]>;
}

interface CreditPackage {
  id: string;
  name: string;
  price: number; // TRY
  credits: number; // number of images
  pricePerImage: number;
}

interface CreditBalance {
  userId: string;
  balance: number;
  lastUpdated: string;
}

interface CreditTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'deduction' | 'refund';
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}
```

**Credit Packages**:
```typescript
const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'small',
    name: 'Küçük Paket',
    price: 25,
    credits: 3,
    pricePerImage: 8.33,
  },
  {
    id: 'medium',
    name: 'Orta Paket',
    price: 100,
    credits: 15,
    pricePerImage: 6.67,
  },
  {
    id: 'large',
    name: 'Büyük Paket',
    price: 250,
    credits: 40,
    pricePerImage: 6.25,
  },
];
```

### 4. Queue Manager Service

**File**: `services/queueManagerService.ts`

```typescript
interface QueueManagerService {
  // Queue Operations
  addToQueue(request: RenderRequest): Promise<QueueItem>;
  getQueuePosition(requestId: string): Promise<QueuePosition>;
  processNextRequest(): Promise<QueueItem | null>;
  
  // Queue Status
  getQueueStatus(userId: string): Promise<QueueStatus>;
  estimateWaitTime(priority: 'low' | 'high'): Promise<number>; // seconds
  
  // Priority Management
  getUserPriority(userId: string): Promise<'low' | 'high'>;
}

interface RenderRequest {
  userId: string;
  projectId: string;
  prompt: string;
  images: string[];
  priority: 'low' | 'high';
}

interface QueueItem {
  id: string;
  userId: string;
  request: RenderRequest;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'high';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface QueuePosition {
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number; // seconds
}

interface QueueStatus {
  activeRequests: QueueItem[];
  pendingCount: number;
  averageProcessingTime: number; // seconds
}
```

### 5. Watermark Service

**File**: `services/watermarkService.ts`

```typescript
interface WatermarkService {
  addWatermark(imageBase64: string, text: string): Promise<string>;
  shouldApplyWatermark(userId: string): Promise<boolean>;
  resizeImage(imageBase64: string, maxDimension: number): Promise<string>;
}
```

**Watermark Implementation**:
- Position: Bottom-right corner
- Text: "MockupSuite AI generated"
- Font: Arial, 16px, semi-transparent white
- Background: Semi-transparent black rectangle
- Padding: 10px

### 6. Registration Flow Service

**File**: `services/registrationService.ts`

```typescript
interface RegistrationService {
  // Registration Flow
  registerUser(email: string, password: string): Promise<RegistrationResult>;
  selectPlan(userId: string, planId: string): Promise<PlanSelectionResult>;
  completeFreeRegistration(userId: string): Promise<void>;
  completeP aidRegistration(userId: string, paymentToken: string): Promise<void>;
  
  // Validation
  hasSelectedPlan(userId: string): Promise<boolean>;
  canAccessApp(userId: string): Promise<boolean>;
}

interface RegistrationResult {
  userId: string;
  email: string;
  requiresPlanSelection: boolean;
}

interface PlanSelectionResult {
  requiresPayment: boolean;
  paymentUrl?: string;
}
```

## Data Models

### Database Schema Extensions

**Table: subscriptions**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'starter', 'pro', 'business')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  remaining_quota INTEGER NOT NULL DEFAULT 0,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
```

**Table: credit_balances**
```sql
CREATE TABLE credit_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_credit_balances_user_id ON credit_balances(user_id);
```

**Table: credit_transactions**
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'deduction', 'refund')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  payment_transaction_id UUID REFERENCES payment_transactions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
```

**Table: payment_transactions**
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('subscription', 'credit')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  iyzico_payment_id TEXT,
  iyzico_token TEXT,
  iyzico_conversation_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_iyzico_token ON payment_transactions(iyzico_token);
```

**Table: render_queue**
```sql
CREATE TABLE render_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'high')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  request_data JSONB NOT NULL,
  result_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_render_queue_user_id ON render_queue(user_id);
CREATE INDEX idx_render_queue_status_priority ON render_queue(status, priority, created_at);
CREATE INDEX idx_render_queue_created_at ON render_queue(created_at);
```

**Table: usage_logs**
```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('image_generated', 'quota_reset', 'plan_changed')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);
```

### Row Level Security (RLS) Policies

```sql
-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Credit Balances
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit balance" ON credit_balances
  FOR SELECT USING (auth.uid() = user_id);

-- Credit Transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Payment Transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Render Queue
ALTER TABLE render_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own queue items" ON render_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Usage Logs
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);
```

### Database Functions

**Function: Auto-create free subscription on user registration**
```sql
CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (
    user_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    remaining_quota
  ) VALUES (
    NEW.id,
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '30 days',
    0  -- Will be set to 5 after plan selection
  );
  
  INSERT INTO credit_balances (user_id, balance)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_free_subscription();
```

**Function: Reset monthly quotas**
```sql
CREATE OR REPLACE FUNCTION reset_expired_quotas()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET 
    remaining_quota = CASE plan_id
      WHEN 'free' THEN 5
      WHEN 'starter' THEN 50
      WHEN 'pro' THEN 200
      WHEN 'business' THEN 700
    END,
    current_period_start = current_period_end,
    current_period_end = current_period_end + INTERVAL '30 days',
    updated_at = NOW()
  WHERE 
    status = 'active' 
    AND current_period_end < NOW()
    AND auto_renew = TRUE;
    
  -- Log quota resets
  INSERT INTO usage_logs (user_id, action, metadata)
  SELECT 
    user_id,
    'quota_reset',
    jsonb_build_object('plan_id', plan_id, 'new_quota', remaining_quota)
  FROM subscriptions
  WHERE updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

## UI Components

### 1. Plan Selection Modal

**Component**: `components/PlanSelectionModal.tsx`

**Features**:
- Display all 4 plans (Free, Starter, Pro, Business)
- Highlight recommended plan
- Show price, quota, and features comparison
- "Select Plan" button for each
- Cannot be dismissed until plan is selected

### 2. Payment Checkout Flow

**Component**: `components/PaymentCheckout.tsx`

**Flow**:
1. User selects paid plan
2. Redirect to iyzico checkout form
3. User completes payment
4. Callback to app with payment result
5. Activate subscription or add credits
6. Redirect to dashboard

### 3. Dashboard Quota Widget

**Component**: `components/QuotaWidget.tsx`

**Display**:
- Current plan name
- Remaining quota (progress bar)
- Reset/renewal date
- "Upgrade Now" button (if quota < 20% or expired)

### 4. Upgrade Modal

**Component**: `components/UpgradeModal.tsx`

**Triggers**:
- Quota exhausted
- User clicks "Upgrade Now"
- 3 days before renewal

**Content**:
- Current plan vs available upgrades
- Price comparison
- Feature comparison
- Immediate upgrade button

## Error Handling

### Payment Errors

```typescript
enum PaymentErrorType {
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  INVALID_CARD = 'INVALID_CARD',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  IYZICO_ERROR = 'IYZICO_ERROR',
}

interface PaymentError {
  type: PaymentErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
}
```

### Quota Errors

```typescript
enum QuotaErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NO_CREDITS = 'NO_CREDITS',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
}
```

## Testing Strategy

### Unit Tests
- Test subscription service methods
- Test credit calculations
- Test queue priority logic
- Test watermark application
- Test payment request generation

### Integration Tests
- Test complete payment flow
- Test subscription activation
- Test quota management
- Test queue processing
- Test plan upgrades

### E2E Tests
- Test registration with plan selection
- Test payment completion
- Test image generation with quota deduction
- Test upgrade flow
- Test free tier limitations

## Security Considerations

1. **İyzico API Keys**: Store in environment variables, never expose in client
2. **Payment Verification**: Always verify payment on server-side callback
3. **Quota Validation**: Check quota before processing render requests
4. **RLS Policies**: Ensure users can only access their own data
5. **Rate Limiting**: Prevent abuse of free tier
6. **Webhook Validation**: Verify iyzico webhook signatures
7. **PCI Compliance**: Never store card details, use iyzico checkout form

## Performance Considerations

1. **Queue Processing**: Use Supabase Realtime for instant queue updates
2. **Caching**: Cache subscription and credit data for 5 minutes
3. **Batch Operations**: Batch quota decrements for multiple images
4. **Database Indexes**: Index frequently queried columns
5. **Pagination**: Paginate payment history and usage logs
6. **Lazy Loading**: Load payment history on demand

## Cost Analysis

### Per-Image Costs

**Gemini API Cost**: ₺1.35 per image

**Profit Margins**:
- Free Tier: -₺1.35 (loss leader for acquisition)
- Starter: ₺5.98 - ₺1.35 = ₺4.63 profit/image
- Pro: ₺3.24 - ₺1.35 = ₺1.89 profit/image
- Business: ₺1.71 - ₺1.35 = ₺0.36 profit/image
- Credits: ₺6.25-₺8.33 - ₺1.35 = ₺4.90-₺6.98 profit/image

**Monthly Revenue Projections**:
- 100 Starter users: ₺29,900 revenue, ₺6,750 cost = ₺23,150 profit
- 50 Pro users: ₺32,450 revenue, ₺13,500 cost = ₺18,950 profit
- 20 Business users: ₺23,980 revenue, ₺18,900 cost = ₺5,080 profit

