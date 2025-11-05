# Requirements Document

## Introduction

This document defines the requirements for a third-party integrations system that enables MockupSuite users to connect their accounts with external platforms (design tools, e-commerce platforms, marketing channels, and cloud storage services). The system will allow users to import designs, sync products, publish mockups, and manage files across multiple platforms through a unified interface.

## Glossary

- **Integration System**: The MockupSuite subsystem that manages connections to third-party platforms
- **OAuth Flow**: The authentication process used to securely connect user accounts to external services
- **User Integration**: A specific connection between a user's MockupSuite account and an external platform
- **Integration Card**: A UI component displaying information about an available integration
- **Sync Operation**: The process of exchanging data between MockupSuite and a connected platform
- **Access Token**: A credential used to authenticate API requests to external platforms
- **Webhook**: An HTTP callback that receives real-time updates from external platforms

## Requirements

### Requirement 1

**User Story:** As a MockupSuite user, I want to view all available integrations in a dedicated page, so that I can discover which platforms I can connect to

#### Acceptance Criteria

1. THE Integration System SHALL display an integrations page containing all available platform connections
2. WHEN a user navigates to the integrations page, THE Integration System SHALL render integration cards grouped by category (Design Tools, E-commerce, Marketing, Storage)
3. THE Integration System SHALL display for each integration card the platform name, logo, description, connection status, and action button
4. WHERE an integration has status "coming_soon", THE Integration System SHALL display a "Coming Soon" badge and disable the connection button
5. THE Integration System SHALL provide a category filter that allows users to view integrations from a specific category

### Requirement 2

**User Story:** As a MockupSuite user, I want to search for specific integrations, so that I can quickly find the platform I need to connect

#### Acceptance Criteria

1. THE Integration System SHALL provide a search input field on the integrations page
2. WHEN a user enters text into the search field, THE Integration System SHALL filter displayed integrations to show only those matching the search term in name or description
3. THE Integration System SHALL update the filtered results in real-time as the user types
4. WHEN the search field is empty, THE Integration System SHALL display all integrations according to the active category filter

### Requirement 3

**User Story:** As a MockupSuite user, I want to connect my account to external platforms using OAuth, so that I can securely authorize MockupSuite to access my data

#### Acceptance Criteria

1. WHEN a user clicks the "Connect" button on an active integration card, THE Integration System SHALL initiate an OAuth authorization flow for that platform
2. THE Integration System SHALL redirect the user to the external platform's authorization page
3. WHEN the user completes authorization on the external platform, THE Integration System SHALL receive the OAuth callback with authorization code
4. THE Integration System SHALL exchange the authorization code for access and refresh tokens
5. THE Integration System SHALL store the tokens securely in the user_integrations table associated with the user's account
6. WHEN token storage succeeds, THE Integration System SHALL update the integration card status to "Connected"

### Requirement 3A

**User Story:** As a MockupSuite user returning from OAuth authorization, I want the system to handle the callback automatically, so that my integration connection is completed seamlessly

#### Acceptance Criteria

1. THE Integration System SHALL provide a frontend route at /integrations/callback to handle OAuth redirects
2. WHEN the external platform redirects to the callback route, THE Integration System SHALL extract the authorization code and state parameters from the URL
3. THE Integration System SHALL send the authorization code and state to the backend Edge Function for token exchange
4. WHEN token exchange succeeds, THE Integration System SHALL redirect the user back to the integrations page with a success message
5. WHEN token exchange fails, THE Integration System SHALL redirect the user back to the integrations page with an error message
6. THE Integration System SHALL close any OAuth popup windows after callback processing completes

### Requirement 3B

**User Story:** As a MockupSuite user completing OAuth authorization in a popup window, I want to see a clear success message before the popup closes, so that I understand the connection was successful

#### Acceptance Criteria

1. WHEN the OAuth callback is opened in a popup window, THE Integration System SHALL display a user-friendly success page with the platform name
2. THE Integration System SHALL show a success message indicating the connection was established
3. THE Integration System SHALL display a loading indicator while processing the callback
4. WHEN token exchange completes successfully, THE Integration System SHALL show "Connection successful!" message for 2 seconds before closing the popup
5. THE Integration System SHALL automatically close the popup window after displaying the success message
6. WHEN the popup closes, THE Integration System SHALL update the parent window's integrations page to show the connected status

### Requirement 4

**User Story:** As a MockupSuite user, I want to disconnect from integrated platforms, so that I can revoke MockupSuite's access to my external accounts

#### Acceptance Criteria

1. WHERE a user has an active connection to a platform, THE Integration System SHALL display a "Disconnect" button on the integration card
2. WHEN a user clicks the "Disconnect" button, THE Integration System SHALL prompt for confirmation before proceeding
3. WHEN the user confirms disconnection, THE Integration System SHALL delete the stored tokens from the user_integrations table
4. THE Integration System SHALL update the integration card status to show "Connect" button
5. THE Integration System SHALL revoke the access token with the external platform where the platform API supports token revocation

### Requirement 5

**User Story:** As a MockupSuite user with a connected Shopify account, I want to import my product catalog, so that I can generate mockups for my existing products

#### Acceptance Criteria

1. WHERE a user has connected their Shopify account, THE Integration System SHALL provide a "Sync Products" action
2. WHEN a user initiates product sync, THE Integration System SHALL retrieve the user's product catalog from Shopify API using stored credentials
3. THE Integration System SHALL import product data including product name, description, images, and variants
4. THE Integration System SHALL store imported products in a format compatible with MockupSuite's project structure
5. WHEN sync completes, THE Integration System SHALL display a success notification with the count of imported products

### Requirement 6

**User Story:** As a MockupSuite user with a connected Shopify account, I want to publish generated mockups to my product listings, so that I can update my store with new product images

#### Acceptance Criteria

1. WHERE a user has connected their Shopify account, THE Integration System SHALL provide an option to publish mockups to Shopify from the gallery
2. WHEN a user selects mockups to publish, THE Integration System SHALL display a list of their Shopify products to choose from
3. WHEN a user confirms publication, THE Integration System SHALL upload the selected mockup images to the chosen Shopify product using the Shopify API
4. THE Integration System SHALL add the uploaded images to the product's image gallery
5. WHEN upload completes, THE Integration System SHALL display a success notification with a link to view the product in Shopify

### Requirement 7

**User Story:** As a MockupSuite user with a connected Figma account, I want to import designs from Figma, so that I can use them to generate product mockups

#### Acceptance Criteria

1. WHERE a user has connected their Figma account, THE Integration System SHALL provide a "Browse Figma Files" action
2. WHEN a user initiates Figma browsing, THE Integration System SHALL retrieve the user's Figma files and projects using the Figma API
3. THE Integration System SHALL display a file picker showing available Figma files
4. WHEN a user selects a Figma file, THE Integration System SHALL export the design as an image using Figma's export API
5. THE Integration System SHALL import the exported image into MockupSuite's upload system for mockup generation

### Requirement 8

**User Story:** As a MockupSuite user with connected cloud storage, I want to save generated mockups directly to my cloud storage, so that I can access them across multiple devices and applications

#### Acceptance Criteria

1. WHERE a user has connected Google Drive or Dropbox, THE Integration System SHALL provide a "Save to Cloud" option in the mockup gallery
2. WHEN a user selects mockups to save, THE Integration System SHALL display a folder picker for the connected cloud storage service
3. WHEN a user confirms the destination folder, THE Integration System SHALL upload the selected mockup images to the cloud storage using the service's API
4. THE Integration System SHALL preserve the original image quality and filename during upload
5. WHEN upload completes, THE Integration System SHALL display a success notification with a link to view the files in cloud storage

### Requirement 9

**User Story:** As a MockupSuite administrator, I want to manage available integrations in the database, so that I can add new platforms and control which integrations are visible to users

#### Acceptance Criteria

1. THE Integration System SHALL store integration metadata in an integrations table including name, description, category, logo URL, and status
2. THE Integration System SHALL support integration status values of "active" and "coming_soon"
3. WHERE an integration has status "active", THE Integration System SHALL display the integration with a functional "Connect" button
4. WHERE an integration has status "coming_soon", THE Integration System SHALL display the integration in a separate "Coming Soon" section with a disabled button
5. THE Integration System SHALL allow administrators to add new integrations by inserting records into the integrations table

### Requirement 10

**User Story:** As a MockupSuite user, I want to access the integrations page from the main navigation, so that I can easily find and manage my platform connections

#### Acceptance Criteria

1. THE Integration System SHALL add an "Integrations" link to the application header navigation
2. WHEN a user clicks the "Integrations" link, THE Integration System SHALL navigate to the integrations page
3. THE Integration System SHALL add an "Integrations" link to the application footer
4. THE Integration System SHALL highlight the "Integrations" navigation item when the user is on the integrations page
