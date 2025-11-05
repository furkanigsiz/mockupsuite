/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token exchange endpoints for different platforms
const tokenEndpoints: Record<string, string> = {
  shopify: 'https://accounts.shopify.com/oauth/token',
  figma: 'https://www.figma.com/api/oauth/token',
  'google-drive': 'https://oauth2.googleapis.com/token',
  dropbox: 'https://api.dropboxapi.com/oauth2/token',
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

    // Get query parameters
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter');
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

    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', oauthState.integration_id)
      .single();

    if (integrationError || !integration) {
      throw new Error('Integration not found');
    }

    // Get OAuth credentials from environment
    const platformName = integration.name.toUpperCase().replace('-', '_');
    const clientId = Deno.env.get(`${platformName}_CLIENT_ID`);
    const clientSecret = Deno.env.get(`${platformName}_CLIENT_SECRET`);

    if (!clientId || !clientSecret) {
      throw new Error(`OAuth credentials not configured for ${integration.name}`);
    }

    // Get callback URL
    const callbackUrl = Deno.env.get('OAUTH_CALLBACK_URL') || 
                       `${url.origin}/api/integrations/callback`;

    // Exchange authorization code for tokens
    const tokenEndpoint = tokenEndpoints[integration.name.toLowerCase()];
    
    if (!tokenEndpoint) {
      throw new Error(`Token endpoint not configured for ${integration.name}`);
    }

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('No access token received from OAuth provider');
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

    // Redirect back to the app with success message
    const redirectUrl = `${url.origin}/integrations?connected=${integration.name}`;

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Integration callback error:', error);
    
    // Redirect back to app with error
    const url = new URL(req.url);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    const redirectUrl = `${url.origin}/integrations?error=${encodeURIComponent(errorMessage)}`;

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        redirectUrl,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
