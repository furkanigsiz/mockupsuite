import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  action: 'initialize' | 'verify';
  userId: string;
  type: 'subscription' | 'credit';
  planId?: string;
  packageId?: string;
  amount: number;
  conversationId?: string;
  token?: string;
}

// İyzico API helper
async function iyzicoRequest(endpoint: string, data: any) {
  const apiKey = Deno.env.get('IYZICO_API_KEY');
  const secretKey = Deno.env.get('IYZICO_SECRET_KEY');
  const baseUrl = Deno.env.get('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com';

  if (!apiKey || !secretKey) {
    throw new Error('İyzico credentials not configured');
  }

  // Generate random string for request
  const randomString = crypto.randomUUID();
  
  // Create request body string
  const requestBody = JSON.stringify(data);
  
  // Create the payload to sign: randomKey + uri.path + request.body
  // İyzico formula: HMACSHA256(randomKey + uri.path + request.body, secretKey)
  const payload = randomString + endpoint + requestBody;
  
  // Create HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  
  // Convert to hex string (İyzico expects hex format)
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Create authorization string: apiKey:xxx&randomKey:xxx&signature:xxx
  const authString = `apiKey:${apiKey}&randomKey:${randomString}&signature:${signatureHex}`;
  
  // Base64 encode the authorization string
  const authHeader = btoa(authString);

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `IYZWSv2 ${authHeader}`,
      'x-iyzi-rnd': randomString,
    },
    body: requestBody,
  });

  const responseData = await response.json();

  if (!response.ok || responseData.status === 'failure') {
    throw new Error(responseData.errorMessage || `İyzico API error: ${response.status}`);
  }

  return responseData;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    const requestData: PaymentRequest = await req.json();

    // Validate user ID matches authenticated user
    if (requestData.userId !== user.id) {
      throw new Error('User ID mismatch');
    }

    if (requestData.action === 'initialize') {
      // Initialize payment
      // Priority: 1. Environment variable, 2. Origin header, 3. Localhost fallback
      // For local development with İyzico sandbox, use ngrok/localtunnel
      const envCallbackUrl = Deno.env.get('IYZICO_CALLBACK_URL');
      const origin = req.headers.get('origin');
      
      // Determine callback URL - must point to payment-callback.html
      let callbackUrl: string;
      if (envCallbackUrl) {
        callbackUrl = envCallbackUrl;
        console.log('✅ Using IYZICO_CALLBACK_URL from environment:', callbackUrl);
      } else if (origin && (origin.includes('loca.lt') || origin.includes('ngrok') || origin.includes('https://'))) {
        // Use origin if it's a tunnel or HTTPS URL
        callbackUrl = `${origin}/payment-callback.html`;
        console.log('⚠️ Using origin-based callback URL:', callbackUrl);
      } else {
        // Fallback to localhost (won't work with İyzico sandbox)
        callbackUrl = 'http://localhost:3000/payment-callback.html';
        console.log('⚠️ Using localhost fallback callback URL:', callbackUrl);
      }
      
      const paymentData = {
        locale: 'tr',
        conversationId: requestData.conversationId || crypto.randomUUID(),
        price: requestData.amount.toFixed(2),
        paidPrice: requestData.amount.toFixed(2),
        currency: 'TRY',
        basketId: crypto.randomUUID(),
        paymentGroup: 'PRODUCT',
        callbackUrl: callbackUrl,
        enabledInstallments: [1],
        buyer: {
          id: user.id,
          name: user.user_metadata?.name || 'User',
          surname: user.user_metadata?.surname || 'Name',
          email: user.email,
          identityNumber: '11111111111', // Test için
          registrationAddress: 'Address',
          city: 'Istanbul',
          country: 'Turkey',
          zipCode: '34000',
        },
        shippingAddress: {
          contactName: user.user_metadata?.name || 'User Name',
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Address',
          zipCode: '34000',
        },
        billingAddress: {
          contactName: user.user_metadata?.name || 'User Name',
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Address',
          zipCode: '34000',
        },
        basketItems: [
          {
            id: requestData.planId || requestData.packageId || 'item-1',
            name: requestData.type === 'subscription' ? 'Subscription Plan' : 'Credit Package',
            category1: 'Digital',
            itemType: 'VIRTUAL',
            price: requestData.amount.toFixed(2),
          },
        ],
      };

      const result = await iyzicoRequest('/payment/iyzipos/checkoutform/initialize/auth/ecom', paymentData);

      // Check if payment initialization was successful
      if (result.status !== 'success') {
        throw new Error(result.errorMessage || 'Payment initialization failed');
      }

      // Save transaction to database
      await supabase.from('payment_transactions').insert({
        user_id: user.id,
        type: requestData.type,
        amount: requestData.amount,
        currency: 'TRY',
        status: 'pending',
        iyzico_token: result.token,
        iyzico_conversation_id: paymentData.conversationId,
        metadata: {
          planId: requestData.planId,
          packageId: requestData.packageId,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          token: result.token,
          checkoutFormContent: result.checkoutFormContent,
          paymentPageUrl: result.paymentPageUrl || `https://sandbox-cpp.iyzipay.com?token=${result.token}`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (requestData.action === 'verify') {
      // Verify payment
      if (!requestData.token) {
        throw new Error('Payment token is required for verification');
      }

      const result = await iyzicoRequest('/payment/iyzipos/checkoutform/auth/ecom/detail', {
        locale: 'tr',
        conversationId: requestData.conversationId,
        token: requestData.token,
      });

      // Update transaction status
      const status = result.status === 'success' ? 'completed' : 'failed';
      
      // Get the transaction to find metadata
      const { data: transaction } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('iyzico_token', requestData.token)
        .eq('user_id', user.id)
        .single();

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Update transaction
      await supabase
        .from('payment_transactions')
        .update({
          status,
          iyzico_payment_id: result.paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      // If payment successful and it's a subscription, update subscription
      if (result.status === 'success' && transaction.type === 'subscription') {
        const planId = transaction.metadata?.planId;
        
        if (!planId) {
          throw new Error('Plan ID not found in transaction metadata');
        }

        // Define plan quotas
        const planQuotas: Record<string, number> = {
          free: 5,
          starter: 50,
          pro: 200,
          business: 700,
        };

        const quota = planQuotas[planId] || 0;
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        // Update subscription
        console.log('🔄 Updating subscription for user:', user.id);
        console.log('📅 Setting expires_at to:', periodEnd.toISOString());
        
        const { data: updateData, error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan_id: planId,
            status: 'active',
            remaining_quota: quota,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            expires_at: periodEnd.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('user_id', user.id)
          .select();
        
        if (updateError) {
          console.error('❌ Subscription update error:', updateError);
          throw new Error(`Failed to update subscription: ${updateError.message}`);
        }
        
        console.log('✅ Subscription updated successfully:', updateData);

        // Link transaction to subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (subscription) {
          await supabase
            .from('payment_transactions')
            .update({ subscription_id: subscription.id })
            .eq('id', transaction.id);
        }

        // Log the plan change
        await supabase
          .from('usage_logs')
          .insert({
            user_id: user.id,
            action: 'plan_changed',
            resource_type: 'subscription',
            resource_id: subscription?.id,
            metadata: {
              old_plan: 'free',
              new_plan: planId,
              quota: quota,
            },
          });
      }

      // If payment successful and it's a credit purchase, add credits
      if (result.status === 'success' && transaction.type === 'credit_purchase') {
        const credits = transaction.credits_purchased || 0;
        
        if (credits > 0) {
          // Get current balance
          const { data: balance } = await supabase
            .from('credit_balances')
            .select('balance')
            .eq('user_id', user.id)
            .single();

          const currentBalance = balance?.balance || 0;
          const newBalance = currentBalance + credits;

          // Update balance
          await supabase
            .from('credit_balances')
            .upsert({
              user_id: user.id,
              balance: newBalance,
              updated_at: new Date().toISOString(),
            });

          // Log credit transaction
          await supabase
            .from('credit_transactions')
            .insert({
              user_id: user.id,
              type: 'purchase',
              amount: credits,
              balance_after: newBalance,
              description: `Credit purchase: ${credits} credits`,
              payment_transaction_id: transaction.id,
            });
        }
      }

      return new Response(
        JSON.stringify({
          success: result.status === 'success',
          status: result.status,
          paymentId: result.paymentId,
          errorMessage: result.errorMessage,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Payment function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
