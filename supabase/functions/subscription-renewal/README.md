# Subscription Renewal Edge Function

This Supabase Edge Function handles automated subscription renewal, quota resets, and renewal reminders.

## Features

1. **Quota Reset**: Automatically resets monthly quotas for active subscriptions with auto-renew enabled when their billing period ends
2. **Subscription Downgrade**: Downgrades expired subscriptions without auto-renew to the free tier
3. **Renewal Reminders**: Creates reminder logs for subscriptions expiring within 3 days
4. **Usage Logging**: Logs all actions for audit and analytics purposes

## Setup

### 1. Deploy the Edge Function

```bash
# Deploy the function
supabase functions deploy subscription-renewal

# Set the cron secret for security
supabase secrets set CRON_SECRET=your-secure-random-string
```

### 2. Configure Cron Job

You have two options for scheduling this function:

#### Option A: Supabase Cron (Recommended for Production)

Create a database function and use pg_cron:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION trigger_subscription_renewal()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response TEXT;
BEGIN
  -- Call the Edge Function using http extension
  SELECT content::text INTO response
  FROM http((
    'POST',
    current_setting('app.settings.supabase_url') || '/functions/v1/subscription-renewal',
    ARRAY[
      http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
      http_header('x-cron-secret', current_setting('app.settings.cron_secret'))
    ],
    'application/json',
    '{}'
  )::http_request);
  
  RAISE NOTICE 'Subscription renewal response: %', response;
END;
$$;

-- Schedule the function to run daily at 2 AM UTC
SELECT cron.schedule(
  'subscription-renewal-daily',
  '0 2 * * *',
  'SELECT trigger_subscription_renewal();'
);
```

#### Option B: External Cron Service (Alternative)

Use a service like GitHub Actions, Vercel Cron, or any cron service:

```yaml
# .github/workflows/subscription-renewal.yml
name: Subscription Renewal
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  renewal:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Subscription Renewal
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.SUPABASE_URL }}/functions/v1/subscription-renewal"
```

### 3. Set Required Environment Variables

The function requires these environment variables (automatically available in Supabase Edge Functions):

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin access
- `CRON_SECRET`: Secret for authenticating cron requests (set via `supabase secrets set`)

## Manual Testing

You can manually trigger the function for testing:

```bash
# Using curl
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  "https://YOUR_PROJECT.supabase.co/functions/v1/subscription-renewal"

# Using Supabase CLI
supabase functions invoke subscription-renewal \
  --header "x-cron-secret: YOUR_CRON_SECRET"
```

## Response Format

```json
{
  "success": true,
  "timestamp": "2024-01-15T02:00:00.000Z",
  "results": {
    "quotasReset": 5,
    "subscriptionsDowngraded": 2,
    "remindersCreated": 3,
    "errors": []
  }
}
```

## How It Works

### 1. Quota Reset

- Finds active subscriptions with `auto_renew = true` where `current_period_end < now()`
- Resets `remaining_quota` to the plan's monthly quota
- Updates `current_period_start` and `current_period_end` to the next billing period
- Logs the action in `usage_logs` with action `quota_reset`

### 2. Subscription Downgrade

- Finds active subscriptions with `auto_renew = false` where `current_period_end < now()`
- Changes `plan_id` to `free` and sets quota to 5
- Updates billing period to start from now
- Logs the action in `usage_logs` with action `plan_changed`

### 3. Renewal Reminders

- Finds active paid subscriptions expiring within 3 days
- Checks if a reminder was already sent for the current period
- Creates a log entry in `usage_logs` with action `renewal_reminder`
- Includes days until expiry and auto-renew status in metadata

### 4. Usage Logging

All actions are logged to the `usage_logs` table with:
- `user_id`: The affected user (or system UUID for cron execution logs)
- `action`: Type of action performed
- `resource_type`: Type of resource affected
- `resource_id`: ID of the affected resource
- `metadata`: Additional context (plan details, quotas, dates, etc.)

## Monitoring

Check the function logs:

```bash
# View recent logs
supabase functions logs subscription-renewal

# Follow logs in real-time
supabase functions logs subscription-renewal --follow
```

Query execution history:

```sql
-- View recent cron executions
SELECT *
FROM usage_logs
WHERE action = 'cron_execution'
  AND resource_type = 'system'
ORDER BY created_at DESC
LIMIT 10;

-- View quota resets
SELECT *
FROM usage_logs
WHERE action = 'quota_reset'
ORDER BY created_at DESC;

-- View subscription downgrades
SELECT *
FROM usage_logs
WHERE action = 'plan_changed'
  AND metadata->>'reason' = 'subscription_expired'
ORDER BY created_at DESC;
```

## Security

- The function requires a `CRON_SECRET` header to prevent unauthorized access
- Uses Supabase service role key for database operations
- All database operations respect RLS policies where applicable
- Logs all actions for audit trail

## Troubleshooting

### Function not executing

1. Check if the cron job is scheduled:
```sql
SELECT * FROM cron.job WHERE jobname = 'subscription-renewal-daily';
```

2. Check function logs for errors:
```bash
supabase functions logs subscription-renewal
```

### Quotas not resetting

1. Verify subscription data:
```sql
SELECT id, user_id, plan_id, status, auto_renew, current_period_end, remaining_quota
FROM subscriptions
WHERE status = 'active'
  AND auto_renew = true
  AND current_period_end < NOW();
```

2. Check for errors in usage logs:
```sql
SELECT *
FROM usage_logs
WHERE action = 'cron_execution'
  AND metadata->>'results'->>'errors' != '[]'
ORDER BY created_at DESC;
```

### Reminders not being created

1. Check for subscriptions expiring soon:
```sql
SELECT id, user_id, plan_id, current_period_end
FROM subscriptions
WHERE status = 'active'
  AND plan_id != 'free'
  AND current_period_end BETWEEN NOW() AND NOW() + INTERVAL '3 days';
```

2. Check if reminders were already sent:
```sql
SELECT *
FROM usage_logs
WHERE action = 'renewal_reminder'
ORDER BY created_at DESC;
```

## Related Requirements

- **Requirement 1.5**: Automatic subscription renewal
- **Requirement 11.2**: Renewal reminder notifications (3 days before)
- **Requirement 11.3**: Subscription expiry handling
