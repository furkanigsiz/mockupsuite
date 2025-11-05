/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Encrypt token using Web Crypto API
async function encryptToken(token: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const keyData = encoder.encode(key.padEnd(32, '0').substring(0, 32));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

// Decrypt token using Web Crypto API
async function decryptToken(encryptedToken: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key.padEnd(32, '0').substring(0, 32));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  // Decode base64
  const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    
    // Check if this is an initiate request (POST) or callback (GET)
    if (req.method === 'POST') {
      // Handle OAuth initiation - requires authentication
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing authorization header');
      }

      // Verify JWT token
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        throw new Error('Invalid or expired token');
      }

      const { action, userId, integrationId, operation } = await req.json();
      
      // Handle different actions
      if (action === 'get_token') {
        // Get decrypted access token for API calls
        if (!userId || !integrationId) {
          throw new Error('Missing userId or integrationId');
        }

        if (userId !== user.id) {
          throw new Error('User ID mismatch');
        }

        // Get user integration
        const { data: userIntegration, error: fetchError } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', userId)
          .eq('integration_id', integrationId)
          .single();

        if (fetchError || !userIntegration) {
          throw new Error('Integration not connected');
        }

        // Check if token is expired
        const isExpired = userIntegration.token_expires_at && 
          new Date(userIntegration.token_expires_at) <= new Date();

        if (isExpired && userIntegration.refresh_token) {
          // Refresh the token
          const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-encryption-key';
          const refreshToken = await decryptToken(userIntegration.refresh_token, encryptionKey);

          const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
          const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

          if (!clientId || !clientSecret) {
            throw new Error('Google OAuth credentials not configured');
          }

          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: refreshToken,
              grant_type: 'refresh_token',
            }).toString(),
          });

          if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            throw new Error(`Token refresh failed: ${errorData}`);
          }

          const tokenData = await tokenResponse.json();

          // Encrypt and store new access token
          const encryptedAccessToken = await encryptToken(tokenData.access_token, encryptionKey);
          const tokenExpiresAt = tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null;

          await supabase
            .from('user_integrations')
            .update({
              access_token: encryptedAccessToken,
              token_expires_at: tokenExpiresAt,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('integration_id', integrationId);

          // Return decrypted token
          return new Response(
            JSON.stringify({
              success: true,
              access_token: tokenData.access_token,
              expires_at: tokenExpiresAt,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Decrypt and return existing token
        const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-encryption-key';
        const accessToken = await decryptToken(userIntegration.access_token, encryptionKey);

        return new Response(
          JSON.stringify({
            success: true,
            access_token: accessToken,
            expires_at: userIntegration.token_expires_at,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      if (action !== 'initiate') {
        throw new Error('Invalid action');
      }

      if (!userId || !integrationId) {
        throw new Error('Missing userId or integrationId');
      }

      // Verify that the userId matches the authenticated user
      if (userId !== user.id) {
        throw new Error('User ID mismatch');
      }

      // Get Google credentials
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');

      if (!clientId || !redirectUri) {
        throw new Error('Google OAuth credentials not configured');
      }

      // Generate CSRF state token
      const state = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

      // Store state in database for validation
      const { error: stateError } = await supabase
        .from('oauth_states')
        .insert({
          state,
          user_id: userId,
          integration_id: integrationId,
          expires_at: expiresAt,
        });

      if (stateError) {
        throw new Error(`Failed to store OAuth state: ${stateError.message}`);
      }

      // Build OAuth authorization URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/drive.file');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      return new Response(
        JSON.stringify({
          success: true,
          authUrl: authUrl.toString(),
          state,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle OAuth callback (GET request)
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter');
    }

    // Get Google credentials
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Validate state parameter (CSRF protection)
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .single();

    if (stateError || !oauthState) {
      throw new Error('Invalid or expired state parameter');
    }

    // Check if state has expired
    if (new Date(oauthState.expires_at) < new Date()) {
      throw new Error('OAuth state has expired');
    }

    // Delete used state
    await supabase
      .from('oauth_states')
      .delete()
      .eq('state', state);

    // Exchange authorization code for access token
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('No access token received from Google');
    }

    // Get integration ID for Google Drive
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('id')
      .ilike('name', '%Google Drive%')
      .single();

    if (integrationError || !integration) {
      throw new Error('Google Drive integration not found');
    }

    // Encrypt tokens before storing
    const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-encryption-key';
    const encryptedAccessToken = await encryptToken(tokenData.access_token, encryptionKey);
    const encryptedRefreshToken = tokenData.refresh_token 
      ? await encryptToken(tokenData.refresh_token, encryptionKey)
      : null;

    // Calculate token expiration
    const tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    // Store tokens in user_integrations table
    const { error: insertError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: oauthState.user_id,
        integration_id: integration.id,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: tokenExpiresAt,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,integration_id',
      });

    if (insertError) {
      throw new Error(`Failed to store integration: ${insertError.message}`);
    }

    // Redirect to React callback handler
    const appOrigin = Deno.env.get('APP_ORIGIN') || 'http://localhost:3000';
    const callbackUrl = `${appOrigin}/integrations/callback?success=true&platform=google-drive`;
    
    return new Response(null, {
      status: 302,
      headers: { 
        'Location': callbackUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Google Drive OAuth error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    const appOrigin = Deno.env.get('APP_ORIGIN') || 'http://localhost:3000';
    const callbackUrl = `${appOrigin}/integrations/callback?error=${encodeURIComponent(errorMessage)}&platform=google-drive`;
    
    return new Response(null, {
      status: 302,
      headers: { 
        'Location': callbackUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
});
