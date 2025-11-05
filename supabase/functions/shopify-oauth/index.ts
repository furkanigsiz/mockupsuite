/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

      const { action, userId, integrationId, shopDomain, operation } = await req.json();
      
      // Handle sync_products action
      if (action === 'sync_products') {
        if (!userId || !integrationId) {
          throw new Error('Missing userId or integrationId');
        }

        if (userId !== user.id) {
          throw new Error('User ID mismatch');
        }

        // Get user integration with decrypted token
        const { data: userIntegration, error: fetchError } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', userId)
          .eq('integration_id', integrationId)
          .single();

        if (fetchError || !userIntegration) {
          throw new Error('Integration not connected');
        }

        const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-encryption-key';
        const accessToken = await decryptToken(userIntegration.access_token, encryptionKey);
        const shop = userIntegration.settings?.shop_domain;

        if (!shop) {
          throw new Error('Shop domain not found');
        }

        // Fetch products from Shopify
        const productsResponse = await fetch(
          `https://${shop}/admin/api/2024-01/products.json`,
          {
            method: 'GET',
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!productsResponse.ok) {
          const errorText = await productsResponse.text();
          throw new Error(`Failed to fetch products: ${productsResponse.status} ${errorText}`);
        }

        const productsData = await productsResponse.json();
        const products = productsData.products || [];

        // Save products to database
        const savedProducts = [];
        for (const product of products) {
          try {
            const productData = {
              user_id: userId,
              shopify_product_id: product.id.toString(),
              title: product.title,
              description: product.body_html || '',
              vendor: product.vendor || '',
              product_type: product.product_type || '',
              handle: product.handle || '',
              images: product.images || [],
              variants: product.variants || [],
              metadata: {
                tags: product.tags || '',
                status: product.status || '',
                created_at: product.created_at,
                updated_at: product.updated_at,
              },
            };

            const { data: savedProduct, error: saveError } = await supabase
              .from('shopify_products')
              .upsert(productData, {
                onConflict: 'user_id,shopify_product_id',
              })
              .select()
              .single();

            if (!saveError && savedProduct) {
              savedProducts.push(savedProduct);
            }
          } catch (error) {
            console.warn(`Failed to save product ${product.title}:`, error);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            productsImported: savedProducts.length,
            products: savedProducts,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
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

        // Shopify tokens don't expire, so just decrypt and return
        const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-encryption-key';
        const accessToken = await decryptToken(userIntegration.access_token, encryptionKey);

        // Get shop domain from settings
        const shopDomain = userIntegration.settings?.shop_domain;

        return new Response(
          JSON.stringify({
            success: true,
            access_token: accessToken,
            shop_domain: shopDomain,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Handle initiate action
      if (action !== 'initiate') {
        throw new Error('Invalid action');
      }

      if (!userId || !integrationId || !shopDomain) {
        throw new Error('Missing userId, integrationId, or shopDomain');
      }

      if (userId !== user.id) {
        throw new Error('User ID mismatch');
      }

      const clientId = Deno.env.get('SHOPIFY_CLIENT_ID');
      const redirectUri = Deno.env.get('SHOPIFY_REDIRECT_URI');

      if (!clientId || !redirectUri) {
        throw new Error('Shopify OAuth credentials not configured');
      }

      const state = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Store state with shop domain
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

      // Store shop domain temporarily in state (we'll use it in callback)
      await supabase
        .from('oauth_states')
        .update({ 
          settings: { shop_domain: shopDomain }
        })
        .eq('state', state);

      // Build Shopify OAuth URL
      const authUrl = new URL(`https://${shopDomain}/admin/oauth/authorize`);
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('scope', 'read_products,write_products');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('state', state);
      
      console.log('Shopify OAuth URL:', authUrl.toString());
      console.log('Redirect URI:', redirectUri);
      console.log('Shop Domain:', shopDomain);

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
    const shop = url.searchParams.get('shop');

    if (!code || !state || !shop) {
      throw new Error('Missing authorization code, state, or shop parameter');
    }

    const clientId = Deno.env.get('SHOPIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SHOPIFY_CLIENT_SECRET');
    const redirectUri = Deno.env.get('SHOPIFY_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Shopify OAuth credentials not configured');
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

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('No access token received from Shopify');
    }

    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('id')
      .ilike('name', '%Shopify%')
      .single();

    if (integrationError || !integration) {
      throw new Error('Shopify integration not found');
    }

    const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-encryption-key';
    const encryptedAccessToken = await encryptToken(tokenData.access_token, encryptionKey);

    // Store with shop domain in settings
    const { error: insertError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: oauthState.user_id,
        integration_id: integration.id,
        access_token: encryptedAccessToken,
        refresh_token: null, // Shopify tokens don't expire
        token_expires_at: null,
        settings: { shop_domain: shop },
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,integration_id',
      });

    if (insertError) {
      throw new Error(`Failed to store integration: ${insertError.message}`);
    }

    const appOrigin = Deno.env.get('APP_ORIGIN') || 'http://localhost:3000';
    const callbackUrl = `${appOrigin}/integrations/callback?success=true&platform=shopify`;
    
    return new Response(null, {
      status: 302,
      headers: { 
        'Location': callbackUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Shopify OAuth error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    const appOrigin = Deno.env.get('APP_ORIGIN') || 'http://localhost:3000';
    const callbackUrl = `${appOrigin}/integrations/callback?error=${encodeURIComponent(errorMessage)}&platform=shopify`;
    
    return new Response(null, {
      status: 302,
      headers: { 
        'Location': callbackUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
});
