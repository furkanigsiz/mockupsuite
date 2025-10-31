import { supabase } from './supabaseClient';
import {
  PaymentTransaction,
  PaymentType,
  PaymentStatus,
  PaymentError,
  PaymentErrorType,
} from '../types';

/**
 * Payment Service
 * Handles İyzico payment integration for subscriptions and credit purchases
 * 
 * SECURITY: All İyzico API calls are made through Supabase Edge Functions
 * to keep API keys secure on the backend. Never expose API keys in client code!
 */

// Supabase Edge Function URL
const getPaymentFunctionUrl = () => {
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://wjliqsmzsyfmiohwfonc.supabase.co';
  return `${supabaseUrl}/functions/v1/iyzico-payment`;
};

/**
 * Get current user's auth token for Edge Function calls
 */
async function getUserToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    throw new Error('User not authenticated');
  }
  
  return session.access_token;
}

/**
 * Call the İyzico payment Edge Function
 */
async function callPaymentFunction(data: any): Promise<any> {
  const token = await getUserToken();
  const url = getPaymentFunctionUrl();
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Payment function error: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Initialize a payment checkout form
 * Returns the checkout form HTML content and payment token
 */
export async function initializePayment(
  userId: string,
  type: PaymentType,
  amount: number,
  planId?: string,
  packageId?: string
): Promise<{
  token: string;
  checkoutFormContent: string;
  paymentPageUrl: string;
}> {
  try {
    const conversationId = `${userId}-${Date.now()}`;
    
    const result = await callPaymentFunction({
      action: 'initialize',
      userId,
      type,
      amount,
      planId,
      packageId,
      conversationId,
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Payment initialization failed');
    }
    
    return {
      token: result.token,
      checkoutFormContent: result.checkoutFormContent,
      paymentPageUrl: result.paymentPageUrl,
    };
  } catch (error) {
    console.error('Error initializing payment:', error);
    throw handlePaymentError(error);
  }
}

/**
 * Verify a payment after callback
 * Checks the payment status with İyzico
 */
export async function verifyPayment(
  userId: string,
  token: string,
  conversationId: string
): Promise<{
  success: boolean;
  status: string;
  paymentId?: string;
  errorMessage?: string;
}> {
  try {
    const result = await callPaymentFunction({
      action: 'verify',
      userId,
      token,
      conversationId,
    });
    
    return {
      success: result.success,
      status: result.status,
      paymentId: result.paymentId,
      errorMessage: result.errorMessage,
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw handlePaymentError(error);
  }
}

/**
 * Get payment transaction by ID
 */
export async function getPaymentTransaction(
  transactionId: string
): Promise<PaymentTransaction | null> {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) throw error;

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      iyzicoPaymentId: data.iyzico_payment_id,
      iyzicoToken: data.iyzico_token,
      iyzicoConversationId: data.iyzico_conversation_id,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error fetching payment transaction:', error);
    throw handlePaymentError(error);
  }
}

/**
 * Get payment transaction by İyzico token
 */
export async function getPaymentTransactionByToken(
  token: string
): Promise<PaymentTransaction | null> {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('iyzico_token', token)
      .single();

    if (error) throw error;

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      iyzicoPaymentId: data.iyzico_payment_id,
      iyzicoToken: data.iyzico_token,
      iyzicoConversationId: data.iyzico_conversation_id,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error fetching payment transaction by token:', error);
    throw handlePaymentError(error);
  }
}

/**
 * Get user's payment history
 */
export async function getPaymentHistory(
  userId: string,
  limit: number = 50
): Promise<PaymentTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(transaction => ({
      id: transaction.id,
      userId: transaction.user_id,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      iyzicoPaymentId: transaction.iyzico_payment_id,
      iyzicoToken: transaction.iyzico_token,
      iyzicoConversationId: transaction.iyzico_conversation_id,
      metadata: transaction.metadata,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw handlePaymentError(error);
  }
}

/**
 * Handle payment errors and convert to PaymentError type
 */
function handlePaymentError(error: any): PaymentError {
  const errorMessage = error?.message || 'Unknown payment error';
  
  // Network errors
  if (error?.name === 'TypeError' || errorMessage.includes('fetch')) {
    return {
      type: PaymentErrorType.NETWORK_ERROR,
      message: errorMessage,
      userMessage: 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.',
      retryable: true,
    };
  }
  
  // İyzico specific errors
  if (errorMessage.includes('İyzico') || errorMessage.includes('iyzico')) {
    return {
      type: PaymentErrorType.IYZICO_ERROR,
      message: errorMessage,
      userMessage: 'Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.',
      retryable: true,
    };
  }
  
  // Authentication errors
  if (errorMessage.includes('authenticated') || errorMessage.includes('authorization')) {
    return {
      type: PaymentErrorType.PAYMENT_FAILED,
      message: errorMessage,
      userMessage: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
      retryable: false,
    };
  }
  
  // Card errors
  if (errorMessage.includes('card') || errorMessage.includes('kart')) {
    return {
      type: PaymentErrorType.INVALID_CARD,
      message: errorMessage,
      userMessage: 'Kart bilgileriniz geçersiz. Lütfen kontrol edip tekrar deneyin.',
      retryable: true,
    };
  }
  
  // Insufficient funds
  if (errorMessage.includes('insufficient') || errorMessage.includes('yetersiz')) {
    return {
      type: PaymentErrorType.INSUFFICIENT_FUNDS,
      message: errorMessage,
      userMessage: 'Yetersiz bakiye. Lütfen başka bir kart deneyin.',
      retryable: true,
    };
  }
  
  // Default error
  return {
    type: PaymentErrorType.PAYMENT_FAILED,
    message: errorMessage,
    userMessage: 'Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.',
    retryable: true,
  };
}

/**
 * Cancel a pending payment
 */
export async function cancelPayment(transactionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('payment_transactions')
      .update({
        status: 'failed' as PaymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .eq('status', 'pending');

    if (error) throw error;
  } catch (error) {
    console.error('Error cancelling payment:', error);
    throw handlePaymentError(error);
  }
}

/**
 * Refund a successful payment
 * Note: This is a placeholder. Actual refund logic should be implemented
 * with İyzico refund API when needed.
 */
export async function refundPayment(
  transactionId: string,
  reason?: string
): Promise<void> {
  try {
    // TODO: Implement İyzico refund API call through Edge Function
    
    const { error } = await supabase
      .from('payment_transactions')
      .update({
        status: 'refunded' as PaymentStatus,
        metadata: {
          refundReason: reason,
          refundedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .eq('status', 'success');

    if (error) throw error;
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw handlePaymentError(error);
  }
}

/**
 * Create a subscription payment
 * Helper function for PaymentCheckout component
 */
export async function createSubscriptionPayment(
  userId: string,
  plan: any
): Promise<{
  success: boolean;
  token?: string;
  checkoutFormUrl?: string;
  errorMessage?: string;
}> {
  try {
    const result = await initializePayment(
      userId,
      'subscription',
      plan.price,
      plan.id
    );
    
    return {
      success: true,
      token: result.token,
      checkoutFormUrl: result.paymentPageUrl,
    };
  } catch (error: any) {
    return {
      success: false,
      errorMessage: error.message || 'Payment initialization failed',
    };
  }
}

/**
 * Create a credit payment
 * Helper function for PaymentCheckout component
 */
export async function createCreditPayment(
  userId: string,
  creditPackage: any
): Promise<{
  success: boolean;
  token?: string;
  checkoutFormUrl?: string;
  errorMessage?: string;
}> {
  try {
    const result = await initializePayment(
      userId,
      'credit',
      creditPackage.price,
      undefined,
      creditPackage.id
    );
    
    return {
      success: true,
      token: result.token,
      checkoutFormUrl: result.paymentPageUrl,
    };
  } catch (error: any) {
    return {
      success: false,
      errorMessage: error.message || 'Payment initialization failed',
    };
  }
}
