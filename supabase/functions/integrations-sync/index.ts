/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  integrationId: string;
  operation: string;
  data?: any;
}

// Token refresh endpoints
const tokenRefreshEndpoints: Record<string, string> = {
  shopify: 'https://accounts.shopify.com/oauth/token',
  figma: 'https://www.figma.com/api/oauth/token',
  'google-drive': 'https://oauth2.googleapis.com/token',
  dropbox: 'https://api.dropboxapi.com/oauth2/token',
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

// Refresh access token if expired
async function refreshAccessToken(
  supabase: any,
  userIntegration: any,
  integration: any,
  encryptionKey: string
): Promise<string> {
  if (!userIntegration.refresh_token) {
    throw new Error('No refresh token available');
  }

  const platformName = integration.name.toUpperCase().replace('-', '_');
  const clientId = Deno.env.get(`${platformName}_CLIENT_ID`);
  const clientSecret = Deno.env.get(`${platformName}_CLIENT_SECRET`);

  if (!clientId || !clientSecret) {
    throw new Error(`OAuth credentials not configured for ${integration.name}`);
  }

  const refreshToken = await decryptToken(userIntegration.refresh_token, encryptionKey);
  const tokenEndpoint = tokenRefreshEndpoints[integration.name.toLowerCase()];

  if (!tokenEndpoint) {
    throw new Error(`Token refresh not supported for ${integration.name}`);
  }

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const tokenData = await response.json();
  const newAccessToken = tokenData.access_token;

  // Update stored tokens
  const encryptedAccessToken = await encryptToken(newAccessToken, encryptionKey);
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
    .eq('id', userIntegration.id);

  return newAccessToken;
}

// Platform-specific sync handlers
async function handleShopifySync(operation: string, accessToken: string, data: any) {
  const shopDomain = data?.shopDomain;
  if (!shopDomain) {
    throw new Error('Shop domain is required for Shopify operations');
  }

  const baseUrl = `https://${shopDomain}/admin/api/2024-01`;

  if (operation === 'import_products') {
    const response = await fetch(`${baseUrl}/products.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Shopify products');
    }

    const result = await response.json();
    return {
      success: true,
      products: result.products,
      count: result.products.length,
    };
  } else if (operation === 'publish_mockup') {
    const { productId, mockupUrl } = data;
    
    if (!productId || !mockupUrl) {
      throw new Error('Product ID and mockup URL are required');
    }

    const response = await fetch(`${baseUrl}/products/${productId}/images.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: {
          src: mockupUrl,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to upload mockup to Shopify');
    }

    const result = await response.json();
    return {
      success: true,
      image: result.image,
      productUrl: `https://${shopDomain}/admin/products/${productId}`,
    };
  }

  throw new Error(`Unsupported Shopify operation: ${operation}`);
}

async function handleFigmaSync(operation: string, accessToken: string, data: any) {
  if (operation === 'list_files') {
    const response = await fetch('https://api.figma.com/v1/me/files', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Figma files');
    }

    const result = await response.json();
    return {
      success: true,
      files: result.files,
    };
  } else if (operation === 'export_design') {
    const { fileId, nodeId } = data;
    
    if (!fileId) {
      throw new Error('File ID is required');
    }

    const url = nodeId 
      ? `https://api.figma.com/v1/images/${fileId}?ids=${nodeId}&format=png`
      : `https://api.figma.com/v1/images/${fileId}?format=png`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export Figma design');
    }

    const result = await response.json();
    return {
      success: true,
      images: result.images,
    };
  }

  throw new Error(`Unsupported Figma operation: ${operation}`);
}

async function handleCloudStorageSync(
  platform: string,
  operation: string,
  accessToken: string,
  data: any
) {
  if (operation === 'upload_file') {
    const { fileName, fileContent, folder } = data;
    
    if (!fileName || !fileContent) {
      throw new Error('File name and content are required');
    }

    if (platform === 'google-drive') {
      // Upload to Google Drive
      const metadata = {
        name: fileName,
        parents: folder ? [folder] : [],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent]));

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: form,
      });

      if (!response.ok) {
        throw new Error('Failed to upload to Google Drive');
      }

      const result = await response.json();
      return {
        success: true,
        fileId: result.id,
        fileUrl: `https://drive.google.com/file/d/${result.id}/view`,
      };
    } else if (platform === 'dropbox') {
      // Upload to Dropbox
      const path = folder ? `${folder}/${fileName}` : `/${fileName}`;

      const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path,
            mode: 'add',
            autorename: true,
          }),
        },
        body: fileContent,
      });

      if (!response.ok) {
        throw new Error('Failed to upload to Dropbox');
      }

      const result = await response.json();
      return {
        success: true,
        path: result.path_display,
      };
    }
  }

  throw new Error(`Unsupported cloud storage operation: ${operation}`);
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

    const requestData: SyncRequest = await req.json();

    // Get user integration with tokens
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
      throw new Error('Integration not connected');
    }

    const integration = userIntegration.integrations as any;
    const encryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-encryption-key';

    // Check if token is expired and refresh if needed
    let accessToken: string;
    if (userIntegration.token_expires_at && new Date(userIntegration.token_expires_at) < new Date()) {
      accessToken = await refreshAccessToken(supabase, userIntegration, integration, encryptionKey);
    } else {
      accessToken = await decryptToken(userIntegration.access_token, encryptionKey);
    }

    // Route to platform-specific handler
    let result;
    const platformName = integration.name.toLowerCase();

    if (platformName === 'shopify') {
      result = await handleShopifySync(requestData.operation, accessToken, requestData.data);
    } else if (platformName === 'figma') {
      result = await handleFigmaSync(requestData.operation, accessToken, requestData.data);
    } else if (platformName === 'google-drive' || platformName === 'dropbox') {
      result = await handleCloudStorageSync(platformName, requestData.operation, accessToken, requestData.data);
    } else {
      throw new Error(`Unsupported platform: ${integration.name}`);
    }

    // Update last synced timestamp
    await supabase
      .from('user_integrations')
      .update({
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', userIntegration.id);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Integration sync error:', error);
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
