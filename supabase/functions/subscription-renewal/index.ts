import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan quotas
const PLAN_QUOTAS: Record<string, number> = {
  free: 5,
  starter: 50,
  pro: 200,
  business: 700,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify cron secret for security
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    
    if (expectedSecret && cronSecret !== expectedSecret) {
      throw new Error('Unauthorized: Invalid cron secret');
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const results = {
      quotasReset: 0,
      subscriptionsDowngraded: 0,
      remindersCreated: 0,
      errors: [] as string[],
    };

    // 1. Reset expired quotas for active subscriptions with auto-renew
    console.log('🔄 Resetting expired quotas...');
    try {
      const { data: expiredSubscriptions, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .eq('auto_renew', true)
        .lt('current_period_end', now.toISOString());

      if (fetchError) {
        throw fetchError;
      }

      if (expiredSubscriptions && expiredSubscriptions.length > 0) {
        console.log(`📊 Found ${expiredSubscriptions.length} subscriptions to renew`);

        for (const subscription of expiredSubscriptions) {
          const quota = PLAN_QUOTAS[subscription.plan_id] || 0;
          const newPeriodStart = new Date(subscription.current_period_end);
          const newPeriodEnd = new Date(newPeriodStart);
          newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

          // Update subscription
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              remaining_quota: quota,
              current_period_start: newPeriodStart.toISOString(),
              current_period_end: newPeriodEnd.toISOString(),
              expires_at: newPeriodEnd.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('id', subscription.id);

          if (updateError) {
            console.error(`❌ Error updating subscription ${subscription.id}:`, updateError);
            results.errors.push(`Failed to reset quota for subscription ${subscription.id}: ${updateError.message}`);
            continue;
          }

          // Log quota reset
          await supabase
            .from('usage_logs')
            .insert({
              user_id: subscription.user_id,
              action: 'quota_reset',
              resource_type: 'subscription',
              resource_id: subscription.id,
              metadata: {
                plan_id: subscription.plan_id,
                new_quota: quota,
                period_start: newPeriodStart.toISOString(),
                period_end: newPeriodEnd.toISOString(),
              },
            });

          results.quotasReset++;
          console.log(`✅ Reset quota for user ${subscription.user_id} (${subscription.plan_id}): ${quota} images`);
        }
      } else {
        console.log('ℹ️ No subscriptions need quota reset');
      }
    } catch (error) {
      console.error('❌ Error resetting quotas:', error);
      results.errors.push(`Quota reset error: ${error.message}`);
    }

    // 2. Downgrade expired subscriptions without auto-renew to free tier
    console.log('⬇️ Downgrading expired subscriptions...');
    try {
      const { data: expiredNoRenew, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .eq('auto_renew', false)
        .lt('current_period_end', now.toISOString())
        .neq('plan_id', 'free');

      if (fetchError) {
        throw fetchError;
      }

      if (expiredNoRenew && expiredNoRenew.length > 0) {
        console.log(`📊 Found ${expiredNoRenew.length} subscriptions to downgrade`);

        for (const subscription of expiredNoRenew) {
          const oldPlan = subscription.plan_id;
          const newPeriodStart = now;
          const newPeriodEnd = new Date(now);
          newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

          // Downgrade to free tier
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              plan_id: 'free',
              status: 'active',
              remaining_quota: PLAN_QUOTAS.free,
              current_period_start: newPeriodStart.toISOString(),
              current_period_end: newPeriodEnd.toISOString(),
              expires_at: newPeriodEnd.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('id', subscription.id);

          if (updateError) {
            console.error(`❌ Error downgrading subscription ${subscription.id}:`, updateError);
            results.errors.push(`Failed to downgrade subscription ${subscription.id}: ${updateError.message}`);
            continue;
          }

          // Log plan change
          await supabase
            .from('usage_logs')
            .insert({
              user_id: subscription.user_id,
              action: 'plan_changed',
              resource_type: 'subscription',
              resource_id: subscription.id,
              metadata: {
                old_plan: oldPlan,
                new_plan: 'free',
                reason: 'subscription_expired',
                quota: PLAN_QUOTAS.free,
              },
            });

          results.subscriptionsDowngraded++;
          console.log(`✅ Downgraded user ${subscription.user_id} from ${oldPlan} to free`);
        }
      } else {
        console.log('ℹ️ No subscriptions need downgrading');
      }
    } catch (error) {
      console.error('❌ Error downgrading subscriptions:', error);
      results.errors.push(`Downgrade error: ${error.message}`);
    }

    // 3. Create renewal reminder notifications (3 days before expiry)
    console.log('🔔 Creating renewal reminders...');
    try {
      const { data: upcomingExpiry, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .neq('plan_id', 'free')
        .gte('current_period_end', now.toISOString())
        .lte('current_period_end', threeDaysFromNow.toISOString());

      if (fetchError) {
        throw fetchError;
      }

      if (upcomingExpiry && upcomingExpiry.length > 0) {
        console.log(`📊 Found ${upcomingExpiry.length} subscriptions expiring soon`);

        for (const subscription of upcomingExpiry) {
          // Check if reminder already sent for this period
          const { data: existingReminder } = await supabase
            .from('usage_logs')
            .select('id')
            .eq('user_id', subscription.user_id)
            .eq('action', 'renewal_reminder')
            .eq('resource_id', subscription.id)
            .gte('created_at', subscription.current_period_start)
            .single();

          if (existingReminder) {
            console.log(`ℹ️ Reminder already sent for subscription ${subscription.id}`);
            continue;
          }

          const expiryDate = new Date(subscription.current_period_end);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Log renewal reminder
          await supabase
            .from('usage_logs')
            .insert({
              user_id: subscription.user_id,
              action: 'renewal_reminder',
              resource_type: 'subscription',
              resource_id: subscription.id,
              metadata: {
                plan_id: subscription.plan_id,
                expiry_date: subscription.current_period_end,
                days_until_expiry: daysUntilExpiry,
                auto_renew: subscription.auto_renew,
              },
            });

          results.remindersCreated++;
          console.log(`✅ Created renewal reminder for user ${subscription.user_id} (expires in ${daysUntilExpiry} days)`);
        }
      } else {
        console.log('ℹ️ No subscriptions expiring in the next 3 days');
      }
    } catch (error) {
      console.error('❌ Error creating reminders:', error);
      results.errors.push(`Reminder creation error: ${error.message}`);
    }

    // 4. Log overall execution
    await supabase
      .from('usage_logs')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // System user
        action: 'cron_execution',
        resource_type: 'system',
        metadata: {
          job: 'subscription_renewal',
          timestamp: now.toISOString(),
          results,
        },
      });

    console.log('✅ Subscription renewal job completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Subscription renewal job error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
