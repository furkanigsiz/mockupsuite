# Implementation Plan

## Overview

This implementation plan covers the complete third-party integrations system for MockupSuite. The system enables users to connect with external platforms (Shopify, Etsy, Figma, Google Drive, Dropbox) using OAuth 2.0 authentication.

## Platform Registration Required

Before implementing OAuth functions, you must register apps with each platform:
- **Shopify**: Create Partner account and app
- **Etsy**: Register developer app
- **Figma**: Create OAuth app CLİENT İD : nm06og4SUG4vlVEb8Byqr0 CLİENT SECRET : M2fgR5lKvTXVa4TVMN9okNQmoNjMbW
- **Google Drive**: Set up Google Cloud project and enable Drive API
- **Dropbox**: Create app in App Console

Each platform will provide Client ID and Client Secret needed for environment variables.

---

## ✅ TAMAMLANMIŞ TASKLAR

- [x] 1. Set up database schema and types
  - Create integrations table with category, status, and OAuth config fields
  - Create user_integrations table with encrypted token storage
  - Implement RLS policies for user_integrations table
  - Add IntegrationErrorType and related types to types.ts
  - _Requirements: 1.1, 9.1, 9.2_

- [x] 2. Create integration service layer
  - [x] 2.1 Implement integrationService.ts with core methods
    - Write getIntegrations method to fetch integrations with user connection status
    - Write connectIntegration method to initiate OAuth flow
    - Write handleCallback method to process OAuth responses
    - Write disconnectIntegration method to remove connections
    - Write syncIntegration method for platform-specific operations
    - _Requirements: 3.1, 3.2, 4.2, 4.3_

- [x] 3. Implement generic backend Edge Functions
  - [x] 3.1 Create integrations-list Edge Function
    - Created supabase/functions/integrations-list/index.ts
    - Query integrations table for available platforms
    - Join with user_integrations to get connection status
    - Return formatted integration list with isConnected flag
    - _Requirements: 1.1, 9.1, 9.3_

  - [x] 3.2 Create integrations-connect Edge Function
    - Created supabase/functions/integrations-connect/index.ts
    - Generate OAuth authorization URL with state parameter
    - Store state in session for validation
    - Return authorization URL to frontend
    - _Requirements: 3.1, 3.2_

  - [x] 3.3 Create integrations-callback Edge Function
    - Created supabase/functions/integrations-callback/index.ts
    - Validate state parameter to prevent CSRF attacks
    - Exchange authorization code for access and refresh tokens
    - Encrypt tokens before storing in user_integrations table
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

  - [x] 3.4 Create integrations-disconnect Edge Function
    - Created supabase/functions/integrations-disconnect/index.ts
    - Delete user_integrations record for specified integration
    - Revoke access token with external platform if supported
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x] 3.5 Create integrations-sync Edge Function
    - Created supabase/functions/integrations-sync/index.ts
    - Retrieve stored tokens for user and integration
    - Implement token refresh logic if expired
    - Route to platform-specific sync handler
    - _Requirements: 5.1, 5.2, 6.1, 7.1, 8.1_

- [x] 4. Create IntegrationsPage component
  - [x] 4.1 Implement main page layout and structure
    - Create IntegrationsPage component with header and back navigation
    - Add sign-in button to header
    - Implement responsive grid layout for integration cards
    - Add loading and error states
    - _Requirements: 1.1, 10.1, 10.2_

  - [x] 4.2 Implement search functionality
    - Add search input field to page header
    - Implement real-time filtering by name and description
    - Update displayed integrations as user types
    - Show "no results" message when search returns empty
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.3 Implement category filtering
    - Create category filter tabs (All, Design Tools, E-commerce, Marketing, Storage)
    - Implement category selection logic
    - Filter integrations by selected category
    - Combine with search filter when both active
    - _Requirements: 1.5, 2.4_

  - [x] 4.4 Implement "Coming Soon" section
    - Separate integrations with status "coming_soon"
    - Display in dedicated section below active integrations
    - Show "Coming Soon" badge on cards
    - Disable connection button for coming soon integrations
    - _Requirements: 1.4, 9.4_

- [x] 5. Create IntegrationCard component
  - [x] 5.1 Implement card layout and styling
    - Display platform logo (64x64px)
    - Show platform name and description
    - Add status badge (Connected/Coming Soon)
    - Style with hover effects and transitions
    - _Requirements: 1.3, 1.4_

  - [x] 5.2 Implement connection controls
    - Show "Connect" button for disconnected active integrations
    - Show "Disconnect" button for connected integrations
    - Disable button for coming soon integrations
    - Handle button click events
    - _Requirements: 3.1, 4.1, 9.3, 9.4_

  - [x] 5.3 Add platform-specific action buttons
    - Show "Sync Products" button for connected Shopify
    - Show "Browse Files" button for connected Figma
    - Show "Save to Cloud" button for connected storage providers
    - Trigger appropriate sync operations on click
    - _Requirements: 5.1, 6.1, 7.1, 8.1_

- [x] 6. Create ConnectionModal component
  - [x] 6.1 Implement modal UI and OAuth flow
    - Create modal with platform branding
    - Display OAuth authorization instructions
    - Open OAuth URL in popup window
    - Listen for callback completion
    - Show success/error messages
    - _Requirements: 3.1, 3.2, 3.6_

  - [x] 6.2 Implement disconnect confirmation
    - Show confirmation dialog when user clicks disconnect
    - Display warning about losing access
    - Handle user confirmation or cancellation
    - Update UI after successful disconnection
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 7. Add navigation links to existing components
  - [x] 7.1 Update UnifiedHeader component
    - Add "Integrations" link to navigation menu
    - Highlight link when on integrations page
    - Handle click to navigate to integrations
    - _Requirements: 10.1, 10.4_

  - [x] 7.2 Update LandingPage component
    - Add "Integrations" link to header navigation
    - Add "Integrations" link to footer
    - Handle navigation to integrations page
    - _Requirements: 10.2, 10.3_

- [x] 8. Seed initial integration data
  - [x] 8.1 Create database seed script
    - Insert Shopify integration with OAuth config
    - Insert Etsy integration (coming soon)
    - Insert WooCommerce integration (coming soon)
    - Insert Figma integration with OAuth config
    - Insert Canva integration (coming soon)
    - Insert Google Drive integration with OAuth config
    - Insert Dropbox integration with OAuth config
    - Insert Instagram integration (coming soon)
    - Insert Facebook integration (coming soon)
    - _Requirements: 9.1, 9.2, 9.4_

  - [x] 8.2 Add integration logos to public assets
    - Add Shopify logo
    - Add Etsy logo
    - Add WooCommerce logo
    - Add Figma logo
    - Add Canva logo
    - Add Google Drive logo
    - Add Dropbox logo
    - Add Instagram logo
    - Add Facebook logo
    - _Requirements: 1.3_

- [x] 9. Add internationalization support
  - [x] 9.1 Add integration-related translation keys
    - Add keys for integration page title and descriptions
    - Add keys for category names
    - Add keys for connection status messages
    - Add keys for error messages
    - Add keys for success notifications
    - Add translations for Turkish, English, and Spanish
    - _Requirements: 1.1, 2.1, 3.6, 4.4_

- [x] 10. Implement error handling and user feedback
  - [x] 10.1 Add error handling to integration service
    - Implement IntegrationError type and error mapping
    - Add retry logic for network errors
    - Add token refresh logic for expired tokens
    - Handle platform-specific API errors
    - _Requirements: 3.1, 3.3, 4.5, 5.2, 6.3, 7.4, 8.4_

  - [x] 10.2 Add user feedback notifications
    - Show success toast when connection established
    - Show error toast with actionable message on failure
    - Show loading spinner during OAuth flow
    - Show progress indicator during sync operations
    - Display sync results (e.g., "50 products imported")
    - _Requirements: 3.6, 4.4, 5.5, 6.5, 8.5_

- [x] 11. Wire up routing and state management
  - [x] 11.1 Add integrations route to App.tsx
    - Add showIntegrations state variable
    - Add IntegrationsPage route with conditional rendering
    - Pass onBack handler to close integrations page
    - _Requirements: 10.1, 10.2_

  - [x] 11.2 Integrate with authentication
    - Require authentication to view integrations page
    - Redirect to auth page if user not logged in
    - Pass user ID to integration service methods
    - _Requirements: 1.1, 3.1, 4.1_

---

## 🔴 YAPILMASI GEREKEN KRİTİK TASKLAR

### Phase 1: Platform-Specific OAuth Edge Functions (En Kritik)

- [x] 12. Create platform-specific OAuth Edge Functions





  - [x] 12.1 Create Shopify OAuth Edge Function ✅ COMPLETED
    - [x] Create supabase/functions/shopify-oauth/index.ts
    - [x] Implement Shopify OAuth token exchange with HMAC verification
    - [x] Handle shop parameter and validate Shopify signature
    - [x] Store encrypted tokens in user_integrations table
    - [x] Return redirect URL to frontend callback route
    - [x] Added sync_products action to fetch products from Shopify API
    - [x] Save products to shopify_products database table
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3A.1, 3A.2_
    - _Status: FULLY FUNCTIONAL - OAuth working, product sync working_


  - [x] 12.2 Create Etsy OAuth Edge Function ✅ COMPLETED
    - [x] Create supabase/functions/etsy-oauth/index.ts
    - [x] Implement Etsy OAuth 2.0 token exchange with Basic Auth
    - [x] Store encrypted tokens in user_integrations table
    - [x] Return redirect URL to frontend callback route
    - [x] Handle state validation and CSRF protection
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3A.1, 3A.2_
    - _Status: FULLY IMPLEMENTED - Ready for credentials_


  - [x] 12.3 Create Figma OAuth Edge Function

    - Create supabase/functions/figma-oauth/index.ts
    - Implement Figma OAuth token exchange
    - Store encrypted tokens in user_integrations table
    - Return redirect URL to frontend callback route
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3A.1, 3A.2, 7.1_


  - [x] 12.4 Create Google Drive OAuth Edge Function

    - Create supabase/functions/google-drive-oauth/index.ts
    - Implement Google OAuth 2.0 token exchange
    - Request Drive API scopes
    - Store encrypted tokens in user_integrations table
    - Return redirect URL to frontend callback route
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3A.1, 3A.2, 8.1_



  - [x] 12.5 Create Dropbox OAuth Edge Function

    - Create supabase/functions/dropbox-oauth/index.ts
    - Implement Dropbox OAuth 2.0 token exchange
    - Store encrypted tokens in user_integrations table
    - Return redirect URL to frontend callback route
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3A.1, 3A.2, 8.1_

### Phase 2: Platform-Specific Sync Edge Functions

- [x] 13. Create platform-specific Sync Edge Functions





  - [x] 13.1 Create Shopify Sync Edge Function ✅ COMPLETED
    - [x] Integrated into shopify-oauth Edge Function (sync_products action)
    - [x] Implement import_products operation to fetch Shopify catalog
    - [x] Save products to shopify_products database table with images and variants
    - [x] Handle token refresh if expired
    - [x] Added CORS handling for browser requests
    - [ ] Implement publish_mockup operation to upload images to products (FUTURE)
    - [ ] Implement get_products operation to list products for selection (FUTURE)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_
    - _Status: CORE FUNCTIONALITY COMPLETE - Product import working_

  - [x] 13.2 Create Etsy Sync Edge Function ✅ COMPLETED
    - [x] Create supabase/functions/etsy-sync/index.ts
    - [x] Implement import_listings operation to fetch Etsy shop listings with pagination
    - [x] Implement publish_mockup operation to upload images to listings
    - [x] Implement get_listings operation to list listings for selection
    - [x] Handle token refresh if expired
    - [x] Fetch listing images from Etsy API
    - _Requirements: 5.1, 5.2, 6.1, 6.2_
    - _Status: FULLY IMPLEMENTED - Ready for credentials_

  - [x] 13.3 Create Figma Sync Edge Function


    - Create supabase/functions/figma-sync/index.ts
    - Implement list_files operation to fetch user's Figma files
    - Implement export_design operation to export file as image
    - Implement import_design operation to import into MockupSuite
    - Handle token refresh if expired
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 13.4 Create Google Drive Sync Edge Function


    - Create supabase/functions/google-drive-sync/index.ts
    - Implement upload_file operation to save mockups to Drive
    - Implement create_folder operation for folder management
    - Implement list_folders operation for folder picker
    - Handle token refresh if expired
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 13.5 Create Dropbox Sync Edge Function


    - Create supabase/functions/dropbox-sync/index.ts
    - Implement upload_file operation to save mockups to Dropbox
    - Implement create_folder operation for folder management
    - Implement list_folders operation for folder picker
    - Handle token refresh if expired
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

### Phase 3: Frontend OAuth Callback Handler

- [x] 14. Create OAuth callback route handler component






  - [x] 14.1 Create OAuthCallbackHandler component


    - Create components/OAuthCallbackHandler.tsx
    - Extract code and state parameters from URL query string
    - Determine platform from state parameter or URL
    - Display loading state while processing callback
    - Handle success and error responses
    - Close popup window if OAuth opened in popup
    - Redirect to integrations page with status message
    - _Requirements: 3A.1, 3A.2, 3A.3, 3A.4, 3A.5, 3A.6_

  - [x] 14.3 Improve OAuth popup callback UX


    - Update OAuthCallbackHandler to detect if running in popup window
    - Display user-friendly success page with platform name and branding
    - Show "Connection successful!" message with checkmark icon
    - Add 2-second delay before auto-closing popup
    - Send postMessage to parent window with success status
    - Update parent window's integration status without full page reload
    - _Requirements: 3B.1, 3B.2, 3B.3, 3B.4, 3B.5, 3B.6_


  - [x] 14.2 Add OAuth callback route to App.tsx

    - Add /integrations/callback route handling
    - Render OAuthCallbackHandler component for callback route
    - Handle route parameters and state management
    - _Requirements: 3A.1, 3A.2, 10.1, 10.2_

### Phase 4: Environment Configuration

- [ ] 15. Configure environment variables

  - [ ] 15.2 Add Etsy credentials to environment (READY TO CONFIGURE)
    - [ ] Register app at https://www.etsy.com/developers
    - [ ] Configure OAuth 2.0 redirect URI: `https://[your-project].supabase.co/functions/v1/etsy-oauth`
    - [ ] Get Client ID and Client Secret from Etsy Developer Console
    - [ ] Add ETSY_CLIENT_ID to Supabase Edge Functions secrets
    - [ ] Add ETSY_CLIENT_SECRET to Supabase Edge Functions secrets
    - [ ] Add ETSY_REDIRECT_URI to Supabase Edge Functions secrets
    - [ ] Add VITE_ETSY_CLIENT_ID to frontend .env
    - [ ] Add VITE_ETSY_REDIRECT_URI to frontend .env
    - [ ] Update Etsy integration status to 'active' in database
    - _Requirements: 3.1, 3.2_
    - _Note: OAuth and Sync functions are ready, only credentials needed_

  <!-- COMING SOON - POSTPONED
  - [ ] 15.1 Add Shopify credentials to environment
    - Add SHOPIFY_CLIENT_ID to Supabase Edge Functions secrets
    - Add SHOPIFY_CLIENT_SECRET to Supabase Edge Functions secrets
    - Add SHOPIFY_REDIRECT_URI to Supabase Edge Functions secrets
    - Add VITE_SHOPIFY_CLIENT_ID to frontend .env
    - Add VITE_SHOPIFY_REDIRECT_URI to frontend .env
    - _Requirements: 3.1, 3.2, 5.1_
  -->

  <!-- COMING SOON - POSTPONED
  - [ ] 15.3 Add Figma credentials to environment
    - Add FIGMA_CLIENT_ID to Supabase Edge Functions secrets
    - Add FIGMA_CLIENT_SECRET to Supabase Edge Functions secrets
    - Add FIGMA_REDIRECT_URI to Supabase Edge Functions secrets
    - Add VITE_FIGMA_CLIENT_ID to frontend .env
    - Add VITE_FIGMA_REDIRECT_URI to frontend .env
    - _Requirements: 3.1, 3.2, 7.1_
  -->

  - [x] 15.4 Add Google Drive credentials to environment
    - Add GOOGLE_CLIENT_ID to Supabase Edge Functions secrets
    - Add GOOGLE_CLIENT_SECRET to Supabase Edge Functions secrets
    - Add GOOGLE_REDIRECT_URI to Supabase Edge Functions secrets
    - Add VITE_GOOGLE_CLIENT_ID to frontend .env
    - Add VITE_GOOGLE_REDIRECT_URI to frontend .env
    - _Requirements: 3.1, 3.2, 8.1_

  <!-- COMING SOON - POSTPONED
  - [ ] 15.5 Add Dropbox credentials to environment
    - Add DROPBOX_CLIENT_ID to Supabase Edge Functions secrets
    - Add DROPBOX_CLIENT_SECRET to Supabase Edge Functions secrets
    - Add DROPBOX_REDIRECT_URI to Supabase Edge Functions secrets
    - Add VITE_DROPBOX_CLIENT_ID to frontend .env
    - Add VITE_DROPBOX_REDIRECT_URI to frontend .env
    - _Requirements: 3.1, 3.2, 8.1_
  -->

<!-- COMING SOON - POSTPONED
### Phase 5: Update Integration Service for Platform-Specific Functions

- [ ] 16. Update integration service to use platform-specific Edge Functions

  - [ ] 16.1 Update connectIntegration method
    - Modify to route to platform-specific OAuth Edge Functions
    - Add platform-specific OAuth URL builders (Shopify, Etsy, Figma, Google, Dropbox)
    - Update state parameter to include platform identifier
    - _Requirements: 3.1, 3.2, 3A.1, 3A.2_

  - [ ] 16.2 Update syncIntegration method
    - Modify to route to platform-specific sync Edge Functions
    - Add platform-specific operation handlers
    - Implement proper error handling for each platform
    - _Requirements: 5.1, 6.1, 7.1, 8.1_
-->

<!-- COMING SOON - POSTPONED
### Phase 6: Frontend UI Handlers for Platform Operations

- [ ] 17. Implement Shopify integration frontend handlers

  - [ ] 17.1 Create Shopify product import UI handler
    - Add UI button/action to trigger product import
    - Call shopify-sync Edge Function with import_products operation
    - Display loading state during import
    - Show success notification with imported product count
    - Handle errors and display user-friendly messages
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 17.2 Create Shopify mockup publish UI handler
    - Add "Publish to Shopify" option in mockup gallery
    - Display product selection modal with Shopify products
    - Call shopify-sync Edge Function with publish_mockup operation
    - Show upload progress indicator
    - Display success notification with Shopify product link
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 18. Implement Figma integration frontend handlers

  - [ ] 18.1 Create Figma file browser UI handler
    - Add "Browse Figma Files" action for connected Figma accounts
    - Call figma-sync Edge Function with list_files operation
    - Display file picker modal with thumbnails
    - Handle file selection
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 18.2 Create Figma design import UI handler
    - Call figma-sync Edge Function with export_design operation
    - Display loading state during export
    - Import exported image into MockupSuite upload system
    - Show success notification
    - _Requirements: 7.4, 7.5_
-->

### Phase 5: Shopify Product Management (COMPLETED) ✅

- [x] 24. Implement Shopify product database and UI

  - [x] 24.1 Create shopify_products database table
    - [x] Create migration for shopify_products table
    - [x] Add columns: user_id, shopify_product_id, title, description, vendor, product_type, handle
    - [x] Add JSONB columns for images, variants, and metadata
    - [x] Add unique constraint on (user_id, shopify_product_id)
    - [x] Enable RLS policies for user access control
    - [x] Add indexes for performance
    - _Status: COMPLETED_

  - [x] 24.2 Add database service functions
    - [x] Create getShopifyProducts function with pagination
    - [x] Create deleteShopifyProduct function
    - [x] Create getShopifyProduct function
    - [x] Add to services/databaseService.ts
    - _Status: COMPLETED_

  - [x] 24.3 Create Gallery Products tab
    - [x] Add tab system to GalleryPage (Mockups / Ürünlerim)
    - [x] Display Shopify products in grid layout
    - [x] Show product images, title, vendor, price
    - [x] Add pagination support (20 products per page)
    - [x] Add empty state with "Go to Integrations" button
    - _Status: COMPLETED_

  - [x] 24.4 Implement "Use for Mockup" feature
    - [x] Add "Use for Mockup" button to product cards
    - [x] Convert Shopify image URL to base64 (without data URL prefix)
    - [x] Store as pendingUploadedImage in localStorage
    - [x] Navigate to generator page
    - [x] Auto-load pending image in generator
    - [x] Clear pending image after loading
    - _Status: COMPLETED_

  - [x] 24.5 Add product management features
    - [x] Add delete product button
    - [x] Update IntegrationCard with "Ürünleri Senkronize Et" button
    - [x] Show sync success message with product count
    - [x] Handle sync errors gracefully
    - _Status: COMPLETED_

### Phase 6: Frontend UI Handlers for Cloud Storage (ACTIVE)

- [x] 19. Implement cloud storage integration frontend handlers

  - [x] 19.1 Create Google Drive upload UI handler (READY TO IMPLEMENT)







    - Add "Save to Google Drive" option in mockup gallery
    - Call google-drive-sync Edge Function with list_folders operation
    - Display folder picker modal
    - Call google-drive-sync with upload_file operation
    - Show upload progress and success notification with Drive links
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
    - _Status: READY - Google Drive OAuth is working, sync function is ready_

  <!-- COMING SOON - POSTPONED
  - [ ] 19.2 Create Dropbox upload UI handler
    - Add "Save to Dropbox" option in mockup gallery
    - Call dropbox-sync Edge Function with list_folders operation
    - Display folder picker modal
    - Call dropbox-sync with upload_file operation
    - Show upload progress and success notification with Dropbox links
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  -->

---

## 📝 OPSIYONEL TESTLER (İsteğe Bağlı)

- [ ]* 20. Write unit tests for integration service
  - Test OAuth URL generation for each platform
  - Test token storage and retrieval
  - Test error handling for each error type
  - Test platform routing logic
  - _Requirements: 3.1, 4.2_

- [ ]* 21. Write integration tests for Edge Functions
  - Test complete OAuth flow from connect to callback
  - Test token encryption and storage
  - Test RLS policies prevent unauthorized access
  - _Requirements: 3.1, 3.3, 4.2_

- [ ]* 22. Write component tests
  - Test IntegrationsPage search and filtering
  - Test IntegrationCard button visibility and actions
  - Test ConnectionModal OAuth flow
  - Test navigation links
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ]* 23. Write platform-specific integration tests
  - Test Shopify product import and publish flows
  - Test Figma file listing and design export
  - Test cloud storage upload flows
  - Test error handling for API failures
  - _Requirements: 5.1, 6.1, 7.1, 8.1_

---

## 🎯 Implementation Priority

**Start with Phase 1 (Task 12)** - Platform-specific OAuth Edge Functions are the most critical missing piece. Without these, users cannot connect their accounts.

**Then Phase 2 (Task 13)** - Sync functions enable actual data operations after connection.

**Then Phase 3 (Task 14)** - Frontend callback handler completes the OAuth flow.

**Then Phase 4 (Task 15)** - Environment configuration is required for everything to work.

**Then Phase 5 (Task 16)** - Update service layer to use new functions.

**Finally Phase 6 (Tasks 17-19)** - Add UI handlers for platform-specific operations.
