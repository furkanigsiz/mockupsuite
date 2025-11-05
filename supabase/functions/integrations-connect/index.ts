/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConnectRequest {
  integrationId: string;
}

// OAuth configuration for different platforms
const oauthConfigs: Record<string, any> = {
  shopify: {
    authUrl: 'https://accounts.shopify.com/oauth/authorize',
    scopes: ['read_products', 'write_products'],
  },
  figma: {
    authUrl: 'https://www.figma.com/oauth',
    scopes: ['file:read', 'file_export'],
  },
  'google-drive': {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  },
  dropbox: {
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
    scopes: ['files.content.write'],
  },
};

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

    const requestData: ConnectRequest = await req.json();

    // Fetch integration details
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', requestData.integrationId)
      .single();

    if (integrationError || !integration) {
      throw new Error('Integration not found');
    }

    if (integration.status !== 'active') {
      throw new Error('Integration is not available');
    }

    // Get OAuth config from integration or use default
    const oauthConfig = integration.oauth_config || oauthConfigs[integration.name.toLowerCase()];
    
    if (!oauthConfig) {
      throw new Error('OAuth configuration not found for this integration');
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomUUID();

    // Store state in a temporary session table for validation
    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert({
        state,
        user_id: user.id,
        integration_id: integration.id,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      });

    if (stateError) {
      throw new Error(`Failed to store OAuth state: ${stateError.message}`);
    }

    // Get client ID from environment
    const clientIdKey = `${integration.name.toUpperCase().replace('-', '_')}_CLIENT_ID`;
    const clientId = Deno.env.get(clientIdKey);

    if (!clientId) {
      throw new Error(`OAuth client ID not configured for ${integration.name}`);
    }

    // Get callback URL from environment or construct it
    const callbackUrl = Deno.env.get('OAUTH_CALLBACK_URL') || 
                       `${req.headers.get('origin')}/api/integrations/callback`;

    // Build authorization URL
    const authUrl = new URL(oauthConfig.authUrl);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_type', 'code');
    
    if (oauthConfig.scopes) {
      authUrl.searchParams.set('scope', oauthConfig.scopes.join(' '));
    }

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
  } catch (error) {
    console.error('Integration connect error:', error);
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
