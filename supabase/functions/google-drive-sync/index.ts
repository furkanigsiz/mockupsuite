import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

interface GoogleTokenResponse {
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

    // Get user's Google Drive integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from("user_integrations")
      .select("access_token, refresh_token, token_expires_at")
      .eq("user_id", user.id)
      .eq("integration_id", (
        await supabaseClient
          .from("integrations")
          .select("id")
          .eq("name", "Google Drive")
          .single()
      ).data?.id)
      .single();

    if (integrationError || !integration) {
      throw new Error("Google Drive integration not found");
    }

    let accessToken = integration.access_token;

    // Check if token is expired and refresh if needed
    if (integration.token_expires_at) {
      const expiresAt = new Date(integration.token_expires_at);
      const now = new Date();
      
      if (expiresAt <= now && integration.refresh_token) {
        // Refresh token
        const refreshResponse = await fetch(
          "https://oauth2.googleapis.com/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: Deno.env.get("GOOGLE_CLIENT_ID") ?? "",
              client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "",
              refresh_token: integration.refresh_token,
              grant_type: "refresh_token",
            }),
          }
        );

        if (!refreshResponse.ok) {
          throw new Error("Failed to refresh Google token");
        }

        const tokenData: GoogleTokenResponse = await refreshResponse.json();
        accessToken = tokenData.access_token;

        // Update stored token
        await supabaseClient
          .from("user_integrations")
          .update({
            access_token: tokenData.access_token,
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
              .eq("name", "Google Drive")
              .single()
          ).data?.id);
      }
    }

    const baseUrl = "https://www.googleapis.com/drive/v3";
    const uploadUrl = "https://www.googleapis.com/upload/drive/v3";

    // Handle different operations
    switch (operation) {
      case "list_folders": {
        const { parentId } = data || {};

        // Build query to list folders
        let query = "mimeType='application/vnd.google-apps.folder' and trashed=false";
        
        if (parentId) {
          query += ` and '${parentId}' in parents`;
        } else {
          query += " and 'root' in parents";
        }

        const response = await fetch(
          `${baseUrl}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)&orderBy=name`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Google Drive API error: ${response.statusText}`);
        }

        const responseData = await response.json();

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              folders: responseData.files.map((f: GoogleDriveFile) => ({
                id: f.id,
                name: f.name,
              })),
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "create_folder": {
        const { folderName, parentId } = data;

        if (!folderName) {
          throw new Error("Missing folderName");
        }

        const metadata: any = {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        };

        if (parentId) {
          metadata.parents = [parentId];
        }

        const response = await fetch(`${baseUrl}/files`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(metadata),
        });

        if (!response.ok) {
          throw new Error(`Failed to create folder: ${response.statusText}`);
        }

        const responseData = await response.json();

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              folderId: responseData.id,
              folderName: responseData.name,
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "upload_file": {
        const { mockupUrls, folderId, folderName } = data;

        if (!mockupUrls || !Array.isArray(mockupUrls)) {
          throw new Error("Missing mockupUrls");
        }

        let targetFolderId = folderId;

        // Create folder if folderName provided but no folderId
        if (!targetFolderId && folderName) {
          const createResponse = await fetch(`${baseUrl}/files`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: folderName,
              mimeType: "application/vnd.google-apps.folder",
            }),
          });

          if (createResponse.ok) {
            const createData = await createResponse.json();
            targetFolderId = createData.id;
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
          const fileName = urlParts[urlParts.length - 1] || `mockup-${Date.now()}.png`;

          // Create metadata
          const metadata: any = {
            name: fileName,
          };

          if (targetFolderId) {
            metadata.parents = [targetFolderId];
          }

          // Upload using multipart upload
          const boundary = "-------314159265358979323846";
          const delimiter = `\r\n--${boundary}\r\n`;
          const closeDelimiter = `\r\n--${boundary}--`;

          const multipartBody = 
            delimiter +
            "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
            JSON.stringify(metadata) +
            delimiter +
            "Content-Type: image/png\r\n\r\n" +
            new TextDecoder().decode(imageBuffer) +
            closeDelimiter;

          const uploadResponse = await fetch(
            `${uploadUrl}/files?uploadType=multipart`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": `multipart/related; boundary=${boundary}`,
              },
              body: multipartBody,
            }
          );

          if (!uploadResponse.ok) {
            // Try simple upload as fallback
            const simpleMetadata = JSON.stringify(metadata);
            const uploadResponse2 = await fetch(
              `${uploadUrl}/files?uploadType=resumable`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                  "X-Upload-Content-Type": "image/png",
                },
                body: simpleMetadata,
              }
            );

            if (!uploadResponse2.ok) {
              throw new Error(`Failed to upload file: ${uploadResponse2.statusText}`);
            }

            const uploadUrl2 = uploadResponse2.headers.get("Location");
            if (!uploadUrl2) {
              throw new Error("No upload URL returned");
            }

            const finalUpload = await fetch(uploadUrl2, {
              method: "PUT",
              headers: {
                "Content-Type": "image/png",
              },
              body: imageBuffer,
            });

            if (!finalUpload.ok) {
              throw new Error(`Failed to upload file content: ${finalUpload.statusText}`);
            }

            const uploadData = await finalUpload.json();
            uploadedFiles.push(uploadData);
          } else {
            const uploadData = await uploadResponse.json();
            uploadedFiles.push(uploadData);
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
              .eq("name", "Google Drive")
              .single()
          ).data?.id);

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              fileUrls: uploadedFiles.map((f: GoogleDriveFile) => f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`),
              uploadedCount: uploadedFiles.length,
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
    console.error("Google Drive sync error:", error);
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
