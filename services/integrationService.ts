import { supabase } from './supabaseClient';
import {
  Integration,
  UserIntegration,
  IntegrationError,
  IntegrationErrorType,
} from '../types';

/**
 * Integration service for managing third-party platform connections
 */
class IntegrationService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  /**
   * Retry a function with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = this.MAX_RETRIES,
    delay: number = this.RETRY_DELAY_MS
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) {
        throw error;
      }

      // Only retry on network errors or rate limit errors
      if (
        this.isIntegrationError(error) &&
        (error.type === IntegrationErrorType.NETWORK_ERROR ||
          error.type === IntegrationErrorType.RATE_LIMIT_EXCEEDED)
      ) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryWithBackoff(fn, retries - 1, delay * 2);
      }

      throw error;
    }
  }

  /**
   * Fetch all available integrations with user connection status
   */
  async getIntegrations(userId: string): Promise<Integration[]> {
    return this.retryWithBackoff(async () => {
      try {
        // Fetch all integrations
        const { data: integrations, error: integrationsError } = await supabase
          .from('integrations')
          .select('*')
          .order('name');

        if (integrationsError) {
          throw this.createError(
            IntegrationErrorType.API_ERROR,
            'Failed to fetch integrations',
            integrationsError.message
          );
        }

        // Fetch user's connected integrations
        const { data: userIntegrations, error: userIntegrationsError } = await supabase
          .from('user_integrations')
          .select('integration_id')
          .eq('user_id', userId);

        if (userIntegrationsError) {
          throw this.createError(
            IntegrationErrorType.API_ERROR,
            'Failed to fetch user integrations',
            userIntegrationsError.message
          );
        }

        // Create a set of connected integration IDs for quick lookup
        const connectedIds = new Set(
          userIntegrations?.map((ui) => ui.integration_id) || []
        );

        // Map integrations with connection status
        return (integrations || []).map((integration) => ({
          id: integration.id,
          name: integration.name,
          description: integration.description,
          category: integration.category,
          logoUrl: integration.logo_url,
          status: integration.status,
          oauthConfig: integration.oauth_config,
          createdAt: integration.created_at,
          updatedAt: integration.updated_at,
          isConnected: connectedIds.has(integration.id),
        }));
      } catch (error) {
        if (this.isIntegrationError(error)) {
          throw error;
        }
        throw this.createError(
          IntegrationErrorType.NETWORK_ERROR,
          'Network error while fetching integrations',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });
  }

  /**
   * Initiate OAuth connection flow
   */
  async connectIntegration(
    userId: string,
    integrationId: string,
    options?: { shopDomain?: string }
  ): Promise<{ authUrl: string; state: string }> {
    try {
      // Get integration name to determine which OAuth function to call
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .select('name, status')
        .eq('id', integrationId)
        .single();

      if (integrationError || !integration) {
        throw this.createError(
          IntegrationErrorType.CONNECTION_FAILED,
          'Integration not found',
          integrationError?.message || 'Integration does not exist'
        );
      }

      if (integration.status !== 'active') {
        throw this.createError(
          IntegrationErrorType.CONNECTION_FAILED,
          'Integration not available',
          'This integration is not yet available'
        );
      }

      // Map integration name to OAuth Edge Function
      const platformName = integration.name.toLowerCase().replace(/\s+/g, '-');
      const oauthFunctionName = `${platformName}-oauth`;

      // Get current user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw this.createError(
          IntegrationErrorType.OAUTH_ERROR,
          'Not authenticated',
          'User session not found'
        );
      }

      // Call the OAuth Edge Function to initiate the flow
      const { data, error } = await supabase.functions.invoke(oauthFunctionName, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          action: 'initiate',
          userId,
          integrationId,
          shopDomain: options?.shopDomain, // For Shopify
        },
      });

      if (error) {
        throw this.createError(
          IntegrationErrorType.OAUTH_ERROR,
          'Failed to initiate OAuth flow',
          error.message
        );
      }

      if (!data || !data.authUrl) {
        throw this.createError(
          IntegrationErrorType.OAUTH_ERROR,
          'Invalid OAuth response',
          'No authorization URL received'
        );
      }

      return {
        authUrl: data.authUrl,
        state: data.state || '',
      };
    } catch (error) {
      if (this.isIntegrationError(error)) {
        throw error;
      }
      throw this.createError(
        IntegrationErrorType.OAUTH_ERROR,
        'Failed to initiate OAuth flow',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Handle OAuth callback and store tokens
   * Note: This is now handled by Edge Functions, but kept for backward compatibility
   */
  async handleCallback(
    code: string,
    state: string
  ): Promise<{ success: boolean; redirectUrl: string }> {
    // OAuth callback is now handled by Edge Functions
    // The Edge Function will store the tokens and redirect back to the app
    // This method is kept for backward compatibility but shouldn't be called
    console.warn('handleCallback called - OAuth should be handled by Edge Functions');
    
    return {
      success: true,
      redirectUrl: '/integrations',
    };
  }

  /**
   * Disconnect integration and remove stored tokens
   */
  async disconnectIntegration(
    userId: string,
    integrationId: string
  ): Promise<void> {
    try {
      // Fetch user integration to get access token for revocation
      const { data: userIntegrations, error: fetchError } = await supabase
        .from('user_integrations')
        .select('access_token, integration_id')
        .eq('user_id', userId)
        .eq('integration_id', integrationId);

      if (fetchError) {
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Failed to fetch integration connection',
          fetchError.message
        );
      }

      // Attempt to revoke token with external platform (best effort)
      if (userIntegrations && userIntegrations.length > 0) {
        const userIntegration = userIntegrations[0];
        try {
          await this.revokeToken(userIntegration.access_token, integrationId);
        } catch (revokeError) {
          // Log but don't fail - token revocation is best effort
          console.warn('Failed to revoke token:', revokeError);
        }
      }

      // Delete user integration record
      const { error: deleteError } = await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', userId)
        .eq('integration_id', integrationId);

      if (deleteError) {
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Failed to disconnect integration',
          deleteError.message
        );
      }
    } catch (error) {
      if (this.isIntegrationError(error)) {
        throw error;
      }
      throw this.createError(
        IntegrationErrorType.NETWORK_ERROR,
        'Network error while disconnecting',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Sync data with external platform
   */
  async syncIntegration(
    userId: string,
    integrationId: string,
    operation: string,
    data?: any
  ): Promise<any> {
    try {
      // Get decrypted access token from Edge Function (handles refresh automatically)
      const tokenData = await this.getDecryptedToken(userId, integrationId);

      // Add userId, integrationId, and shop domain to data
      const syncData = {
        ...data,
        userId,
        integrationId,
        ...(tokenData.shopDomain && { shopDomain: tokenData.shopDomain }),
      };

      // Route to platform-specific sync handler
      const result = await this.executePlatformSync(
        integrationId,
        operation,
        tokenData.accessToken,
        syncData
      );

      // Update last synced timestamp
      await supabase
        .from('user_integrations')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('integration_id', integrationId);

      return result;
    } catch (error) {
      if (this.isIntegrationError(error)) {
        throw error;
      }
      throw this.createError(
        IntegrationErrorType.SYNC_FAILED,
        'Failed to sync with platform',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // Helper methods

  /**
   * Generate CSRF state token
   */
  private generateStateToken(userId: string, integrationId: string): string {
    const payload = {
      userId,
      integrationId,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7),
    };
    return btoa(JSON.stringify(payload));
  }

  /**
   * Validate and decode state token
   */
  private validateStateToken(state: string): { userId: string; integrationId: string } {
    try {
      const payload = JSON.parse(atob(state));
      
      // Check if token is not too old (5 minutes)
      const age = Date.now() - payload.timestamp;
      if (age > 5 * 60 * 1000) {
        throw new Error('State token expired');
      }

      return {
        userId: payload.userId,
        integrationId: payload.integrationId,
      };
    } catch (error) {
      throw this.createError(
        IntegrationErrorType.OAUTH_ERROR,
        'Invalid state token',
        'CSRF validation failed'
      );
    }
  }

  /**
   * Build OAuth authorization URL
   */
  private buildAuthUrl(oauthConfig: any, state: string): string {
    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
      response_type: 'code',
      state,
      scope: oauthConfig.scope || '',
    });

    return `${oauthConfig.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    oauthConfig: any
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: string }> {
    try {
      const response = await fetch(oauthConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret,
          code,
          redirect_uri: oauthConfig.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();

      const expiresAt = data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : undefined;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      };
    } catch (error) {
      throw this.createError(
        IntegrationErrorType.OAUTH_ERROR,
        'Failed to exchange authorization code',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(expiresAt?: string): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
  }

  /**
   * Refresh expired access token
   */
  private async refreshToken(
    userId: string,
    integrationId: string,
    refreshToken?: string
  ): Promise<void> {
    if (!refreshToken) {
      throw this.createError(
        IntegrationErrorType.TOKEN_EXPIRED,
        'Token expired and no refresh token available',
        'Please reconnect this integration'
      );
    }

    try {
      // Fetch OAuth config
      const { data: integration } = await supabase
        .from('integrations')
        .select('oauth_config')
        .eq('id', integrationId)
        .single();

      if (!integration?.oauth_config) {
        throw new Error('OAuth config not found');
      }

      const oauthConfig = integration.oauth_config;

      // Request new access token
      const response = await fetch(oauthConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();

      const expiresAt = data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : undefined;

      // Update tokens in database
      await supabase
        .from('user_integrations')
        .update({
          access_token: data.access_token,
          refresh_token: data.refresh_token || refreshToken,
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('integration_id', integrationId);
    } catch (error) {
      throw this.createError(
        IntegrationErrorType.TOKEN_EXPIRED,
        'Failed to refresh token',
        'Please reconnect this integration'
      );
    }
  }

  /**
   * Revoke access token with external platform
   */
  private async revokeToken(accessToken: string, integrationId: string): Promise<void> {
    // Fetch OAuth config for revocation endpoint
    const { data: integration } = await supabase
      .from('integrations')
      .select('oauth_config')
      .eq('id', integrationId)
      .single();

    if (!integration?.oauth_config?.revokeUrl) {
      // Platform doesn't support token revocation
      return;
    }

    const oauthConfig = integration.oauth_config;

    await fetch(oauthConfig.revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: accessToken,
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
      }),
    });
  }

  /**
   * Execute platform-specific sync operation
   */
  private async executePlatformSync(
    integrationId: string,
    operation: string,
    accessToken: string,
    data?: any
  ): Promise<any> {
    // Fetch integration name to route to correct handler
    const { data: integration } = await supabase
      .from('integrations')
      .select('name')
      .eq('id', integrationId)
      .single();

    if (!integration) {
      throw this.createError(
        IntegrationErrorType.API_ERROR,
        'Integration not found',
        'Integration does not exist'
      );
    }

    // Route to platform-specific handler
    const platformName = integration.name.toLowerCase();

    switch (platformName) {
      case 'shopify':
        return this.handleShopifySync(operation, accessToken, data);
      case 'figma':
        return this.handleFigmaSync(operation, accessToken, data);
      case 'canva':
        return this.handleCanvaSync(operation, accessToken, data);
      case 'google drive':
        return this.handleGoogleDriveSync(operation, accessToken, data);
      case 'dropbox':
        return this.handleDropboxSync(operation, accessToken, data);
      default:
        throw this.createError(
          IntegrationErrorType.SYNC_FAILED,
          'Platform not supported',
          `Sync operations for ${platformName} are not yet implemented`
        );
    }
  }

  /**
   * Handle Shopify-specific sync operations
   */
  private async handleShopifySync(
    operation: string,
    accessToken: string,
    data?: any
  ): Promise<any> {
    switch (operation) {
      case 'sync_products':
      case 'import_products':
        return this.shopifyImportProducts(accessToken, data);
      case 'publish_mockup':
        return this.shopifyPublishMockup(accessToken, data);
      default:
        throw this.createError(
          IntegrationErrorType.SYNC_FAILED,
          'Unknown Shopify operation',
          `Operation ${operation} is not supported`
        );
    }
  }

  /**
   * Import products from Shopify via Edge Function (to avoid CORS)
   */
  private async shopifyImportProducts(
    accessToken: string,
    data?: any
  ): Promise<any> {
    return this.retryWithBackoff(async () => {
      try {
        const { userId, integrationId } = data;

        if (!userId || !integrationId) {
          throw this.createError(
            IntegrationErrorType.API_ERROR,
            'Missing required parameters',
            'User ID and integration ID are required'
          );
        }

        // Get current user session for authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw this.createError(
            IntegrationErrorType.OAUTH_ERROR,
            'Not authenticated',
            'User session not found'
          );
        }

        // Call Edge Function to sync products (avoids CORS issues)
        const { data: result, error } = await supabase.functions.invoke('shopify-oauth', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            action: 'sync_products',
            userId,
            integrationId,
          },
        });

        if (error) {
          throw this.createError(
            IntegrationErrorType.SYNC_FAILED,
            'Failed to sync Shopify products',
            error.message,
            'Shopify'
          );
        }

        if (!result || !result.success) {
          throw this.createError(
            IntegrationErrorType.SYNC_FAILED,
            'Shopify sync failed',
            'No products were imported',
            'Shopify'
          );
        }

        return {
          success: true,
          productsImported: result.productsImported,
          products: result.products,
        };
      } catch (error) {
        if (this.isIntegrationError(error)) {
          throw error;
        }
        
        throw this.createError(
          IntegrationErrorType.SYNC_FAILED,
          'Failed to import Shopify products',
          error instanceof Error ? error.message : 'Unknown error',
          'Shopify'
        );
      }
    });
  }



  /**
   * Convert Blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Strip HTML tags from string
   */
  private stripHtml(html: string): string {
    // Use regex for Node.js environment (tests)
    if (typeof document === 'undefined') {
      return html.replace(/<[^>]*>/g, '').trim();
    }
    // Use DOM for browser environment
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  /**
   * Publish mockup to Shopify product
   */
  private async shopifyPublishMockup(
    accessToken: string,
    data?: any
  ): Promise<any> {
    try {
      const { shopDomain, productId, mockupUrls } = data;

      if (!shopDomain || !productId || !mockupUrls || mockupUrls.length === 0) {
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Missing required parameters',
          'Shop domain, product ID, and mockup URLs are required'
        );
      }

      const uploadedImages = [];

      // Upload each mockup image to Shopify
      for (const mockupUrl of mockupUrls) {
        try {
          // Fetch the mockup image
          const imageResponse = await fetch(mockupUrl);
          if (!imageResponse.ok) {
            console.warn(`Failed to fetch mockup from ${mockupUrl}`);
            continue;
          }

          const imageBlob = await imageResponse.blob();
          const base64 = await this.blobToBase64(imageBlob);

          // Extract base64 data without the data URL prefix
          const base64Data = base64.split(',')[1];

          // Upload image to Shopify product
          const uploadResponse = await fetch(
            `https://${shopDomain}/admin/api/2024-01/products/${productId}/images.json`,
            {
              method: 'POST',
              headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                image: {
                  attachment: base64Data,
                  filename: `mockup-${Date.now()}.png`,
                },
              }),
            }
          );

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.warn(
              `Failed to upload image to Shopify: ${uploadResponse.status} ${errorText}`
            );
            continue;
          }

          const uploadData = await uploadResponse.json();
          uploadedImages.push(uploadData.image);
        } catch (error) {
          console.warn(`Error uploading mockup:`, error);
          continue;
        }
      }

      if (uploadedImages.length === 0) {
        throw this.createError(
          IntegrationErrorType.SYNC_FAILED,
          'Failed to upload any mockups',
          'All mockup uploads failed',
          'Shopify'
        );
      }

      // Construct product URL
      const productUrl = `https://${shopDomain}/admin/products/${productId}`;

      return {
        success: true,
        productUrl,
        imagesAdded: uploadedImages.length,
      };
    } catch (error) {
      if (this.isIntegrationError(error)) {
        throw error;
      }
      throw this.createError(
        IntegrationErrorType.SYNC_FAILED,
        'Failed to publish mockup to Shopify',
        error instanceof Error ? error.message : 'Unknown error',
        'Shopify'
      );
    }
  }

  /**
   * Handle Figma-specific sync operations
   */
  private async handleFigmaSync(
    operation: string,
    accessToken: string,
    data?: any
  ): Promise<any> {
    switch (operation) {
      case 'browse_files':
        return this.figmaBrowseFiles(accessToken);
      case 'import_design':
        return this.figmaImportDesign(accessToken, data);
      default:
        throw this.createError(
          IntegrationErrorType.SYNC_FAILED,
          'Unknown Figma operation',
          `Operation ${operation} is not supported`
        );
    }
  }

  /**
   * Browse Figma files and projects
   */
  private async figmaBrowseFiles(accessToken: string): Promise<any> {
    return this.retryWithBackoff(async () => {
      try {
        // Fetch user's Figma files
        const response = await fetch('https://api.figma.com/v1/me/files', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // Handle rate limiting
          if (response.status === 429) {
            throw this.createError(
              IntegrationErrorType.RATE_LIMIT_EXCEEDED,
              'Figma rate limit exceeded',
              errorText,
              'Figma'
            );
          }
          
          // Handle authentication errors
          if (response.status === 401 || response.status === 403) {
            throw this.createError(
              IntegrationErrorType.INVALID_CREDENTIALS,
              'Invalid Figma credentials',
              errorText,
              'Figma'
            );
          }
          
          throw this.createError(
            IntegrationErrorType.API_ERROR,
            'Failed to fetch files from Figma',
            `${response.status}: ${errorText}`,
            'Figma'
          );
        }

        const responseData = await response.json();
        const files = responseData.files || [];

      // Format file list with thumbnails
      const formattedFiles = files.map((file: any) => ({
        key: file.key,
        name: file.name,
        thumbnail_url: file.thumbnail_url || '',
        last_modified: file.last_modified,
      }));

        return {
          success: true,
          files: formattedFiles,
        };
      } catch (error) {
        if (this.isIntegrationError(error)) {
          throw error;
        }
        
        // Check for network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw this.createError(
            IntegrationErrorType.NETWORK_ERROR,
            'Network error while browsing Figma files',
            error.message,
            'Figma'
          );
        }
        
        throw this.createError(
          IntegrationErrorType.SYNC_FAILED,
          'Failed to browse Figma files',
          error instanceof Error ? error.message : 'Unknown error',
          'Figma'
        );
      }
    });
  }

  /**
   * Import design from Figma file
   */
  private async figmaImportDesign(accessToken: string, data?: any): Promise<any> {
    try {
      const { fileKey, nodeId } = data;

      if (!fileKey) {
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Missing required parameters',
          'File key is required'
        );
      }

      // Build export URL - if nodeId is provided, export specific node, otherwise export entire file
      const exportUrl = nodeId
        ? `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=png&scale=2`
        : `https://api.figma.com/v1/images/${fileKey}?format=png&scale=2`;

      // Request image export from Figma
      const exportResponse = await fetch(exportUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!exportResponse.ok) {
        const errorText = await exportResponse.text();
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Failed to export design from Figma',
          `${exportResponse.status}: ${errorText}`,
          'Figma'
        );
      }

      const exportData = await exportResponse.json();

      if (exportData.err) {
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Figma export error',
          exportData.err,
          'Figma'
        );
      }

      // Get the image URL from the response
      const imageUrl = nodeId
        ? exportData.images[nodeId]
        : Object.values(exportData.images)[0] as string;

      if (!imageUrl) {
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'No image URL in export response',
          'Figma did not return an image URL',
          'Figma'
        );
      }

      // Fetch the exported image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Failed to fetch exported image',
          `${imageResponse.status}: ${imageResponse.statusText}`,
          'Figma'
        );
      }

      const imageBlob = await imageResponse.blob();
      const base64 = await this.blobToBase64(imageBlob);

      // Get file name from Figma API
      const fileResponse = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      let fileName = 'figma-design';
      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        fileName = fileData.name || fileName;
      }

      // Convert to UploadedImage format
      const uploadedImage = {
        base64,
        name: `${fileName}-${Date.now()}`,
        type: imageBlob.type,
        previewUrl: imageUrl,
      };

      return {
        success: true,
        uploadedImage,
      };
    } catch (error) {
      if (this.isIntegrationError(error)) {
        throw error;
      }
      throw this.createError(
        IntegrationErrorType.SYNC_FAILED,
        'Failed to import design from Figma',
        error instanceof Error ? error.message : 'Unknown error',
        'Figma'
      );
    }
  }

  /**
   * Handle Canva-specific sync operations
   */
  private async handleCanvaSync(
    operation: string,
    accessToken: string,
    data?: any
  ): Promise<any> {
    switch (operation) {
      case 'browse_designs':
        return this.canvaBrowseDesigns(accessToken);
      case 'import_design':
        return this.canvaImportDesign(accessToken, data);
      case 'export_mockup':
        return this.canvaExportMockup(accessToken, data);
      default:
        throw this.createError(
          IntegrationErrorType.SYNC_FAILED,
          'Unknown Canva operation',
          `Operation ${operation} is not supported`
        );
    }
  }

  /**
   * Browse Canva designs
   */
  private async canvaBrowseDesigns(accessToken: string): Promise<any> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await fetch('https://api.canva.com/rest/v1/designs', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          if (response.status === 429) {
            throw this.createError(
              IntegrationErrorType.RATE_LIMIT_EXCEEDED,
              'Canva rate limit exceeded',
              errorText,
              'Canva'
            );
          }
          
          if (response.status === 401 || response.status === 403) {
            throw this.createError(
              IntegrationErrorType.INVALID_CREDENTIALS,
              'Invalid Canva credentials',
              errorText,
              'Canva'
            );
          }
          
          throw this.createError(
            IntegrationErrorType.API_ERROR,
            'Failed to fetch designs from Canva',
            `${response.status}: ${errorText}`,
            'Canva'
          );
        }

        const responseData = await response.json();
        const designs = responseData.items || [];

        return {
          success: true,
          designs: designs.map((design: any) => ({
            id: design.id,
            title: design.title,
            thumbnail: design.thumbnail?.url || '',
            created_at: design.created_at,
          })),
        };
      } catch (error) {
        if (this.isIntegrationError(error)) {
          throw error;
        }
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw this.createError(
            IntegrationErrorType.NETWORK_ERROR,
            'Network error while browsing Canva designs',
            error.message,
            'Canva'
          );
        }
        
        throw this.createError(
          IntegrationErrorType.SYNC_FAILED,
          'Failed to browse Canva designs',
          error instanceof Error ? error.message : 'Unknown error',
          'Canva'
        );
      }
    });
  }

  /**
   * Import design from Canva
   */
  private async canvaImportDesign(accessToken: string, data?: any): Promise<any> {
    try {
      const { designId } = data;

      if (!designId) {
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Missing required parameters',
          'Design ID is required'
        );
      }

      // Export design as PNG
      const exportResponse = await fetch(
        `https://api.canva.com/rest/v1/designs/${designId}/export`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format: 'png',
          }),
        }
      );

      if (!exportResponse.ok) {
        const errorText = await exportResponse.text();
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Failed to export design from Canva',
          `${exportResponse.status}: ${errorText}`,
          'Canva'
        );
      }

      const exportData = await exportResponse.json();
      const imageUrl = exportData.url;

      if (!imageUrl) {
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'No image URL in export response',
          'Canva did not return an image URL',
          'Canva'
        );
      }

      // Fetch the exported image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Failed to fetch exported image',
          `${imageResponse.status}: ${imageResponse.statusText}`,
          'Canva'
        );
      }

      const imageBlob = await imageResponse.blob();
      const base64 = await this.blobToBase64(imageBlob);

      const uploadedImage = {
        base64,
        name: `canva-design-${Date.now()}`,
        type: imageBlob.type,
        previewUrl: imageUrl,
      };

      return {
        success: true,
        uploadedImage,
      };
    } catch (error) {
      if (this.isIntegrationError(error)) {
        throw error;
      }
      throw this.createError(
        IntegrationErrorType.SYNC_FAILED,
        'Failed to import design from Canva',
        error instanceof Error ? error.message : 'Unknown error',
        'Canva'
      );
    }
  }

  /**
   * Export mockup to Canva
   */
  private async canvaExportMockup(accessToken: string, data?: any): Promise<any> {
    try {
      const { mockupUrl, title } = data;

      if (!mockupUrl) {
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Missing required parameters',
          'Mockup URL is required'
        );
      }

      // Fetch the mockup image
      const imageResponse = await fetch(mockupUrl);
      if (!imageResponse.ok) {
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Failed to fetch mockup',
          `${imageResponse.status}: ${imageResponse.statusText}`,
          'Canva'
        );
      }

      const imageBlob = await imageResponse.blob();
      const base64 = await this.blobToBase64(imageBlob);

      // Upload to Canva as an asset
      const uploadResponse = await fetch('https://api.canva.com/rest/v1/assets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: title || `mockup-${Date.now()}`,
          type: 'image',
          content: base64.split(',')[1], // Remove data URL prefix
        }),
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Failed to upload mockup to Canva',
          `${uploadResponse.status}: ${errorText}`,
          'Canva'
        );
      }

      const uploadData = await uploadResponse.json();

      return {
        success: true,
        assetId: uploadData.id,
        assetUrl: uploadData.url,
      };
    } catch (error) {
      if (this.isIntegrationError(error)) {
        throw error;
      }
      throw this.createError(
        IntegrationErrorType.SYNC_FAILED,
        'Failed to export mockup to Canva',
        error instanceof Error ? error.message : 'Unknown error',
        'Canva'
      );
    }
  }

  /**
   * Handle Google Drive-specific sync operations
   */
  private async handleGoogleDriveSync(
    operation: string,
    accessToken: string,
    data?: any
  ): Promise<any> {
    switch (operation) {
      case 'list_folders':
        return this.googleDriveListFolders(accessToken);
      case 'upload_mockups':
        return this.googleDriveUploadMockups(accessToken, data);
      default:
        throw this.createError(
          IntegrationErrorType.SYNC_FAILED,
          'Unknown Google Drive operation',
          `Operation ${operation} is not supported`
        );
    }
  }

  /**
   * Get decrypted access token from Edge Function
   */
  private async getDecryptedToken(userId: string, integrationId: string): Promise<{ accessToken: string; shopDomain?: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw this.createError(
        IntegrationErrorType.OAUTH_ERROR,
        'Not authenticated',
        'User session not found'
      );
    }

    // Get integration name to determine which Edge Function to call
    const { data: integration } = await supabase
      .from('integrations')
      .select('name')
      .eq('id', integrationId)
      .single();

    if (!integration) {
      throw this.createError(
        IntegrationErrorType.API_ERROR,
        'Integration not found',
        'Integration does not exist'
      );
    }

    const platformName = integration.name.toLowerCase().replace(/\s+/g, '-');
    const oauthFunctionName = `${platformName}-oauth`;

    const { data, error } = await supabase.functions.invoke(oauthFunctionName, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        action: 'get_token',
        userId,
        integrationId,
      },
    });

    if (error) {
      throw this.createError(
        IntegrationErrorType.OAUTH_ERROR,
        'Failed to get access token',
        error.message
      );
    }

    if (!data || !data.access_token) {
      throw this.createError(
        IntegrationErrorType.OAUTH_ERROR,
        'Invalid token response',
        'No access token received'
      );
    }

    return {
      accessToken: data.access_token,
      shopDomain: data.shop_domain,
    };
  }

  /**
   * List folders in Google Drive
   */
  private async googleDriveListFolders(accessToken: string): Promise<any> {
    return this.retryWithBackoff(async () => {
      try {
        // Query for folders only
        const query = "mimeType='application/vnd.google-apps.folder' and trashed=false";
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&orderBy=name`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          
          // Handle rate limiting
          if (response.status === 429) {
            throw this.createError(
              IntegrationErrorType.RATE_LIMIT_EXCEEDED,
              'Google Drive rate limit exceeded',
              errorText,
              'Google Drive'
            );
          }
          
          // Handle authentication errors
          if (response.status === 401 || response.status === 403) {
            throw this.createError(
              IntegrationErrorType.INVALID_CREDENTIALS,
              'Invalid Google Drive credentials',
              errorText,
              'Google Drive'
            );
          }
          
          throw this.createError(
            IntegrationErrorType.API_ERROR,
            'Failed to list folders from Google Drive',
            `${response.status}: ${errorText}`,
            'Google Drive'
          );
        }

        const responseData = await response.json();
        const folders = responseData.files || [];

        return {
          success: true,
          folders: folders.map((folder: any) => ({
            id: folder.id,
            name: folder.name,
          })),
        };
      } catch (error) {
        if (this.isIntegrationError(error)) {
          throw error;
        }
        
        // Check for network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw this.createError(
            IntegrationErrorType.NETWORK_ERROR,
            'Network error while listing Google Drive folders',
            error.message,
            'Google Drive'
          );
        }
        
        throw this.createError(
          IntegrationErrorType.SYNC_FAILED,
          'Failed to list Google Drive folders',
          error instanceof Error ? error.message : 'Unknown error',
          'Google Drive'
        );
      }
    });
  }

  /**
   * Upload mockups to Google Drive
   */
  private async googleDriveUploadMockups(
    accessToken: string,
    data?: any
  ): Promise<any> {
    try {
      const { mockupUrls, folderId } = data;

      if (!mockupUrls || mockupUrls.length === 0) {
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Missing required parameters',
          'Mockup URLs are required'
        );
      }

      const uploadedFiles = [];

      // Upload each mockup to Google Drive
      for (const mockupUrl of mockupUrls) {
        try {
          // Fetch the mockup image
          const imageResponse = await fetch(mockupUrl);
          if (!imageResponse.ok) {
            console.warn(`Failed to fetch mockup from ${mockupUrl}`);
            continue;
          }

          const imageBlob = await imageResponse.blob();
          
          // Extract filename from URL or generate one
          const urlParts = mockupUrl.split('/');
          const urlFilename = urlParts[urlParts.length - 1].split('?')[0];
          const filename = urlFilename || `mockup-${Date.now()}.png`;

          // Create metadata for the file
          const metadata = {
            name: filename,
            mimeType: imageBlob.type,
            ...(folderId && { parents: [folderId] }),
          };

          // Create form data for multipart upload
          const formData = new FormData();
          formData.append(
            'metadata',
            new Blob([JSON.stringify(metadata)], { type: 'application/json' })
          );
          formData.append('file', imageBlob);

          // Upload to Google Drive
          const uploadResponse = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
              body: formData,
            }
          );

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.warn(
              `Failed to upload to Google Drive: ${uploadResponse.status} ${errorText}`
            );
            continue;
          }

          const uploadData = await uploadResponse.json();
          
          // Construct file link
          const fileLink = `https://drive.google.com/file/d/${uploadData.id}/view`;
          
          uploadedFiles.push({
            id: uploadData.id,
            name: uploadData.name,
            link: fileLink,
            mimeType: uploadData.mimeType,
          });
        } catch (error) {
          console.warn(`Error uploading mockup to Google Drive:`, error);
          continue;
        }
      }

      if (uploadedFiles.length === 0) {
        throw this.createError(
          IntegrationErrorType.SYNC_FAILED,
          'Failed to upload any mockups',
          'All mockup uploads failed',
          'Google Drive'
        );
      }

      return {
        success: true,
        filesUploaded: uploadedFiles.length,
        files: uploadedFiles,
      };
    } catch (error) {
      if (this.isIntegrationError(error)) {
        throw error;
      }
      throw this.createError(
        IntegrationErrorType.SYNC_FAILED,
        'Failed to upload mockups to Google Drive',
        error instanceof Error ? error.message : 'Unknown error',
        'Google Drive'
      );
    }
  }

  /**
   * Handle Dropbox-specific sync operations
   */
  private async handleDropboxSync(
    operation: string,
    accessToken: string,
    data?: any
  ): Promise<any> {
    switch (operation) {
      case 'upload_mockups':
        return this.dropboxUploadMockups(accessToken, data);
      default:
        throw this.createError(
          IntegrationErrorType.SYNC_FAILED,
          'Unknown Dropbox operation',
          `Operation ${operation} is not supported`
        );
    }
  }

  /**
   * Upload mockups to Dropbox
   */
  private async dropboxUploadMockups(
    accessToken: string,
    data?: any
  ): Promise<any> {
    try {
      const { mockupUrls, folderPath } = data;

      if (!mockupUrls || mockupUrls.length === 0) {
        throw this.createError(
          IntegrationErrorType.API_ERROR,
          'Missing required parameters',
          'Mockup URLs are required'
        );
      }

      const uploadedFiles = [];

      // Upload each mockup to Dropbox
      for (const mockupUrl of mockupUrls) {
        try {
          // Fetch the mockup image
          const imageResponse = await fetch(mockupUrl);
          if (!imageResponse.ok) {
            console.warn(`Failed to fetch mockup from ${mockupUrl}`);
            continue;
          }

          const imageBlob = await imageResponse.blob();
          
          // Extract filename from URL or generate one
          const urlParts = mockupUrl.split('/');
          const urlFilename = urlParts[urlParts.length - 1].split('?')[0];
          const filename = urlFilename || `mockup-${Date.now()}.png`;

          // Construct the full path in Dropbox
          const dropboxPath = folderPath 
            ? `${folderPath}/${filename}` 
            : `/${filename}`;

          // Upload to Dropbox using the upload API
          const uploadResponse = await fetch(
            'https://content.dropboxapi.com/2/files/upload',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/octet-stream',
                'Dropbox-API-Arg': JSON.stringify({
                  path: dropboxPath,
                  mode: 'add',
                  autorename: true,
                  mute: false,
                }),
              },
              body: imageBlob,
            }
          );

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.warn(
              `Failed to upload to Dropbox: ${uploadResponse.status} ${errorText}`
            );
            continue;
          }

          const uploadData = await uploadResponse.json();

          // Create a shared link for the file
          let fileLink = '';
          try {
            const shareLinkResponse = await fetch(
              'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  path: uploadData.path_display,
                  settings: {
                    requested_visibility: 'public',
                  },
                }),
              }
            );

            if (shareLinkResponse.ok) {
              const shareLinkData = await shareLinkResponse.json();
              fileLink = shareLinkData.url;
            } else {
              // If shared link creation fails, use the path as fallback
              fileLink = `https://www.dropbox.com/home${uploadData.path_display}`;
            }
          } catch (linkError) {
            console.warn('Failed to create shared link:', linkError);
            fileLink = `https://www.dropbox.com/home${uploadData.path_display}`;
          }

          uploadedFiles.push({
            id: uploadData.id,
            name: uploadData.name,
            path: uploadData.path_display,
            link: fileLink,
          });
        } catch (error) {
          console.warn(`Error uploading mockup to Dropbox:`, error);
          continue;
        }
      }

      if (uploadedFiles.length === 0) {
        throw this.createError(
          IntegrationErrorType.SYNC_FAILED,
          'Failed to upload any mockups',
          'All mockup uploads failed',
          'Dropbox'
        );
      }

      return {
        success: true,
        filesUploaded: uploadedFiles.length,
        files: uploadedFiles,
      };
    } catch (error) {
      if (this.isIntegrationError(error)) {
        throw error;
      }
      throw this.createError(
        IntegrationErrorType.SYNC_FAILED,
        'Failed to upload mockups to Dropbox',
        error instanceof Error ? error.message : 'Unknown error',
        'Dropbox'
      );
    }
  }

  /**
   * Create a standardized integration error
   */
  private createError(
    type: IntegrationErrorType,
    message: string,
    details: string,
    platform?: string
  ): IntegrationError {
    const errorMessages: Record<IntegrationErrorType, string> = {
      CONNECTION_FAILED: 'Failed to connect to {platform}. Please try again.',
      OAUTH_ERROR: 'Authorization failed. Please check your permissions and try again.',
      TOKEN_EXPIRED: 'Your connection to {platform} has expired. Please reconnect.',
      API_ERROR: 'An error occurred while communicating with {platform}.',
      SYNC_FAILED: 'Failed to sync data with {platform}. Please try again later.',
      INVALID_CREDENTIALS: 'Invalid credentials for {platform}. Please reconnect.',
      RATE_LIMIT_EXCEEDED: 'Too many requests to {platform}. Please wait and try again.',
      NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    };

    const userMessage = errorMessages[type].replace('{platform}', platform || 'the platform');

    return {
      type,
      message: `${message}: ${details}`,
      userMessage,
      retryable: [
        IntegrationErrorType.NETWORK_ERROR,
        IntegrationErrorType.RATE_LIMIT_EXCEEDED,
        IntegrationErrorType.API_ERROR,
      ].includes(type),
      platform,
    };
  }

  /**
   * Type guard for IntegrationError
   */
  private isIntegrationError(error: any): error is IntegrationError {
    return error && typeof error === 'object' && 'type' in error && 'userMessage' in error;
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();
