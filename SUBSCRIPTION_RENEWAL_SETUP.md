# Subscription Renewal Automation Setup Guide

This guide explains how to configure and use the automated subscription renewal system.

## Overview

The subscription renewal system automatically:
- Resets monthly quotas for active subscriptions with auto-renew
- Downgrades expired subscriptions to free tier
- Creates renewal reminder notifications 3 days before expiry
- Logs all actions for audit and monitoring

## Setup Status

✅ **Edge Function Deployed**: `subscription-renewal` is active
✅ **Database Migration Applied**: Cron job and helper functions created
✅ **Cron Job Scheduled**: Runs daily at 2 AM UTC

## Configuration

### 1. Set Cron Secret (Optional but Recommended)

For security, set a cron secret to prevent unauthorized access:

```bash
# Generate a secure random string
openssl rand -base64 32

# Set it as a Supabase secret
supabase secrets set CRON_SECRET=your-generated-secret
```

### 2. Verify Cron Job Status

Check if the cron job is active:

```sql
SELECT * FROM subscription_renewal_status;
```

Expected output:
```
jobid | schedule    | command                              | active | jobname
------|-------------|--------------------------------------|--------|-------------------------
1     | 0 2 * * *   | SELECT trigger_subscription_renewal()| true   | subscription-renewal-daily
```

### 3. Manual Testing

Test the function manually before waiting for the scheduled run:

```bash
# Using curl (replace with your project details)
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  "https://wjliqsmzsyfmiohwfonc.supabase.co/functions/v1/subscription-renewal"
```

Or call the database function directly:

```sql
SELECT trigger_subscription_renewal();
```

## Monitoring

### View Recent Executions

```sql
-- View cron execution logs
SELECT 
  created_at,
  metadata->>'results' as results
FROM usage_logs
WHERE action = 'cron_execution'
  AND resource_type = 'system'
ORDER BY created_at DESC
LIMIT 10;
```

### View Quota Resets

```sql
-- View recent quota resets
SELECT 
  user_id,
  created_at,
  metadata->>'plan_id' as plan,
  metadata->>'new_quota' as new_quota,
  metadata->>'period_end' as period_end
FROM usage_logs
WHERE action = 'quota_reset'
ORDER BY created_at DESC
LIMIT 20;
```

### View Subscription Downgrades

```sql
-- View recent downgrades
SELECT 
  user_id,
  created_at,
  metadata->>'old_plan' as old_plan,
  metadata->>'new_plan' as new_plan,
  metadata->>'reason' as reason
FROM usage_logs
WHERE action = 'plan_changed'
  AND metadata->>'reason' = 'subscription_expired'
ORDER BY created_at DESC
LIMIT 20;
```

### View Renewal Reminders

```sql
-- View recent renewal reminders
SELECT 
  user_id,
  created_at,
  metadata->>'plan_id' as plan,
  metadata->>'days_until_expiry' as days_until_expiry,
  metadata->>'expiry_date' as expiry_date
FROM usage_logs
WHERE action = 'renewal_reminder'
ORDER BY created_at DESC
LIMIT 20;
```

## How It Works

### 1. Quota Reset (Auto-Renew Subscriptions)

For subscriptions with `auto_renew = true` and `current_period_end < now()`:
- Resets `remaining_quota` to plan's monthly quota
- Updates `current_period_start` to previous `current_period_end`
- Sets `current_period_end` to 1 month from new start date
- Logs action as `quota_reset`

### 2. Subscription Downgrade (Expired Subscriptions)

For subscriptions with `auto_renew = false` and `current_period_end < now()`:
- Changes `plan_id` to `free`
- Sets `remaining_quota` to 5 (free tier quota)
- Updates billing period to start from now
- Logs action as `plan_changed` with reason `subscription_expired`

### 3. Renewal Reminders

For subscriptions expiring within 3 days:
- Checks if reminder already sent for current period
- Creates log entry with action `renewal_reminder`
- Includes days until expiry and auto-renew status
- Only sends one reminder per billing period

## Troubleshooting

### Cron Job Not Running

1. Check if pg_cron extension is enabled:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. Check cron job status:
```sql
SELECT * FROM cron.job WHERE jobname = 'subscription-renewal-daily';
```

3. View cron job history:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'subscription-renewal-daily')
ORDER BY start_time DESC
LIMIT 10;
```

### Edge Function Errors

View Edge Function logs:
```bash
supabase functions logs subscription-renewal --follow
```

### Database Function Errors

The database function logs errors as warnings. Check PostgreSQL logs or run manually:
```sql
SELECT trigger_subscription_renewal();
```

### No Subscriptions Being Processed

Verify there are subscriptions that need processing:

```sql
-- Check for expired subscriptions with auto-renew
SELECT id, user_id, plan_id, current_period_end, auto_renew
FROM subscriptions
WHERE status = 'active'
  AND auto_renew = true
  AND current_period_end < NOW();

-- Check for expired subscriptions without auto-renew
SELECT id, user_id, plan_id, current_period_end, auto_renew
FROM subscriptions
WHERE status = 'active'
  AND auto_renew = false
  AND current_period_end < NOW()
  AND plan_id != 'free';

-- Check for subscriptions expiring soon
SELECT id, user_id, plan_id, current_period_end
FROM subscriptions
WHERE status = 'active'
  AND plan_id != 'free'
  AND current_period_end BETWEEN NOW() AND NOW() + INTERVAL '3 days';
```

## Disabling the Cron Job

If you need to temporarily disable the cron job:

```sql
-- Disable the cron job
SELECT cron.unschedule('subscription-renewal-daily');

-- Re-enable it later
SELECT cron.schedule(
  'subscription-renewal-daily',
  '0 2 * * *',
  'SELECT trigger_subscription_renewal();'
);
```

## Manual Execution

You can manually trigger the renewal process at any time:

### Option 1: Call Database Function
```sql
SELECT trigger_subscription_renewal();
```

### Option 2: Call Edge Function Directly
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  "https://wjliqsmzsyfmiohwfonc.supabase.co/functions/v1/subscription-renewal"
```

## Security Notes

- The Edge Function requires a valid `x-cron-secret` header if `CRON_SECRET` is set
- The database function uses `SECURITY DEFINER` to run with elevated privileges
- All operations are logged in `usage_logs` for audit trail
- RLS policies are respected for user-facing queries

## Related Files

- Edge Function: `supabase/functions/subscription-renewal/index.ts`
- Migration: `supabase/migrations/20240115_subscription_renewal_cron.sql`
- Documentation: `supabase/functions/subscription-renewal/README.md`

## Requirements Fulfilled

- ✅ **Requirement 1.5**: Automatic subscription renewal
- ✅ **Requirement 11.2**: Renewal reminder notifications (3 days before)
- ✅ **Requirement 11.3**: Subscription expiry handling and downgrade to free tier
