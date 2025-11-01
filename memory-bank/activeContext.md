# Active Context

## Current Work Focus

**Phase**: Video Generation Feature Implementation
**Goal**: Add video generation capabilities using Google's Veo 3 AI model

### Immediate Next Steps

1. ✅ Completed Task 7: VideoGeneratorControls component
   - Created component structure with props interface
   - Implemented image uploader section (reusing ImageUploader)
   - Implemented video prompt input textarea
   - Implemented duration selector (5s, 7s, 10s)
   - Implemented aspect ratio selector (16:9, 9:16, 1:1)
   - Implemented generate button with loading state
2. ⏳ Next: Task 8 - Update App.tsx to support video mode
3. Continue with remaining video generation tasks

## Recent Changes

### Completed
- ✅ Created comprehensive Supabase integration spec
- ✅ Initialized Memory Bank structure
- ✅ Setup Supabase infrastructure and dependencies
- ✅ Created database schema with subscriptions, payments, credits tables
- ✅ Implemented authentication and database services
- ✅ Created İyzico payment system spec (requirements, design, tasks)
- ✅ Implemented payment service with İyzico API integration
- ✅ Implemented subscription service for plan management
- ✅ Implemented credit service for pay-as-you-go purchases
- ✅ Created payment UI components (PlanSelectionModal, PaymentCheckout, QuotaWidget)
- ✅ Deployed edge function for payment processing
- ✅ **CRITICAL BUG FIX**: Fixed expires_at field not being set in subscriptions
  - Updated edge function to include expires_at in subscription updates
  - Updated subscriptionService.createSubscription() to set expires_at
  - Updated subscriptionService.renewSubscription() to set expires_at
  - Added proper error handling and logging
- ✅ **Task 15 COMPLETED**: QuotaWidget Dashboard Integration
  - Integrated QuotaWidget into AppHeader component
  - Added compact button view with click-to-expand dropdown
  - Implemented real-time quota updates after image generation
  - Connected upgrade button to UpgradeModal
  - Widget visible on all pages (persistent in header)
- ✅ **CRITICAL BUG FIX**: Fixed render_queue database constraint violations
  - Problem: `prompt` and `input_images` columns were NULL causing insert failures
  - Root cause: Code only populated JSONB columns, not separate table columns
  - Solution: Updated queueManagerService.addToQueue() to populate both:
    - `prompt` column (text, NOT NULL)
    - `input_images` column (text[], NOT NULL)
    - `aspect_ratio` column (text, default '1:1')
    - `request_data` JSONB column (for backward compatibility)
  - Added validation to ensure prompt is never empty
  - Added debug logging for troubleshooting
- ✅ **VIDEO GENERATION FEATURE**: Started implementation
  - Created video generation spec (requirements, design, tasks)
  - Completed Tasks 1-6: Type definitions, services, database migration, ModeSwitcher
  - **Task 7 COMPLETED**: VideoGeneratorControls component
    - Created component with proper TypeScript interface
    - Reused ImageUploader component with maxImages=1 constraint
    - Implemented video prompt textarea with translations
    - Implemented duration selector (5s, 7s, 10s buttons)
    - Implemented aspect ratio selector (16:9, 9:16, 1:1 buttons)
    - Implemented generate button with loading state and validation
    - Component follows existing patterns from GeneratorControls
    - No test framework configured, skipped unit tests subtask

### In Progress
- 🔄 Task 8: Update App.tsx to support video mode
- 🔄 Continuing with video generation feature implementation

## Active Decisions and Considerations

### Architecture Decisions

1. **Service Layer Pattern**
   - All Supabase interactions go through service modules
   - Keeps components clean and testable
   - Easy to mock for testing
   - Consistent error handling

2. **Authentication Strategy**
   - Using Supabase Auth (email/password + OAuth)
   - AuthProvider context wraps entire app
   - ProtectedRoute component guards authenticated routes
   - Session management handled by Supabase

3. **Data Storage Strategy**
   - PostgreSQL with Row Level Security (RLS)
   - User-specific data isolation
   - Relationships between tables (projects → mockups)
   - One brand_kit per user (UNIQUE constraint)

4. **File Storage Strategy**
   - Supabase Storage with user-specific folders
   - Structure: `user-files/{userId}/{uploads|mockups|logos}/`
   - Signed URLs with 1-hour expiry
   - Storage policies enforce user access

5. **Migration Strategy**
   - One-time migration on first login
   - User prompted to migrate localStorage data
   - Can retry on failure
   - localStorage cleared only after success

6. **Offline Support Strategy**
   - IndexedDB for queuing changes
   - Sync on reconnection
   - Conflict resolution (latest wins)
   - Visual offline indicator

### Technical Considerations

1. **Environment Variables**
   - SUPABASE_URL and SUPABASE_ANON_KEY must be added
   - Vite config needs update to inject these
   - Never expose service role key in client

2. **Type Safety**
   - Need to define Supabase database types
   - Service methods should have proper return types
   - Error types for consistent error handling

3. **Error Handling**
   - Create SupabaseError type
   - Categorize errors (auth, database, storage, network)
   - Implement retry logic with exponential backoff
   - User-friendly error messages in translations

4. **Performance**
   - Implement pagination (20 items per page)
   - Cache frequently accessed data
   - Use thumbnails for gallery views
   - Lazy load images

## Important Patterns and Preferences

### Code Organization
- Services in `services/` directory
- Each service has single responsibility
- Export service object with methods
- Import supabase client from supabaseClient.ts

### Error Handling Pattern
```typescript
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  return data;
} catch (error) {
  throw new SupabaseError({
    type: SupabaseErrorType.DATABASE_ERROR,
    message: 'User-friendly message',
    originalError: error
  });
}
```

### Service Method Pattern
```typescript
export const serviceName = {
  async methodName(params) {
    // Validate inputs
    // Call Supabase
    // Handle errors
    // Return data
  }
};
```

### Component Integration Pattern
```typescript
// In component
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  async function fetchData() {
    setLoading(true);
    try {
      const result = await databaseService.getData(userId);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, [userId]);
```

## Learnings and Project Insights

### Video Generation Feature Patterns

1. **Component Reusability**
   - Successfully reused ImageUploader component for video source image
   - Passed maxImages=1 to limit to single image selection
   - Converted array to single image in VideoGeneratorControls
   - Pattern: `const handleImageChange = (images: UploadedImage[]) => onSourceImageChange(images.length > 0 ? images[0] : null);`

2. **Translation Keys**
   - Added video-specific translation keys following existing patterns:
     - `video_prompt_title`, `video_prompt_placeholder`
     - `video_duration_label`, `video_aspect_ratio_label`
     - `generate_video_button`, `generate_video_button_loading`
   - Keys need to be added to all locale files (en.ts, tr.ts, es.ts)

3. **Component Structure**
   - Followed GeneratorControls.tsx patterns for consistency
   - Used same styling classes for buttons and inputs
   - Maintained same layout structure (gap-8 flex column)
   - Duration/aspect ratio selectors use grid-cols-3 layout

4. **Testing Approach**
   - Project has no test framework configured (no Jest, Vitest, etc.)
   - No existing test files in codebase
   - Skipped unit tests subtask as per guidelines
   - Future: Consider adding test framework for comprehensive testing

### Supabase Best Practices

1. **Row Level Security (RLS)**
   - MUST enable RLS on all tables
   - Create policies for each operation (SELECT, INSERT, UPDATE, DELETE)
   - Use `auth.uid()` to match user_id
   - Test policies thoroughly

2. **Storage Policies**
   - Similar to RLS but for files
   - Use `storage.foldername(name)` to extract folder path
   - Enforce user-specific access
   - Set file size limits

3. **Signed URLs**
   - Required for private storage buckets
   - Set appropriate expiry time (1 hour recommended)
   - Cache URLs to minimize API calls
   - Refresh before expiry

4. **Database Design**
   - Use UUID for primary keys
   - Add created_at and updated_at timestamps
   - Use foreign keys with ON DELETE CASCADE
   - Add indexes for frequently queried columns
   - **CRITICAL**: Always set nullable timestamp fields (like expires_at) in ALL update operations

### Payment System Learnings

1. **İyzico Integration**
   - Edge functions must use SUPABASE_SERVICE_ROLE_KEY to bypass RLS
   - Always add error handling with `.select()` after updates to catch failures
   - Console.log in edge functions helps debugging but may not show in basic logs
   - Payment callbacks must verify payment status before updating subscriptions

2. **Subscription Management**
   - expires_at field MUST be set in all subscription operations:
     - createSubscription()
     - renewSubscription()
     - Edge function payment verification
   - Always use `.select()` after update/insert to verify success
   - Set expires_at = current_period_end for consistency

3. **Render Queue System**
   - Supabase schema uses BOTH separate columns AND JSONB columns:
     - Separate columns: `prompt`, `input_images`, `aspect_ratio` (for queries/constraints)
     - JSONB columns: `request_data`, `result_data` (for flexible data storage)
   - MUST populate both types when inserting:
     ```typescript
     {
       prompt: request.prompt.trim(),           // Separate column
       input_images: request.images,            // Separate column
       aspect_ratio: request.aspectRatio,       // Separate column
       request_data: {                          // JSONB column
         prompt: request.prompt.trim(),
         images: request.images,
         aspectRatio: request.aspectRatio,
       }
     }
     ```
   - Always validate prompt is not empty before adding to queue
   - Use MCP Supabase tools to inspect actual database schema

4. **Common Pitfalls**
   - Forgetting to set nullable fields in update operations
   - Not checking for errors after database operations
   - Assuming updates succeed without verification
   - Multiple code paths updating same data without consistency
   - **NEW**: Only populating JSONB columns when separate columns also exist with NOT NULL constraints
   - **NEW**: Not checking actual database schema before implementing insert/update logic

### React + Supabase Integration

1. **Context for Auth**
   - AuthProvider wraps app
   - Provides user, loading, auth methods
   - Listens to auth state changes
   - Updates UI automatically

2. **Protected Routes**
   - Check auth state before rendering
   - Redirect to login if not authenticated
   - Show loading state during check

3. **Data Fetching**
   - Use useEffect for initial load
   - Show loading states
   - Handle errors gracefully
   - Update state on success

4. **File Uploads**
   - Validate file type and size
   - Show upload progress
   - Upload to storage first
   - Then create database record
   - Handle failures at each step

### Migration Considerations

1. **localStorage Data Structure**
   - Projects array with nested data
   - Brand kit object
   - Prompt templates array
   - Need to transform for Supabase

2. **Image Migration**
   - localStorage stores base64 strings
   - Need to convert to files
   - Upload to Supabase Storage
   - Update references to storage paths

3. **User Experience**
   - Prompt user before migration
   - Show progress during migration
   - Confirm success
   - Allow retry on failure
   - Keep localStorage as backup until success

## Current Blockers

None - Video generation feature progressing smoothly:
- ✅ VideoGeneratorControls component created
- ✅ Component follows existing patterns
- ⏳ Need to integrate into App.tsx next

## Questions to Resolve

1. Should we implement real-time subscriptions for live updates? (Future enhancement)
2. What should be the file size limit for uploads? (Proposed: 10MB)
3. Should we implement thumbnail generation on client or server? (Proposed: Client-side)
4. How long should signed URLs be valid? (Proposed: 1 hour)
5. Should we implement account deletion feature? (Proposed: Yes, in future)

## Next Session Preparation

When starting next session:
1. Read ALL Memory Bank files
2. Check progress.md for current status
3. Review activeContext.md for current focus
4. Continue with Task 1 or next incomplete task
5. Update Memory Bank after significant changes
