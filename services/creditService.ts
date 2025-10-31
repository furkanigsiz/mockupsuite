import { supabase } from './supabaseClient';
import { cacheService } from './cacheService';
import { handleSupabaseError } from '../utils/errorHandling';
import type { CreditPackage, CreditBalance, CreditTransaction } from '../types';

/**
 * Credit Service
 * Manages user credit balances, packages, and transactions
 */

// Credit package definitions
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

/**
 * Get user's current credit balance
 */
export async function getCreditBalance(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('credit_balances')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return data?.balance ?? 0;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Add credits to user's balance (after successful payment)
 */
export async function addCredits(
  userId: string,
  amount: number,
  transactionId: string
): Promise<CreditBalance> {
  try {
    // Get current balance
    const currentBalance = await getCreditBalance(userId);
    const newBalance = currentBalance + amount;

    // Update balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('credit_balances')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (balanceError) throw balanceError;

    // Record transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'purchase',
        amount,
        balance_after: newBalance,
        description: `Kredi satın alımı: ${amount} kredi`,
        payment_transaction_id: transactionId,
      });

    if (transactionError) throw transactionError;

    // Invalidate cache
    cacheService.invalidateCredits(userId);

    return {
      userId,
      balance: newBalance,
      lastUpdated: balanceData.updated_at,
    };
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Deduct credits from user's balance (for image generation)
 */
export async function deductCredits(
  userId: string,
  amount: number = 1
): Promise<CreditBalance> {
  try {
    // Get current balance
    const currentBalance = await getCreditBalance(userId);

    if (currentBalance < amount) {
      throw new Error('Yetersiz kredi bakiyesi');
    }

    const newBalance = currentBalance - amount;

    // Update balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('credit_balances')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (balanceError) throw balanceError;

    // Record transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'deduction',
        amount: -amount,
        balance_after: newBalance,
        description: `Görüntü oluşturma: ${amount} kredi`,
      });

    if (transactionError) throw transactionError;

    // Invalidate cache
    cacheService.invalidateCredits(userId);

    return {
      userId,
      balance: newBalance,
      lastUpdated: balanceData.updated_at,
    };
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Get available credit packages
 */
export function getAvailablePackages(): CreditPackage[] {
  return CREDIT_PACKAGES;
}

/**
 * Purchase credits (initiates payment flow)
 */
export async function purchaseCredits(
  userId: string,
  packageId: string,
  paymentToken: string
): Promise<CreditBalance> {
  try {
    // Find the package
    const creditPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    
    if (!creditPackage) {
      throw new Error('Geçersiz kredi paketi');
    }

    // Verify payment was successful
    const { data: paymentData, error: paymentError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('iyzico_token', paymentToken)
      .eq('user_id', userId)
      .eq('status', 'success')
      .single();

    if (paymentError || !paymentData) {
      throw new Error('Ödeme doğrulanamadı');
    }

    // Add credits to user's balance
    const creditBalance = await addCredits(
      userId,
      creditPackage.credits,
      paymentData.id
    );

    return creditBalance;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Get user's credit transaction history
 */
export async function getCreditTransactions(
  userId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
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
      balance: transaction.balance_after,
      description: transaction.description,
      createdAt: transaction.created_at,
    }));
  } catch (error) {
    throw handleSupabaseError(error);
  }
}
