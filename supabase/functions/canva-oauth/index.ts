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
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
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
  
  const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    
    if (req.method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        throw new Error('Invalid or expired token');
      }

      const { action, userId, integrationId } = await req.json();
      
      // Handle get_token action
      if (action === 'get_token') {
        if (!userId || !integrationId) {
          throw new Error('Missing userId or integrationId');
        }

        if (userId !== user.id) {
          throw new Error('User ID mismatch');
        }

        const { data: userIntegration, error: fetchError } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', userId)
          .eq('integration_id', integrationId)
          .single();

        if (fetchError || !userIntegration) {
          throw new Error('Integration not connected');
        }

        const isExpired = userIntegration.token_expires_at && 
          new Date(userIntegration.token_expires_at) <= new Date();

        if (isExpired && userIntegration.refresh_token) {
          const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-encryption-key';
          const refreshToken = await decryptToken(userIntegration.refresh_token, encryptionKey);

          const clientId = Deno.env.get('CANVA_CLIENT_ID');
          const clientSecret = Deno.env.get('CANVA_CLIENT_SECRET');

          if (!clientId || !clientSecret) {
            throw new Error('Canva OAuth credentials not configured');
          }

          const tokenResponse = await fetch('https://api.canva.com/rest/v1/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
              client_id: clientId,
              client_secret: clientSecret,
            }).toString(),
          });

          if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            throw new Error(`Token refresh failed: ${errorData}`);
          }

          const tokenData = await tokenResponse.json();

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

          return new Response(
            JSON.stringify({
              success: true,
              access_token: tokenData.access_token,
              expires_at: tokenExpiresAt,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-encryption-key';
        const accessToken = await decryptToken(userIntegration.access_token, encryptionKey);

        return new Response(
          JSON.stringify({
            success: true,
            access_token: accessToken,
            expires_at: userIntegration.token_expires_at,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Handle initiate action
      if (action !== 'initiate') {
        throw new Error('Invalid action');
      }

      if (!userId || !integrationId) {
        throw new Error('Missing userId or integrationId');
      }

      if (userId !== user.id) {
        throw new Error('User ID mismatch');
      }

      const clientId = Deno.env.get('CANVA_CLIENT_ID');
      const redirectUri = Deno.env.get('CANVA_REDIRECT_URI');

      if (!clientId || !redirectUri) {
        throw new Error('Canva OAuth credentials not configured');
      }

      const state = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

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

      const authUrl = new URL('https://www.canva.com/api/oauth/authorize');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'design:content:read design:content:write asset:read asset:write');
      authUrl.searchParams.set('state', state);

      return new Response(
        JSON.stringify({
          success: true,
          authUrl: authUrl.toString(),
          state,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle OAuth callback
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter');
    }

    const clientId = Deno.env.get('CANVA_CLIENT_ID');
    const clientSecret = Deno.env.get('CANVA_CLIENT_SECRET');
    const redirectUri = Deno.env.get('CANVA_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Canva OAuth credentials not configured');
    }

    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .single();

    if (stateError || !oauthState) {
      throw new Error('Invalid or expired state parameter');
    }

    if (new Date(oauthState.expires_at) < new Date()) {
      throw new Error('OAuth state has expired');
    }

    await supabase.from('oauth_states').delete().eq('state', state);

    const tokenResponse = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('No access token received from Canva');
    }

    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('id')
      .ilike('name', '%Canva%')
      .single();

    if (integrationError || !integration) {
      throw new Error('Canva integration not found');
    }

    const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-encryption-key';
    const encryptedAccessToken = await encryptToken(tokenData.access_token, encryptionKey);
    const encryptedRefreshToken = tokenData.refresh_token 
      ? await encryptToken(tokenData.refresh_token, encryptionKey)
      : null;

    const tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

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

    const appOrigin = Deno.env.get('APP_ORIGIN') || 'http://localhost:3000';
    const callbackUrl = `${appOrigin}/integrations/callback?success=true&platform=canva`;
    
    return new Response(null, {
      status: 302,
      headers: { 
        'Location': callbackUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Canva OAuth error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    const appOrigin = Deno.env.get('APP_ORIGIN') || 'http://localhost:3000';
    const callbackUrl = `${appOrigin}/integrations/callback?error=${encodeURIComponent(errorMessage)}&platform=canva`;
    
    return new Response(null, {
      status: 302,
      headers: { 
        'Location': callbackUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
});
