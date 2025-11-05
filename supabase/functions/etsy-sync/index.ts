import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EtsyListing {
  listing_id: number;
  title: string;
  description: string;
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  quantity: number;
  state: string;
  url: string;
  images: Array<{
    listing_image_id: number;
    url_75x75: string;
    url_170x135: string;
    url_570xN: string;
    url_fullxfull: string;
  }>;
}

interface EtsyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
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

    // Get user's Etsy integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from("user_integrations")
      .select("access_token, refresh_token, token_expires_at, settings")
      .eq("user_id", user.id)
      .eq("integration_id", (
        await supabaseClient
          .from("integrations")
          .select("id")
          .eq("name", "Etsy")
          .single()
      ).data?.id)
      .single();

    if (integrationError || !integration) {
      throw new Error("Etsy integration not found");
    }

    let accessToken = integration.access_token;
    const shopId = integration.settings?.shop_id;

    if (!shopId) {
      throw new Error("Shop ID not configured");
    }

    // Check if token is expired and refresh if needed
    if (integration.token_expires_at) {
      const expiresAt = new Date(integration.token_expires_at);
      const now = new Date();
      
      if (expiresAt <= now && integration.refresh_token) {
        // Refresh token
        const refreshResponse = await fetch(
          "https://api.etsy.com/v3/public/oauth/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              client_id: Deno.env.get("ETSY_CLIENT_ID") ?? "",
              refresh_token: integration.refresh_token,
            }),
          }
        );

        if (!refreshResponse.ok) {
          throw new Error("Failed to refresh Etsy token");
        }

        const tokenData: EtsyTokenResponse = await refreshResponse.json();
        accessToken = tokenData.access_token;

        // Update stored token
        await supabaseClient
          .from("user_integrations")
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: new Date(
              Date.now() + tokenData.expires_in * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("integration_id", (
            await supabaseClient
              .from("integrations")
              .select("id")
              .eq("name", "Etsy")
              .single()
          ).data?.id);
      }
    }

    const baseUrl = "https://api.etsy.com/v3/application";

    // Handle different operations
    switch (operation) {
      case "import_listings": {
        const listings: EtsyListing[] = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        // Fetch all listings with pagination
        while (hasMore) {
          const response = await fetch(
            `${baseUrl}/shops/${shopId}/listings/active?limit=${limit}&offset=${offset}`,
            {
              headers: {
                "x-api-key": Deno.env.get("ETSY_CLIENT_ID") ?? "",
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Etsy API error: ${response.statusText}`);
          }

          const responseData = await response.json();
          listings.push(...responseData.results);

          // Check if there are more results
          hasMore = responseData.results.length === limit;
          offset += limit;
        }

        // Fetch images for each listing
        const listingsWithImages = await Promise.all(
          listings.map(async (listing) => {
            const imagesResponse = await fetch(
              `${baseUrl}/listings/${listing.listing_id}/images`,
              {
                headers: {
                  "x-api-key": Deno.env.get("ETSY_CLIENT_ID") ?? "",
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (imagesResponse.ok) {
              const imagesData = await imagesResponse.json();
              return { ...listing, images: imagesData.results };
            }

            return { ...listing, images: [] };
          })
        );

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
              .eq("name", "Etsy")
              .single()
          ).data?.id);

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              listings: listingsWithImages.map((l) => ({
                id: l.listing_id.toString(),
                title: l.title,
                description: l.description,
                price: `${l.price.amount / l.price.divisor} ${l.price.currency_code}`,
                images: l.images.map((img) => img.url_fullxfull),
                url: l.url,
              })),
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "get_listings": {
        const response = await fetch(
          `${baseUrl}/shops/${shopId}/listings/active?limit=100`,
          {
            headers: {
              "x-api-key": Deno.env.get("ETSY_CLIENT_ID") ?? "",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Etsy API error: ${response.statusText}`);
        }

        const responseData = await response.json();

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              listings: responseData.results.map((l: EtsyListing) => ({
                id: l.listing_id.toString(),
                title: l.title,
                description: l.description,
                url: l.url,
              })),
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "publish_mockup": {
        const { listingId, mockupUrls } = data;

        if (!listingId || !mockupUrls || !Array.isArray(mockupUrls)) {
          throw new Error("Missing listingId or mockupUrls");
        }

        // Upload images to Etsy listing
        const uploadedImages = [];

        for (const mockupUrl of mockupUrls) {
          // Download the image first
          const imageResponse = await fetch(mockupUrl);
          if (!imageResponse.ok) {
            throw new Error("Failed to download mockup image");
          }

          const imageBlob = await imageResponse.blob();
          const imageBuffer = await imageBlob.arrayBuffer();

          // Create form data for upload
          const formData = new FormData();
          formData.append("image", new Blob([imageBuffer]), "mockup.jpg");

          const uploadResponse = await fetch(
            `${baseUrl}/shops/${shopId}/listings/${listingId}/images`,
            {
              method: "POST",
              headers: {
                "x-api-key": Deno.env.get("ETSY_CLIENT_ID") ?? "",
                Authorization: `Bearer ${accessToken}`,
              },
              body: formData,
            }
          );

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
          }

          const uploadData = await uploadResponse.json();
          uploadedImages.push(uploadData);
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              publishedUrl: `https://www.etsy.com/listing/${listingId}`,
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
    console.error("Etsy sync error:", error);
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
