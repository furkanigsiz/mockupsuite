# Edge Functions Integration Tests

This directory contains integration tests for the Supabase Edge Functions used in the third-party integrations system.

## Prerequisites

1. **Deno**: Install Deno runtime
   ```bash
   # Windows (PowerShell)
   irm https://deno.land/install.ps1 | iex
   
   # macOS/Linux
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **Supabase CLI**: Install Supabase CLI
   ```bash
   npm install -g supabase
   ```

3. **Local Supabase Instance**: Start local Supabase
   ```bash
   supabase start
   ```

## Test Setup

1. Create a test user in your local Supabase instance:
   ```sql
   -- Run in Supabase SQL Editor
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES (
     'test@example.com',
     crypt('testpassword123', gen_salt('bf')),
     NOW()
   );
   ```

2. Set environment variables:
   ```bash
   # Windows (PowerShell)
   $env:SUPABASE_URL="http://localhost:54321"
   $env:SUPABASE_ANON_KEY="your-anon-key"
   
   # macOS/Linux
   export SUPABASE_URL="http://localhost:54321"
   export SUPABASE_ANON_KEY="your-anon-key"
   ```

## Running Tests

Run all integration tests:
```bash
deno test --allow-net --allow-env supabase/functions/_tests/integrations.test.ts
```

Run specific test:
```bash
deno test --allow-net --allow-env --filter "Integration List" supabase/functions/_tests/integrations.test.ts
```

## Test Coverage

The integration tests cover:

1. **Integration List Endpoint**
   - Fetching available integrations
   - Showing connection status for authenticated users
   - Proper data formatting

2. **Integration Connect Endpoint**
   - OAuth URL generation with state parameter
   - CSRF protection via state storage
   - Rejection of inactive integrations

3. **Integration Callback Endpoint**
   - State validation
   - Token exchange
   - Token encryption and storage
   - Connection status updates

4. **Integration Disconnect Endpoint**
   - Connection removal
   - Token revocation (where supported)
   - Proper cleanup

5. **Security Tests**
   - RLS policies prevent unauthorized access
   - Token encryption in database
   - CSRF protection in OAuth flow

## Deploying Edge Functions

Deploy all integration functions:
```bash
supabase functions deploy integrations-list
supabase functions deploy integrations-connect
supabase functions deploy integrations-callback
supabase functions deploy integrations-disconnect
supabase functions deploy integrations-sync
```

Deploy with environment variables:
```bash
supabase secrets set SHOPIFY_CLIENT_ID=your-client-id
supabase secrets set SHOPIFY_CLIENT_SECRET=your-client-secret
supabase secrets set TOKEN_ENCRYPTION_KEY=your-encryption-key
# ... repeat for other platforms
```

## Notes

- Tests require a running Supabase instance (local or remote)
- Tests create and cleanup test data automatically
- OAuth state records are cleaned up after each test
- RLS policies must be properly configured for tests to pass
