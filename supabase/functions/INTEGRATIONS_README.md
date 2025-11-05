# Third-Party Integrations Edge Functions

This directory contains Supabase Edge Functions for the third-party integrations system. These functions handle OAuth flows, token management, and platform-specific sync operations.

## Edge Functions

### 1. integrations-list
**Endpoint**: `/functions/v1/integrations-list`

Lists all available integrations with user connection status.

**Request**:
```json
{
  "userId": "string"
}
```

**Response**:
```json
{
  "success": true,
  "integrations": [
    {
      "id": "uuid",
      "name": "Shopify",
      "description": "E-commerce platform",
      "category": "ecommerce",
      "logoUrl": "/logos/shopify.png",
      "status": "active",
      "isConnected": false
    }
  ]
}
```

### 2. integrations-connect
**Endpoint**: `/functions/v1/integrations-connect`

Initiates OAuth flow for connecting to a platform.

**Request**:
```json
{
  "integrationId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "authUrl": "https://oauth.platform.com/authorize?...",
  "state": "csrf-token"
}
```

**Features**:
- Generates OAuth authorization URL
- Creates CSRF protection state token
- Stores state in database for validation

### 3. integrations-callback
**Endpoint**: `/functions/v1/integrations-callback`

Handles OAuth callback and stores tokens.

**Query Parameters**:
- `code`: Authorization code from OAuth provider
- `state`: CSRF protection token

**Response**:
```json
{
  "success": true,
  "redirectUrl": "/integrations?connected=shopify"
}
```

**Features**:
- Validates CSRF state token
- Exchanges authorization code for access/refresh tokens
- Encrypts tokens using AES-GCM
- Stores encrypted tokens in database

### 4. integrations-disconnect
**Endpoint**: `/functions/v1/integrations-disconnect`

Disconnects a user from a platform.

**Request**:
```json
{
  "integrationId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Integration disconnected successfully"
}
```

**Features**:
- Removes user_integrations record
- Revokes access token with platform (if supported)
- Decrypts tokens for revocation

### 5. integrations-sync
**Endpoint**: `/functions/v1/integrations-sync`

Performs platform-specific sync operations.

**Request**:
```json
{
  "integrationId": "uuid",
  "operation": "import_products",
  "data": {
    "shopDomain": "mystore.myshopify.com"
  }
}
```

**Response**:
```json
{
  "success": true,
  "products": [...],
  "count": 50
}
```

**Supported Operations**:

#### Shopify
- `import_products`: Fetch product catalog
- `publish_mockup`: Upload mockup to product

#### Figma
- `list_files`: List user's Figma files
- `export_design`: Export design as image

#### Google Drive / Dropbox
- `upload_file`: Upload file to cloud storage

**Features**:
- Automatic token refresh if expired
- Platform-specific API handlers
- Updates last_synced_at timestamp

## Environment Variables

Required environment variables for each platform:

```bash
# Shopify
SHOPIFY_CLIENT_ID=your-client-id
SHOPIFY_CLIENT_SECRET=your-client-secret

# Figma
FIGMA_CLIENT_ID=your-client-id
FIGMA_CLIENT_SECRET=your-client-secret

# Google Drive
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-project.supabase.co/functions/v1/google-drive-oauth

# Dropbox
DROPBOX_CLIENT_ID=your-client-id
DROPBOX_CLIENT_SECRET=your-client-secret

# Token encryption
TOKEN_ENCRYPTION_KEY=your-32-character-key

# OAuth callback URL
OAUTH_CALLBACK_URL=https://your-domain.com/api/integrations/callback
```

## Security Features

1. **Token Encryption**: All access and refresh tokens are encrypted using AES-GCM before storage
2. **CSRF Protection**: State parameter prevents cross-site request forgery
3. **RLS Policies**: Row-level security ensures users can only access their own integrations
4. **Token Refresh**: Automatic token refresh when expired
5. **Token Revocation**: Proper token revocation on disconnect (where supported)

## Database Tables

### integrations
Stores metadata about available integrations.

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  oauth_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_integrations
Stores user connections to platforms.

```sql
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  integration_id UUID NOT NULL REFERENCES integrations(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, integration_id)
);
```

### oauth_states
Temporary storage for OAuth state tokens.

```sql
CREATE TABLE oauth_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  integration_id UUID NOT NULL REFERENCES integrations(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Deployment

Deploy all functions:
```bash
supabase functions deploy integrations-list
supabase functions deploy integrations-connect
supabase functions deploy integrations-callback
supabase functions deploy integrations-disconnect
supabase functions deploy integrations-sync
```

Set environment secrets:
```bash
# Shopify
supabase secrets set SHOPIFY_CLIENT_ID=xxx
supabase secrets set SHOPIFY_CLIENT_SECRET=xxx
supabase secrets set SHOPIFY_REDIRECT_URI=xxx

# Figma
supabase secrets set FIGMA_CLIENT_ID=xxx
supabase secrets set FIGMA_CLIENT_SECRET=xxx
supabase secrets set FIGMA_REDIRECT_URI=xxx

# Google Drive
supabase secrets set GOOGLE_CLIENT_ID=xxx
supabase secrets set GOOGLE_CLIENT_SECRET=xxx
supabase secrets set GOOGLE_REDIRECT_URI=xxx

# Dropbox
supabase secrets set DROPBOX_CLIENT_ID=xxx
supabase secrets set DROPBOX_CLIENT_SECRET=xxx
supabase secrets set DROPBOX_REDIRECT_URI=xxx

# Token encryption
supabase secrets set TOKEN_ENCRYPTION_KEY=xxx

# App origin for OAuth redirects
supabase secrets set APP_ORIGIN=https://yourdomain.com
```

## Testing

See `_tests/README.md` for integration test documentation.

Run tests:
```bash
deno test --allow-net --allow-env supabase/functions/_tests/integrations.test.ts
```

## Error Handling

All functions return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common error scenarios:
- Missing authorization header (401)
- Invalid authentication token (401)
- Integration not found (400)
- OAuth configuration missing (400)
- Token exchange failed (400)
- API errors from external platforms (400)

## Platform-Specific Notes

### Shopify
- Requires shop domain in sync operations
- Uses X-Shopify-Access-Token header
- API version: 2024-01

### Figma
- Uses Bearer token authentication
- Supports file listing and image export
- Rate limits apply

### Google Drive
- Uses multipart upload for files
- Requires folder ID for organization
- Supports file metadata

### Dropbox
- Uses Dropbox-API-Arg header for metadata
- Supports autorename on conflicts
- Content upload via separate endpoint
