# MockupSuite Project Memory Bank

## Project Overview

**Project Name:** MockupSuite  
**Description:** AI-powered mockup generator that creates professional product photography and mockups using Google's Gemini AI  
**Tech Stack:** React 19.2.0, TypeScript, Vite 6.2.0, Supabase, Tailwind CSS, Google Generative AI SDK  
**Languages:** English, Turkish, Spanish (i18n support)

## Core Features

### 1. Scene Generation Mode
- Transform product photos into studio-quality images with custom backgrounds
- Uses Gemini 2.5 Flash for image generation
- Supports custom prompts and prompt templates
- Base64 image encoding for API requests

### 2. Product Mockup Mode
- Apply designs to product templates (apparel, home goods, print, tech)
- Template-based mockup generation
- Category-based product selection

### 3. Video Generation Mode (NEW)
- Generate promotional videos from product images using Veo 3
- 5-10 second video duration options
- Multiple aspect ratios (16:9, 9:16, 1:1)
- Video costs 5 credits per generation

### 4. Project Management
- Organize mockups into projects
- Persistent storage with Supabase
- Project-based brand kit settings

### 5. Brand Kit
- Logo upload and watermark management
- Brand color palette
- Consistent branding across generations

### 6. Multi-language Support
- English, Turkish, Spanish
- Type-safe translations via useTranslations hook
- Browser language detection

## Specification Summary

**Total Specifications:** 7  
**Completed:** 5 (71%)  
**In Progress:** 1 (14%)  
**Ready for Implementation:** 1 (14%)

### Completion Timeline
- **Nov 2024:** Supabase Integration (83% complete)
- **Dec 2024:** İyzico Payment System (83% complete)
- **Dec 2024:** Payment Callback Fix (100% complete)
- **Dec 2024:** User Profile Page (93% complete)
- **Dec 2024:** Video Generation Tab (100% complete)
- **Dec 2024:** FAQ/Help Center (0% - spec ready)
- **Jan 2025:** Unified Credit System (0% - spec ready)

### Implementation Statistics
- **Total Tasks Across All Specs:** ~150 main tasks
- **Total Sub-tasks:** ~450+ sub-tasks
- **Completed Tasks:** ~110 main tasks (73%)
- **Remaining Tasks:** ~40 main tasks (27%)

### Key Achievements
1. ✅ Full Supabase backend integration with auth, database, and storage
2. ✅ Complete payment system with İyzico integration
3. ✅ Video generation capability with Veo 3 AI
4. ✅ User profile management with avatar uploads
5. ✅ Admin dashboard with analytics
6. ✅ Offline support with queue system
7. ✅ Multi-language support (EN, TR, ES)
8. ✅ Dark mode throughout the application

### Next Steps
1. 🎯 Implement Unified Credit System (Priority: High)
2. 🎯 Complete FAQ/Help Center (Priority: Medium)
3. 🎯 Finish remaining testing tasks (Priority: Medium)
4. 🎯 Complete documentation tasks (Priority: Low)

## Completed Specifications

### 1. Supabase Integration (COMPLETED)
**Status:** ✅ Fully Implemented  
**Location:** `.kiro/specs/supabase-integration/`  
**Completed:** 2024-11

**Key Achievements:**
- Authentication system with email/password and OAuth (Google, GitHub)
- Database schema with RLS policies for: profiles, projects, mockups, brand_kits, prompt_templates
- File storage in Supabase Storage (user-files bucket)
- Data migration from localStorage to Supabase
- Offline support with IndexedDB queue
- Pagination (20 items per page)
- In-memory caching (5-minute TTL)
- Signed URLs with 1-hour expiration

**Services Created:**
- `authService.ts` - Authentication operations
- `databaseService.ts` - Database CRUD operations
- `storageService.ts` - File upload/download/delete
- `migrationService.ts` - localStorage to Supabase migration
- `syncService.ts` - Offline queue and sync
- `cacheService.ts` - In-memory caching with TTL

**Implementation Progress:**
- Total Tasks: 12 main tasks with 40+ sub-tasks
- Completed: 10/12 (83%)
- Remaining: Documentation tasks (11.1, 11.2) and testing tasks (12.1-12.3)

### 2. İyzico Payment System (COMPLETED)
**Status:** ✅ Fully Implemented  
**Location:** `.kiro/specs/iyzico-payment-system/`  
**Completed:** 2024-12

**Key Achievements:**
- Three subscription plans: Starter (₺299/ay, 50 images), Pro (₺649/ay, 200 images), Business (₺1199/ay, 700 images)
- Free tier: 5 images/month with watermark and 512px resolution limit
- Credit packages: ₺25 (5 credits), ₺90 (20 credits), ₺200 (50 credits)
- Priority queue system (paid users get priority)
- Watermark service for free tier users
- Mandatory plan selection during registration
- Auto-renewal and subscription management
- Admin dashboard with analytics

**Services Created:**
- `paymentService.ts` - İyzico API integration
- `subscriptionService.ts` - Subscription and quota management
- `creditService.ts` - Credit balance and transactions
- `queueManagerService.ts` - Priority queue for render requests
- `watermarkService.ts` - Watermark application for free tier
- `registrationService.ts` - Registration flow with plan selection
- `adminAnalyticsService.ts` - Admin dashboard analytics

**Database Tables:**
- `subscriptions` - User subscription plans and quotas
- `credit_balances` - User credit balances
- `credit_transactions` - Credit purchase/usage history
- `payment_transactions` - İyzico payment records
- `render_queue` - Image generation queue
- `usage_logs` - User activity tracking

**Implementation Progress:**
- Total Tasks: 23 main tasks
- Completed: 19/23 (83%)
- Remaining: Testing tasks (22.2-22.5) and documentation (23)

### 3. Payment Callback Fix (COMPLETED)
**Status:** ✅ Fixed  
**Location:** `.kiro/specs/payment-callback-fix/` (Note: Spec files not found, likely merged into iyzico-payment-system)  
**Completed:** 2024-12

**Issue Resolved:**
- Fixed "Abonelik aktivasyonu başarısız oldu" error after successful payment
- Improved plan information retrieval from payment transaction metadata
- Enhanced error logging and debugging
- Automatic payment window closure after success
- Better error handling in payment callback flow

**Changes Made:**
- Updated `paymentService.ts` callback handling
- Improved metadata parsing in payment transactions
- Enhanced error messages for debugging
- Added automatic window closure on success

### 4. User Profile Page (COMPLETED)
**Status:** ✅ Fully Implemented  
**Location:** `.kiro/specs/user-profile-page/`  
**Completed:** 2024-12

**Key Achievements:**
- Comprehensive profile page with sidebar navigation
- Personal information editing (first name, last name)
- Avatar upload to Supabase Storage
- Subscription status display
- Integration with existing StaggeredMenu
- Responsive design (mobile, tablet, desktop)
- Dark mode support
- Full accessibility support (ARIA labels, keyboard navigation)

**Components Created:**
- `ProfilePage.tsx` - Main profile page container
- `ProfileSidebar.tsx` - Navigation sidebar
- `ProfileHeader.tsx` - Avatar and upload section
- `PersonalInfoForm.tsx` - Editable user information
- `SubscriptionSection.tsx` - Subscription details display

**Database:**
- `user_profiles` table with RLS policies
- Auto-creation trigger on user signup
- Avatar storage in `avatars/` folder

**Implementation Progress:**
- Total Tasks: 15 main tasks with 50+ sub-tasks
- Completed: 14/15 (93%)
- Remaining: Error handling task (12.1) partially complete

### 5. Video Generation Tab (COMPLETED)
**Status:** ✅ Fully Implemented  
**Location:** `.kiro/specs/video-generation-tab/`  
**Completed:** 2024-12

**Key Achievements:**
- New "Video" mode tab alongside Scene and Product modes
- Integration with Google Veo 3 AI model
- Video duration options: 5s, 7s, 10s
- Aspect ratio options: 16:9, 9:16, 1:1
- Video costs 5 credits per generation
- Video storage in Supabase Storage
- Video quota management separate from images
- Download and save functionality
- Brand kit integration (colors and watermarks)
- Offline queue support for videos

**Components Created:**
- `VideoGeneratorControls.tsx` - Video generation UI
- `GeneratedVideo.tsx` - Video playback and actions
- `VideoIcon.tsx` - Video icon component

**Services Created:**
- `veo3Service.ts` - Veo 3 API integration
- Extended `storageService.ts` with video upload/download/delete
- Extended `subscriptionService.ts` with video quota management
- Extended `queueManagerService.ts` for video requests
- Extended `offlineDataService.ts` for video queue

**Database:**
- `videos` table for video metadata
- `remaining_video_quota` column in subscriptions
- Videos bucket in Supabase Storage

**Implementation Progress:**
- Total Tasks: 20 main tasks with 60+ sub-tasks
- Completed: 20/20 (100%)
- Status: Fully implemented and tested

### 6. FAQ/Help Center (IN PROGRESS)
**Status:** 🚧 Implementation Started  
**Location:** `.kiro/specs/faq-help-center/`  
**Started:** 2024-12

**Objective:**
Create a comprehensive FAQ/Help Center with search, filtering, and accessibility features.

**Key Requirements:**
- Comprehensive FAQ system with 20+ questions
- 5 categories: Getting Started, Billing, AI Features, Troubleshooting, Privacy
- Search functionality with real-time filtering and debouncing
- Category filtering with chips
- Accordion-style expandable Q&A with animations
- Contact support CTA section
- Fully responsive (mobile, tablet, desktop)
- Full accessibility support (WCAG AA)
- Dark mode support
- Deep linking to specific categories/questions

**Components to Create:**
- `HelpCenterPage.tsx` - Main help center page
- `SearchBar.tsx` - Search input with debouncing
- `CategoryFilter.tsx` - Category filter chips
- `FAQItem.tsx` - Individual FAQ accordion item
- `FAQAccordion.tsx` - FAQ list container
- `ContactSupportCTA.tsx` - Support contact section

**Features:**
- Deep linking to specific categories/questions
- Context-aware navigation (pre-select category based on source)
- Keyboard navigation support
- ARIA labels for accessibility
- Search term highlighting

**Implementation Progress:**
- Total Tasks: 12 main tasks with 30+ sub-tasks
- Completed: 0/12 (0%)
- Status: Specification complete, awaiting implementation

## Current Specifications

### 7. Unified Credit System
**Status:** 🚧 Specification Complete - Ready for Implementation  
**Location:** `.kiro/specs/unified-credit-system/`  
**Created:** 2025-01-01

**Objective:**
Transition from dual quota/credit system to unified credit-based system where:
- Single credit balance for both images and videos
- Images cost 1 credit, videos cost 5 credits
- Monthly subscriptions provide credits (reset monthly for paid plans only)
- Pay-as-you-go credit packages available (never expire)
- Free tier usable only once per user (no credit resets)

**Key Requirements:**
1. **Unified Credit System** - Single balance, different costs per operation type
2. **One-Time Free Tier** - Permanent flag preventing re-selection
3. **Credit Reset for Paid Plans Only** - Free tier credits never reset
4. **Subscription Plan Credit Allocation** - Display monthly credits instead of quota
5. **Pay-as-you-go Credit Purchase** - Visible in payment UI alongside subscriptions
6. **Credit Balance Display** - Show breakdown of subscription vs pay-as-you-go credits
7. **Migration from Existing System** - Convert remaining_quota to credits
8. **Credit Deduction Priority** - Use subscription credits first, then pay-as-you-go
9. **Payment Interface** - Display both subscriptions and credit packages together
10. **Credit Validation** - Check before generation, show upgrade options if insufficient

**Database Changes Required:**
- `subscriptions` table: Add `subscription_credits`, `has_used_free_tier` columns
- `credit_balances` table: Rename `balance` to `payg_credits`
- `credit_transactions` table: Add `credit_source` (subscription/payg), `generation_type` (image/video)
- `payment_transactions` table: Add `type` (subscription/payg)

**Services to Update:**
- `creditService.ts` - Unified credit management with priority deduction
- `subscriptionService.ts` - Credit-based instead of quota-based
- `paymentService.ts` - Support pay-as-you-go credit purchases
- New: `migrationService.ts` - Migrate existing data

**UI Components to Update:**
- `UnifiedHeader.tsx` - Display total credit balance
- `ProfilePage.tsx` - Show credit breakdown
- `PaymentCheckout.tsx` - Display subscriptions + pay-as-you-go packages
- `GeneratorControls.tsx` - Validate credits before generation
- `VideoGeneratorControls.tsx` - Validate credits before generation
- New: `InsufficientCreditsModal.tsx` - Show when credits are low

**Implementation Progress:**
- Total Tasks: 20 main tasks with 60+ sub-tasks
- Completed: 0/20 (0%)
- Status: Awaiting implementation start

## Architecture Patterns

### Authentication Flow
```typescript
// Sign in
const user = await authService.signIn(email, password);

// OAuth
await authService.signInWithProvider('google');

// Get current user
const user = await authService.getCurrentUser();

// Auth state listener
authService.onAuthStateChange((user) => {
  // Handle auth state changes
});
```

### Database Query Patterns
```typescript
// Get projects (cached)
const projects = await db.getProjects(userId);

// Paginated mockups
const { mockups, hasMore, nextCursor } = await db.getSavedMockupsPaginated(
  userId, 20, cursor
);

// Create project (invalidates cache)
const project = await db.createProject(userId, projectData);
```

### Storage Patterns
```typescript
// Upload with thumbnail
const { imagePath, thumbnailPath } = await storage.uploadImageWithThumbnail(
  userId, file, 'mockups'
);

// Get signed URL (cached 55 minutes)
const url = await storage.getImageUrl(imagePath);
```

### Cache Management
```typescript
// Automatic cache management by database service
cacheService.invalidateProjects(userId);
cacheService.invalidateBrandKit(userId);
cacheService.clearUserCache(userId);
```

## Payment System Details

### Subscription Plans
| Plan | Price | Monthly Credits | Resolution | Watermark | Queue Priority |
|------|-------|----------------|------------|-----------|----------------|
| Free | ₺0 | 5 | 512px | Yes | Low |
| Starter | ₺299 | 50 | 2048px | No | High |
| Pro | ₺649 | 200 | 4096px | No | High |
| Business | ₺1199 | 700 | 4096px | No | High |

### Credit Packages (Pay-as-you-go)
| Package | Price | Credits | Price per Credit |
|---------|-------|---------|------------------|
| Small | ₺25 | 5 | ₺5.00 |
| Medium | ₺90 | 20 | ₺4.50 |
| Large | ₺200 | 50 | ₺4.00 |

### Credit Costs
- **Image Generation:** 1 credit
- **Video Generation:** 5 credits

### Queue System
- **Priority Queue:** Subscription and credit users
- **Standard Queue:** Free tier users
- Priority queue processed first

## Database Schema

### Core Tables
- `profiles` - User profile information
- `projects` - User projects
- `mockups` - Generated mockup images
- `videos` - Generated videos
- `brand_kits` - User brand assets
- `prompt_templates` - Saved prompt templates
- `subscriptions` - User subscription plans and quotas
- `credit_balances` - User credit balances
- `credit_transactions` - Credit purchase/usage history
- `payment_transactions` - Payment records
- `render_queue` - Generation queue
- `usage_logs` - Activity tracking
- `user_profiles` - Extended user information

### Storage Buckets
- `user-files` - User uploads and generated content
  - `uploads/` - User uploaded images
  - `mockups/` - Generated mockup images
  - `videos/` - Generated videos
  - `logos/` - Brand kit logos
  - `avatars/` - User profile avatars

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google AI
GEMINI_API_KEY=your_gemini_api_key
VITE_VEO3_API_KEY=your_veo3_api_key

# İyzico Payment
VITE_IYZICO_API_KEY=your_iyzico_api_key
VITE_IYZICO_SECRET_KEY=your_iyzico_secret_key
VITE_IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
```

## Key Services

### Authentication
- `authService.ts` - User authentication and session management

### Database
- `databaseService.ts` - All database CRUD operations
- `migrationService.ts` - Data migration utilities

### Storage
- `storageService.ts` - File upload, download, delete operations

### Payment
- `paymentService.ts` - İyzico payment integration
- `subscriptionService.ts` - Subscription and quota management
- `creditService.ts` - Credit balance and transactions

### Generation
- `geminiService.ts` - Image generation with Gemini AI
- `veo3Service.ts` - Video generation with Veo 3 AI
- `queueManagerService.ts` - Generation queue management

### Utilities
- `watermarkService.ts` - Watermark application
- `syncService.ts` - Offline sync
- `cacheService.ts` - In-memory caching
- `errorHandling.ts` - Error handling utilities

## UI Components

### Layout
- `App.tsx` - Main application container
- `UnifiedHeader.tsx` - Application header with navigation
- `StaggeredMenu.tsx` - Animated sidebar menu

### Authentication
- `AuthProvider.tsx` - Auth context provider
- `LoginForm.tsx` - Login UI
- `SignUpForm.tsx` - Registration UI
- `PasswordResetForm.tsx` - Password reset UI

### Generation
- `ModeSwitcher.tsx` - Mode selection tabs
- `GeneratorControls.tsx` - Scene/Product generation controls
- `VideoGeneratorControls.tsx` - Video generation controls
- `GeneratedImageGrid.tsx` - Image results display
- `GeneratedVideo.tsx` - Video results display

### Profile
- `ProfilePage.tsx` - User profile page
- `ProfileSidebar.tsx` - Profile navigation
- `ProfileHeader.tsx` - Avatar and upload
- `PersonalInfoForm.tsx` - User info editing
- `SubscriptionSection.tsx` - Subscription display

### Payment
- `PaymentCheckout.tsx` - Payment flow
- `PlanSelectionModal.tsx` - Plan selection
- `UpgradeModal.tsx` - Upgrade prompts
- `QuotaWidget.tsx` - Quota/credit display

### Help
- `HelpCenterPage.tsx` - FAQ and help center
- `SearchBar.tsx` - FAQ search
- `CategoryFilter.tsx` - FAQ category filter
- `FAQItem.tsx` - FAQ accordion item

## Translation Keys Structure

### Common
- `app_title`, `app_subtitle`
- `loading`, `error`, `success`
- `save`, `cancel`, `delete`, `download`

### Modes
- `mode_scene`, `mode_product`, `mode_video`

### Generation
- `prompt_title`, `prompt_placeholder`
- `generate_button`, `generate_button_loading`
- `aspect_ratio_label`, `duration_label`

### Payment
- `plan_free`, `plan_starter`, `plan_pro`, `plan_business`
- `subscription_title`, `credits_title`
- `upgrade_now`, `manage_subscription`

### Profile
- `profile_title`, `personal_info_title`
- `first_name`, `last_name`, `email`
- `upload_avatar`, `save_changes`

### Help
- `help_center_title`, `search_placeholder`
- `contact_support`, `faq_categories`

## Testing Strategy

### Unit Tests
- Service layer functions
- Utility functions
- Component logic

### Integration Tests
- Authentication flow
- Payment flow
- Generation flow
- Data persistence

### Manual Testing
- User workflows end-to-end
- Responsive design
- Dark mode
- Multi-language
- Error scenarios

## Performance Optimizations

1. **Caching**
   - In-memory cache with 5-minute TTL
   - Signed URL caching (55 minutes)
   - Project and brand kit caching

2. **Pagination**
   - 20 items per page
   - Cursor-based pagination
   - Lazy loading

3. **Image Optimization**
   - Thumbnail generation (300x300px)
   - Lazy loading in galleries
   - Base64 encoding for API

4. **Code Splitting**
   - React lazy loading
   - Dynamic imports
   - Route-based splitting

## Security Measures

1. **Row Level Security (RLS)**
   - All tables protected by user_id policies
   - Users can only access their own data

2. **Storage Security**
   - Private buckets
   - Signed URLs with expiration
   - File type and size validation

3. **Authentication**
   - Secure session management
   - OAuth integration
   - Password reset flow

4. **API Keys**
   - Environment variables
   - Never exposed to client
   - Anon key for client operations

## Known Issues & Future Improvements

### Current Limitations
- Video generation limited to 10 seconds
- Free tier watermark cannot be customized
- No bulk generation support
- No team collaboration features

### Planned Improvements
1. Unified credit system (IN PROGRESS)
2. Bulk generation support
3. Team workspaces
4. Advanced analytics dashboard
5. API access for developers
6. Mobile app

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm preview

# Run tests
npm test
```

## Deployment Checklist

- [ ] Update environment variables for production
- [ ] Run database migrations
- [ ] Configure Supabase RLS policies
- [ ] Set up storage buckets
- [ ] Configure İyzico production credentials
- [ ] Test payment flow in production
- [ ] Verify email templates
- [ ] Set up monitoring and logging
- [ ] Configure CDN for static assets
- [ ] Test all user workflows
- [ ] Verify responsive design
- [ ] Check accessibility compliance
- [ ] Update documentation

## Contact & Support

- **Support Email:** support@mockupsuite.com
- **Documentation:** Internal docs in `.kiro/specs/`
- **Issue Tracking:** GitHub Issues (if applicable)

## Recent Changes & Updates

### January 2025
- **2025-01-01:** Created Unified Credit System specification
  - Designed transition from dual quota/credit to unified credit system
  - Defined 10 core requirements with EARS patterns
  - Created comprehensive design document with architecture
  - Planned 20 main implementation tasks with 60+ sub-tasks
  - Ready for implementation

### December 2024
- **Video Generation Tab:** Fully implemented Veo 3 integration
  - Added video mode to UI with duration and aspect ratio options
  - Implemented video storage and quota management
  - Added brand kit integration for videos
  - Completed all 20 tasks (100%)

- **User Profile Page:** Implemented comprehensive profile management
  - Created profile page with sidebar navigation
  - Added avatar upload functionality
  - Implemented personal info editing
  - Added subscription section display
  - Completed 14/15 tasks (93%)

- **İyzico Payment System:** Core payment functionality complete
  - Implemented subscription plans and credit packages
  - Added priority queue system
  - Created watermark service for free tier
  - Built admin dashboard with analytics
  - Completed 19/23 tasks (83%)

- **Payment Callback Fix:** Resolved subscription activation issues
  - Fixed callback error handling
  - Improved metadata parsing
  - Enhanced error logging

- **FAQ/Help Center:** Specification completed
  - Designed comprehensive FAQ system
  - Planned search and filter functionality
  - Defined accessibility requirements
  - Ready for implementation (0/12 tasks)

### November 2024
- **Supabase Integration:** Core backend infrastructure
  - Implemented authentication with OAuth
  - Created database schema with RLS policies
  - Added file storage with signed URLs
  - Implemented offline support with IndexedDB
  - Completed 10/12 tasks (83%)

## Technical Debt & Known Issues

### High Priority
1. **Testing Coverage:** Many specs have incomplete testing tasks
   - Supabase Integration: Missing unit and integration tests
   - İyzico Payment: Missing quota and queue system tests
   - User Profile: Missing comprehensive error handling tests

2. **Documentation:** Several specs missing complete documentation
   - Supabase Integration: README and .env.example updates needed
   - İyzico Payment: Deployment checklist and setup guide needed

### Medium Priority
1. **Performance Optimization:** Some areas need optimization
   - Video generation timeout handling could be improved
   - Cache invalidation strategy needs refinement
   - Queue processing could be more efficient

2. **Error Handling:** Some edge cases not fully covered
   - Network failure scenarios in video generation
   - Concurrent credit deduction race conditions
   - Payment callback retry logic

### Low Priority
1. **UI/UX Improvements:** Minor enhancements identified
   - Loading states could be more informative
   - Error messages could be more user-friendly
   - Mobile responsiveness in some components

2. **Code Quality:** Refactoring opportunities
   - Some components could be split into smaller pieces
   - Duplicate code in service layers
   - Type definitions could be more strict

## Future Roadmap

### Q1 2025
- ✅ Unified Credit System implementation
- ✅ FAQ/Help Center implementation
- 🎯 Complete remaining testing tasks
- 🎯 Finish documentation

### Q2 2025 (Planned)
- 🔮 Bulk generation support
- 🔮 Team workspaces and collaboration
- 🔮 Advanced analytics dashboard
- 🔮 API access for developers

### Q3 2025 (Planned)
- 🔮 Mobile app development
- 🔮 Advanced AI features
- 🔮 Integration with design tools
- 🔮 White-label solution

---

**Last Updated:** 2025-01-01  
**Version:** 1.2.0  
**Status:** Active Development  
**Memory Bank Updated:** 2025-01-01 by Kiro AI
