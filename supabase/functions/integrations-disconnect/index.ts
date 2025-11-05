/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DisconnectRequest {
  integrationId: string;
}

// Token revocation endpoints for platforms that support it
const revocationEndpoints: Record<string, string> = {
  'google-drive': 'https://oauth2.googleapis.com/revoke',
  dropbox: 'https://api.dropboxapi.com/2/auth/token/revoke',
};

// Decrypt token using Web Crypto API
async function decryptToken(encryptedToken: string, key: string): Promise<string> {
  const decoder = new TextDecoder();
  const keyData = new TextEncoder().encode(key.padEnd(32, '0').substring(0, 32));
  
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
  
  return decoder.decode(decrypted);
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

    const requestData: DisconnectRequest = await req.json();

    // Get user integration details
    const { data: userIntegration, error: integrationError } = await supabase
      .from('user_integrations')
      .select(`
        *,
        integrations (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('integration_id', requestData.integrationId)
      .single();

    if (integrationError || !userIntegration) {
      throw new Error('Integration connection not found');
    }

    const integration = userIntegration.integrations as any;
    const platformName = integration.name.toLowerCase();

    // Attempt to revoke token with external platform if supported
    if (revocationEndpoints[platformName]) {
      try {
        const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-encryption-key';
        const accessToken = await decryptToken(userIntegration.access_token, encryptionKey);

        const revocationEndpoint = revocationEndpoints[platformName];
        
        if (platformName === 'google-drive') {
          // Google uses POST with token parameter
          await fetch(`${revocationEndpoint}?token=${accessToken}`, {
            method: 'POST',
          });
        } else if (platformName === 'dropbox') {
          // Dropbox uses POST with Authorization header
          await fetch(revocationEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
        }
        
        console.log(`Token revoked for ${platformName}`);
      } catch (revocationError) {
        // Log but don't fail - we'll still delete the local record
        console.error(`Failed to revoke token for ${platformName}:`, revocationError);
      }
    }

    // Delete user_integrations record
    const { error: deleteError } = await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('integration_id', requestData.integrationId);

    if (deleteError) {
      throw new Error(`Failed to disconnect integration: ${deleteError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Integration disconnected successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Integration disconnect error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
