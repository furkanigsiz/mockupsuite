import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FigmaFile {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
}

interface FigmaTokenResponse {
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

    // Get user's Figma integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from("user_integrations")
      .select("access_token, refresh_token, token_expires_at")
      .eq("user_id", user.id)
      .eq("integration_id", (
        await supabaseClient
          .from("integrations")
          .select("id")
          .eq("name", "Figma")
          .single()
      ).data?.id)
      .single();

    if (integrationError || !integration) {
      throw new Error("Figma integration not found");
    }

    let accessToken = integration.access_token;

    // Check if token is expired and refresh if needed
    if (integration.token_expires_at) {
      const expiresAt = new Date(integration.token_expires_at);
      const now = new Date();
      
      if (expiresAt <= now && integration.refresh_token) {
        // Refresh token
        const refreshResponse = await fetch(
          "https://www.figma.com/api/oauth/refresh",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: Deno.env.get("FIGMA_CLIENT_ID") ?? "",
              client_secret: Deno.env.get("FIGMA_CLIENT_SECRET") ?? "",
              refresh_token: integration.refresh_token,
            }),
          }
        );

        if (!refreshResponse.ok) {
          throw new Error("Failed to refresh Figma token");
        }

        const tokenData: FigmaTokenResponse = await refreshResponse.json();
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
              .eq("name", "Figma")
              .single()
          ).data?.id);
      }
    }

    const baseUrl = "https://api.figma.com/v1";

    // Handle different operations
    switch (operation) {
      case "list_files": {
        // Get user's Figma files
        const response = await fetch(`${baseUrl}/me/files`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Figma API error: ${response.statusText}`);
        }

        const responseData = await response.json();

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
              .eq("name", "Figma")
              .single()
          ).data?.id);

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              files: responseData.files.map((f: FigmaFile) => ({
                key: f.key,
                name: f.name,
                thumbnail_url: f.thumbnail_url,
                last_modified: f.last_modified,
              })),
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "export_design": {
        const { fileId, nodeId, format = "png", scale = 2 } = data;

        if (!fileId) {
          throw new Error("Missing fileId");
        }

        // Build export URL
        let exportUrl = `${baseUrl}/images/${fileId}?format=${format}&scale=${scale}`;
        
        if (nodeId) {
          exportUrl += `&ids=${nodeId}`;
        }

        // Request image export
        const response = await fetch(exportUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Figma API error: ${response.statusText}`);
        }

        const responseData = await response.json();

        // Get the image URL from the response
        let imageUrl: string | null = null;

        if (nodeId && responseData.images && responseData.images[nodeId]) {
          imageUrl = responseData.images[nodeId];
        } else if (responseData.images) {
          // Get first image if no specific node requested
          const firstKey = Object.keys(responseData.images)[0];
          imageUrl = responseData.images[firstKey];
        }

        if (!imageUrl) {
          throw new Error("No image URL returned from Figma");
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              imageUrl,
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "import_design": {
        const { fileId, nodeId } = data;

        if (!fileId) {
          throw new Error("Missing fileId");
        }

        // First export the design
        let exportUrl = `${baseUrl}/images/${fileId}?format=png&scale=2`;
        
        if (nodeId) {
          exportUrl += `&ids=${nodeId}`;
        }

        const exportResponse = await fetch(exportUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!exportResponse.ok) {
          throw new Error(`Figma API error: ${exportResponse.statusText}`);
        }

        const exportData = await exportResponse.json();

        // Get the image URL
        let imageUrl: string | null = null;

        if (nodeId && exportData.images && exportData.images[nodeId]) {
          imageUrl = exportData.images[nodeId];
        } else if (exportData.images) {
          const firstKey = Object.keys(exportData.images)[0];
          imageUrl = exportData.images[firstKey];
        }

        if (!imageUrl) {
          throw new Error("No image URL returned from Figma");
        }

        // Download the image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error("Failed to download Figma image");
        }

        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();

        // Upload to Supabase Storage
        const fileName = `figma-import-${Date.now()}.png`;
        const filePath = `uploads/${user.id}/${fileName}`;

        const { error: uploadError } = await supabaseClient.storage
          .from("user-files")
          .upload(filePath, imageBuffer, {
            contentType: "image/png",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabaseClient.storage
          .from("user-files")
          .getPublicUrl(filePath);

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              imageUrl: urlData.publicUrl,
              filePath,
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
    console.error("Figma sync error:", error);
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
