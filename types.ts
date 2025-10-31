export interface UploadedImage {
  base64: string;
  name: string;
  type: string;
  previewUrl: string;
}

export interface BatchResult {
  source: UploadedImage;
  generated: string[];
}

export interface PromptTemplate {
  id: string;
  text: string;
}

export interface BrandKit {
  logo: string | null; // base64
  useWatermark: boolean;
  colors: string[]; // hex codes
}

export interface Project {
  id: string;
  name: string;
  uploadedImages: UploadedImage[];
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16';
  savedImages: string[];
  suggestedPrompts: string[];
}

export type AppMode = 'scene' | 'product' | 'video';

export type ProductCategory = 'Apparel' | 'Home Goods' | 'Print' | 'Tech';

export interface ProductTemplate {
  id: string;
  name: string;
  category: ProductCategory;
  imageUrl: string;
}

// Video Generation Types

export interface VideoResult {
  source: UploadedImage;
  generatedUrl: string;
  duration?: number;
  createdAt: string;
}

export interface VideoGenerationRequest {
  userId: string;
  projectId?: string;
  prompt: string;
  sourceImage: string; // base64
  duration?: number; // requested duration (5-10 seconds)
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface VideoQueueItem extends Omit<QueueItem, 'requestData' | 'resultData'> {
  requestData: {
    prompt: string;
    images: string[];
    aspectRatio?: string;
    duration?: number;
    videoGeneration: true; // flag to identify video requests
  };
  resultData?: {
    videoUrl: string;
    duration: number;
  };
}

export enum VideoErrorType {
  VIDEO_GENERATION_FAILED = 'VIDEO_GENERATION_FAILED',
  VIDEO_UPLOAD_FAILED = 'VIDEO_UPLOAD_FAILED',
  INVALID_SOURCE_IMAGE = 'INVALID_SOURCE_IMAGE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  GENERATION_TIMEOUT = 'GENERATION_TIMEOUT',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
}

export interface VideoError {
  type: VideoErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
}

// Payment System Types

export type PlanId = 'free' | 'starter' | 'pro' | 'business';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type QueuePriority = 'low' | 'high';
export type SupportLevel = 'community' | 'email' | 'priority';
export type PaymentType = 'subscription' | 'credit';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type CreditTransactionType = 'purchase' | 'deduction' | 'refund';
export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PlanFeatures {
  maxResolution: number; // pixels
  hasWatermark: boolean;
  queuePriority: QueuePriority;
  supportLevel: SupportLevel;
}

export interface SubscriptionPlan {
  id: PlanId;
  name: PlanId;
  displayName: string;
  price: number; // TRY
  monthlyQuota: number; // images
  features: PlanFeatures;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  remainingQuota: number;
  autoRenew: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  price: number; // TRY
  credits: number; // number of images
  pricePerImage: number;
}

export interface CreditBalance {
  id?: string;
  userId: string;
  balance: number;
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;
  balance: number;
  description?: string;
  paymentTransactionId?: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  iyzicoPaymentId?: string;
  iyzicoToken?: string;
  iyzicoConversationId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface QueueItem {
  id: string;
  userId: string;
  projectId?: string;
  priority: QueuePriority;
  status: QueueItemStatus;
  requestData: {
    prompt: string;
    images: string[];
    aspectRatio?: string;
    duration?: number;
    videoGeneration?: boolean;
  };
  resultData?: {
    generatedImages?: string[];
    videoUrl?: string;
    duration?: number;
  };
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface QuotaInfo {
  total: number;
  used: number;
  remaining: number;
  resetDate: string;
}

// Payment Error Types
export enum PaymentErrorType {
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  INVALID_CARD = 'INVALID_CARD',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  IYZICO_ERROR = 'IYZICO_ERROR',
}

export interface PaymentError {
  type: PaymentErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
}

// Quota Error Types
export enum QuotaErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NO_CREDITS = 'NO_CREDITS',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
}

// Subscription Plan Constants
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
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

// Credit Package Constants
export const CREDIT_PACKAGES: CreditPackage[] = [
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
