/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Query integrations table and join with user_integrations
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select(`
        id,
        name,
        description,
        category,
        logo_url,
        status,
        user_integrations!left(id, user_id)
      `)
      .order('name');

    if (integrationsError) {
      throw new Error(`Failed to fetch integrations: ${integrationsError.message}`);
    }

    // Format response with isConnected flag
    const formattedIntegrations = integrations.map((integration: any) => {
      const userIntegration = integration.user_integrations?.find(
        (ui: any) => ui.user_id === user.id
      );

      return {
        id: integration.id,
        name: integration.name,
        description: integration.description,
        category: integration.category,
        logoUrl: integration.logo_url,
        status: integration.status,
        isConnected: !!userIntegration,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        integrations: formattedIntegrations,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Integrations list error:', error);
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
