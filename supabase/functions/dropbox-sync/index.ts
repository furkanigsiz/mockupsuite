import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DropboxFolder {
  ".tag": string;
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
}

interface DropboxTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
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

    // Get user's Dropbox integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from("user_integrations")
      .select("access_token, refresh_token, token_expires_at")
      .eq("user_id", user.id)
      .eq("integration_id", (
        await supabaseClient
          .from("integrations")
          .select("id")
          .eq("name", "Dropbox")
          .single()
      ).data?.id)
      .single();

    if (integrationError || !integration) {
      throw new Error("Dropbox integration not found");
    }

    let accessToken = integration.access_token;

    // Check if token is expired and refresh if needed
    if (integration.token_expires_at) {
      const expiresAt = new Date(integration.token_expires_at);
      const now = new Date();
      
      if (expiresAt <= now && integration.refresh_token) {
        // Refresh token
        const refreshResponse = await fetch(
          "https://api.dropbox.com/oauth2/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: integration.refresh_token,
              client_id: Deno.env.get("DROPBOX_CLIENT_ID") ?? "",
              client_secret: Deno.env.get("DROPBOX_CLIENT_SECRET") ?? "",
            }),
          }
        );

        if (!refreshResponse.ok) {
          throw new Error("Failed to refresh Dropbox token");
        }

        const tokenData: DropboxTokenResponse = await refreshResponse.json();
        accessToken = tokenData.access_token;

        // Update stored token
        await supabaseClient
          .from("user_integrations")
          .update({
            access_token: tokenData.access_token,
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
              .eq("name", "Dropbox")
              .single()
          ).data?.id);
      }
    }

    // Handle different operations
    switch (operation) {
      case "list_folders": {
        const { path = "" } = data || {};

        const response = await fetch(
          "https://api.dropboxapi.com/2/files/list_folder",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path: path || "",
              recursive: false,
              include_deleted: false,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Dropbox API error: ${response.statusText}`);
        }

        const responseData = await response.json();

        // Filter only folders
        const folders = responseData.entries.filter(
          (entry: DropboxFolder) => entry[".tag"] === "folder"
        );

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              folders: folders.map((f: DropboxFolder) => ({
                id: f.id,
                name: f.name,
                path: f.path_display,
              })),
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "create_folder": {
        const { folderPath } = data;

        if (!folderPath) {
          throw new Error("Missing folderPath");
        }

        const response = await fetch(
          "https://api.dropboxapi.com/2/files/create_folder_v2",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path: folderPath,
              autorename: false,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to create folder: ${response.statusText}`);
        }

        const responseData = await response.json();

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              folderPath: responseData.metadata.path_display,
              folderId: responseData.metadata.id,
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "upload_file": {
        const { mockupUrls, folderPath } = data;

        if (!mockupUrls || !Array.isArray(mockupUrls)) {
          throw new Error("Missing mockupUrls");
        }

        let targetPath = folderPath || "";

        // Ensure path starts with /
        if (targetPath && !targetPath.startsWith("/")) {
          targetPath = `/${targetPath}`;
        }

        // Create folder if it doesn't exist
        if (targetPath) {
          try {
            await fetch(
              "https://api.dropboxapi.com/2/files/create_folder_v2",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  path: targetPath,
                  autorename: false,
                }),
              }
            );
          } catch (error) {
            // Folder might already exist, continue
          }
        }

        // Upload each mockup
        const uploadedFiles = [];

        for (const mockupUrl of mockupUrls) {
          // Download the mockup
          const imageResponse = await fetch(mockupUrl);
          if (!imageResponse.ok) {
            throw new Error("Failed to download mockup image");
          }

          const imageBlob = await imageResponse.blob();
          const imageBuffer = await imageBlob.arrayBuffer();

          // Extract filename from URL or generate one
          const urlParts = mockupUrl.split("/");
          let fileName = urlParts[urlParts.length - 1] || `mockup-${Date.now()}.png`;
          
          // Remove query parameters from filename
          fileName = fileName.split("?")[0];

          // Construct full path
          const fullPath = targetPath ? `${targetPath}/${fileName}` : `/${fileName}`;

          // Upload to Dropbox
          const uploadResponse = await fetch(
            "https://content.dropboxapi.com/2/files/upload",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/octet-stream",
                "Dropbox-API-Arg": JSON.stringify({
                  path: fullPath,
                  mode: "add",
                  autorename: true,
                  mute: false,
                }),
              },
              body: imageBuffer,
            }
          );

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
          }

          const uploadData = await uploadResponse.json();
          uploadedFiles.push(uploadData);
        }

        // Create shared links for uploaded files
        const fileUrls = [];

        for (const file of uploadedFiles) {
          try {
            const linkResponse = await fetch(
              "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  path: file.path_display,
                  settings: {
                    requested_visibility: "public",
                  },
                }),
              }
            );

            if (linkResponse.ok) {
              const linkData = await linkResponse.json();
              fileUrls.push(linkData.url);
            } else {
              // Fallback to file path if link creation fails
              fileUrls.push(`https://www.dropbox.com/home${file.path_display}`);
            }
          } catch (error) {
            // Use file path as fallback
            fileUrls.push(`https://www.dropbox.com/home${file.path_display}`);
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
              .eq("name", "Dropbox")
              .single()
          ).data?.id);

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              fileUrls,
              uploadedCount: uploadedFiles.length,
              folderPath: targetPath || "/",
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
    console.error("Dropbox sync error:", error);
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
