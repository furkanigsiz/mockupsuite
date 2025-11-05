import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  images: Array<{
    id: number;
    product_id: number;
    position: number;
    src: string;
    width: number;
    height: number;
  }>;
  variants: Array<{
    id: number;
    product_id: number;
    title: string;
    price: string;
    sku: string;
    inventory_quantity: number;
  }>;
}

interface ShopifyTokenResponse {
  access_token: string;
  expires_in?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { operation, data } = await req.json();

    // Get user's Shopify integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from("user_integrations")
      .select("access_token, refresh_token, token_expires_at, settings")
      .eq("user_id", user.id)
      .eq("integration_id", (
        await supabaseClient
          .from("integrations")
          .select("id")
          .eq("name", "Shopify")
          .single()
      ).data?.id)
      .single();

    if (integrationError || !integration) {
      throw new Error("Shopify integration not found");
    }

    let accessToken = integration.access_token;
    const shopDomain = integration.settings?.shop_domain;

    if (!shopDomain) {
      throw new Error("Shop domain not configured");
    }

    // Check if token is expired and refresh if needed
    if (integration.token_expires_at) {
      const expiresAt = new Date(integration.token_expires_at);
      const now = new Date();
      
      if (expiresAt <= now && integration.refresh_token) {
        // Refresh token
        const refreshResponse = await fetch(
          `https://${shopDomain}/admin/oauth/access_token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              client_id: Deno.env.get("SHOPIFY_CLIENT_ID"),
              client_secret: Deno.env.get("SHOPIFY_CLIENT_SECRET"),
              refresh_token: integration.refresh_token,
            }),
          }
        );

        if (!refreshResponse.ok) {
          throw new Error("Failed to refresh Shopify token");
        }

        const tokenData: ShopifyTokenResponse = await refreshResponse.json();
        accessToken = tokenData.access_token;

        // Update stored token
        await supabaseClient
          .from("user_integrations")
          .update({
            access_token: accessToken,
            token_expires_at: tokenData.expires_in
              ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("integration_id", (
            await supabaseClient
              .from("integrations")
              .select("id")
              .eq("name", "Shopify")
              .single()
          ).data?.id);
      }
    }

    const shopifyApiVersion = "2024-01";
    const baseUrl = `https://${shopDomain}/admin/api/${shopifyApiVersion}`;

    // Handle different operations
    switch (operation) {
      case "import_products": {
        const products: ShopifyProduct[] = [];
        let nextPageUrl: string | null = `${baseUrl}/products.json?limit=250`;

        // Fetch all products with pagination
        while (nextPageUrl) {
          const response = await fetch(nextPageUrl, {
            headers: {
              "X-Shopify-Access-Token": accessToken,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`Shopify API error: ${response.statusText}`);
          }

          const responseData = await response.json();
          products.push(...responseData.products);

          // Check for next page
          const linkHeader = response.headers.get("Link");
          nextPageUrl = null;
          
          if (linkHeader) {
            const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
            if (nextMatch) {
              nextPageUrl = nextMatch[1];
            }
          }
        }

        // Update last sync time
        await supabaseClient
          .from("user_integrations")
          .update({
            last_synced_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("integration_id", (
            await supabaseClient
              .from("integrations")
              .select("id")
              .eq("name", "Shopify")
              .single()
          ).data?.id);

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              products: products.map((p) => ({
                id: p.id.toString(),
                title: p.title,
                description: p.body_html,
                images: p.images.map((img) => img.src),
                variants: p.variants,
              })),
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "get_products": {
        const response = await fetch(`${baseUrl}/products.json?limit=250`, {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Shopify API error: ${response.statusText}`);
        }

        const responseData = await response.json();

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              products: responseData.products.map((p: ShopifyProduct) => ({
                id: p.id.toString(),
                title: p.title,
                description: p.body_html,
                images: p.images.map((img) => img.src),
              })),
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "publish_mockup": {
        const { productId, mockupUrls } = data;

        if (!productId || !mockupUrls || !Array.isArray(mockupUrls)) {
          throw new Error("Missing productId or mockupUrls");
        }

        // Upload images to Shopify product
        const uploadedImages = [];

        for (const mockupUrl of mockupUrls) {
          const imageResponse = await fetch(
            `${baseUrl}/products/${productId}/images.json`,
            {
              method: "POST",
              headers: {
                "X-Shopify-Access-Token": accessToken,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                image: {
                  src: mockupUrl,
                },
              }),
            }
          );

          if (!imageResponse.ok) {
            throw new Error(`Failed to upload image: ${imageResponse.statusText}`);
          }

          const imageData = await imageResponse.json();
          uploadedImages.push(imageData.image);
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              publishedUrl: `https://${shopDomain}/admin/products/${productId}`,
              uploadedImages: uploadedImages.length,
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error("Shopify sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
