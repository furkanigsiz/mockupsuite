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
    
    // Check if this is a POST request (initiate action)
    if (req.method === 'POST') {
      const { action, userId, integrationId } = await req.json();
      
      if (action === 'initiate') {
        // Get Etsy credentials
        const clientId = Deno.env.get('ETSY_CLIENT_ID');
        const redirectUri = Deno.env.get('ETSY_REDIRECT_URI');

        if (!clientId || !redirectUri) {
          throw new Error('Etsy OAuth credentials not configured');
        }

        // Generate state token for CSRF protection
        const state = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store state in database
        await supabase.from('oauth_states').insert({
          state,
          user_id: userId,
          integration_id: integrationId,
          expires_at: expiresAt.toISOString(),
        });

        // Build Etsy OAuth URL
        const scopes = ['listings_r', 'listings_w', 'shops_r'];
        const authUrl = `https://www.etsy.com/oauth/connect?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join('%20')}&state=${state}`;

        return new Response(
          JSON.stringify({
            authUrl,
            state,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Handle OAuth callback (GET request with code and state)
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter');
    }

    // Get Etsy credentials
    const clientId = Deno.env.get('ETSY_CLIENT_ID');
    const clientSecret = Deno.env.get('ETSY_CLIENT_SECRET');
    const redirectUri = Deno.env.get('ETSY_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Etsy OAuth credentials not configured');
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
    const tokenUrl = 'https://api.etsy.com/v3/public/oauth/token';
    
    // Etsy requires Basic Auth with client credentials
    const basicAuth = btoa(`${clientId}:${clientSecret}`);
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('No access token received from Etsy');
    }

    // Get integration ID for Etsy
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('id')
      .eq('name', 'Etsy')
      .single();

    if (integrationError || !integration) {
      throw new Error('Etsy integration not found');
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
    const appOrigin = Deno.env.get('APP_ORIGIN') || url.origin;
    const redirectUrl = `${appOrigin}/integrations/callback?success=true&platform=etsy`;

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
    console.error('Etsy OAuth error:', error);
    
    // Redirect back to app with error
    const url = new URL(req.url);
    const appOrigin = Deno.env.get('APP_ORIGIN') || url.origin;
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    const redirectUrl = `${appOrigin}/integrations/callback?success=false&error=${encodeURIComponent(errorMessage)}`;

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
