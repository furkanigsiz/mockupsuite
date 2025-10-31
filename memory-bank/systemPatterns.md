# System Patterns

## Architecture Overview

### Service Layer Pattern

The application uses a clean service layer architecture to separate concerns:

```
React Components (UI)
    ↓
Service Layer (Business Logic)
    ↓
Supabase Client (Data Access)
    ↓
Supabase Backend (Database/Storage/Auth)
```

### Key Services

1. **supabaseClient.ts**: Singleton Supabase client instance
2. **authService.ts**: Authentication operations
3. **databaseService.ts**: Database CRUD operations
4. **storageService.ts**: File upload/download operations
5. **migrationService.ts**: localStorage to Supabase migration
6. **syncService.ts**: Offline queue and sync management
7. **paymentService.ts**: İyzico payment gateway integration
8. **subscriptionService.ts**: Subscription plan management
9. **creditService.ts**: Credit balance and transactions
10. **queueManagerService.ts**: Priority queue for image generation
11. **watermarkService.ts**: Watermark application for free tier users

## Payment System Architecture

### İyzico Integration Pattern

**Payment Flow**:
```
User selects plan
  ↓
PaymentCheckout component
  ↓
paymentService.initializePayment()
  ↓
Edge Function (iyzico-payment)
  ↓
İyzico API (checkout form)
  ↓
User completes payment
  ↓
İyzico callback
  ↓
Edge Function verifies payment
  ↓
Update subscription/credits
  ↓
Redirect to success page
```

**Edge Function Pattern**:
- Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS
- Handles both 'initialize' and 'verify' actions
- Implements HMAC-SHA256 signature for İyzico API
- Always includes error handling with .select() verification
- Sets expires_at in all subscription updates

**Subscription Update Pattern**:
```typescript
const { data, error } = await supabase
  .from('subscriptions')
  .update({
    plan_id: planId,
    status: 'active',
    remaining_quota: quota,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    expires_at: periodEnd.toISOString(), // CRITICAL: Always set
    updated_at: now.toISOString(),
  })
  .eq('user_id', userId)
  .select(); // CRITICAL: Verify success

if (error) {
  console.error('Update error:', error);
  throw new Error(`Failed to update: ${error.message}`);
}
```

**Render Queue Insert Pattern**:
```typescript
// CRITICAL: Supabase schema has BOTH separate columns AND JSONB columns
// Must populate BOTH to satisfy NOT NULL constraints
const insertData = {
  user_id: request.userId,
  project_id: request.projectId,
  priority,
  status: 'pending',
  // Separate columns (for queries and constraints)
  prompt: request.prompt.trim(),           // text, NOT NULL
  input_images: request.images,            // text[], NOT NULL
  aspect_ratio: request.aspectRatio || '1:1', // text, default '1:1'
  // JSONB columns (for flexible data storage)
  request_data: {
    prompt: request.prompt.trim(),
    images: request.images,
    aspectRatio: request.aspectRatio,
  },
};

const { data, error } = await supabase
  .from('render_queue')
  .insert(insertData)
  .select()
  .single();

if (error) {
  console.error('Queue insert error:', error);
  throw new Error(`Failed to add to queue: ${error.message}`);
}
```

**QuotaWidget Integration Pattern**:
```typescript
// In AppHeader component
const [showQuotaDetails, setShowQuotaDetails] = useState(false);
const [quotaRefreshTrigger, setQuotaRefreshTrigger] = useState(0);

// Compact button view
<button onClick={() => setShowQuotaDetails(!showQuotaDetails)}>
  <QuotaIcon />
  <span>Quota</span>
</button>

// Expanded dropdown
{showQuotaDetails && (
  <div className="dropdown">
    <QuotaWidget 
      onUpgradeClick={handleUpgrade}
      refreshTrigger={quotaRefreshTrigger}
    />
  </div>
)}

// Trigger refresh after generation
await generateMockup(...);
await decrementQuota(userId, 1);
setQuotaRefreshTrigger(prev => prev + 1); // Triggers QuotaWidget refresh
```

## Critical Technical Decisions

### 1. Authentication Strategy

**Decision**: Use Supabase Auth with email/password + OAuth
**Rationale**: 
- Built-in security best practices
- Easy OAuth integration
- Session management handled
- Password reset flows included

**Implementation**:
- AuthProvider context wraps entire app
- ProtectedRoute component guards authenticated routes
- onAuthStateChange listener updates UI on auth changes

### 2. Data Storage Strategy

**Decision**: PostgreSQL with Row Level Security (RLS)
**Rationale**:
- Automatic user data isolation
- SQL flexibility for complex queries
- Built-in relationships and constraints
- Scalable for future growth

**Schema Design**:
- `profiles`: User metadata
- `projects`: User projects with settings
- `mockups`: Generated images linked to projects
- `brand_kits`: User brand assets (one per user)
- `prompt_templates`: Reusable prompts per user

### 3. File Storage Strategy

**Decision**: Supabase Storage with user-specific folders
**Rationale**:
- S3-compatible storage
- Automatic CDN distribution
- Signed URLs for security
- Integrated with RLS policies

**Structure**:
```
user-files/
  {userId}/
    uploads/     # Original product images
    mockups/     # Generated mockup images
    logos/       # Brand kit logos
```

### 4. Offline Support Strategy

**Decision**: IndexedDB queue + sync on reconnection
**Rationale**:
- IndexedDB survives page refreshes
- Can store large amounts of data
- Async API fits React patterns
- Browser-native solution

**Flow**:
1. Detect offline state
2. Queue changes in IndexedDB
3. Show offline indicator
4. On reconnection, sync queued changes
5. Handle conflicts (latest wins)

### 5. Migration Strategy

**Decision**: One-time migration on first login
**Rationale**:
- User controls when migration happens
- Can retry on failure
- Preserves localStorage as backup
- Clear success/failure feedback

**Process**:
1. Check for localStorage data
2. Prompt user to migrate
3. Upload images to storage
4. Create database records
5. Clear localStorage on success
6. Show confirmation

## Design Patterns in Use

### 1. Service Pattern
All external interactions go through service modules:
- Centralized error handling
- Consistent API interfaces
- Easy to mock for testing
- Single source of truth

### 2. Context Pattern
React Context for global state:
- AuthProvider: User authentication state
- LanguageProvider: i18n translations
- Future: ThemeProvider, NotificationProvider

### 3. Hook Pattern
Custom hooks for reusable logic:
- `useTranslations`: i18n support
- Future: `useAuth`, `useDatabase`, `useStorage`

### 4. Repository Pattern
Database service acts as repository:
- Abstracts database operations
- Consistent CRUD interfaces
- Easy to swap implementations
- Testable with mocks

### 5. Observer Pattern
Event listeners for state changes:
- `onAuthStateChange`: Auth state updates
- `onConnectionChange`: Online/offline status
- Future: Real-time subscriptions

## Component Relationships

### Authentication Flow
```
App.tsx
  ↓
AuthProvider (context)
  ↓
ProtectedRoute (guard)
  ↓
Main App Components
```

### Data Flow
```
Component
  ↓
Service Method
  ↓
Supabase Client
  ↓
Supabase Backend
  ↓
Response
  ↓
Component State Update
```

### File Upload Flow
```
User selects file
  ↓
Component validates file
  ↓
storageService.uploadImage()
  ↓
Supabase Storage
  ↓
Returns file path
  ↓
databaseService.saveMockup()
  ↓
Database record created
  ↓
Component updates UI
```

## Critical Implementation Paths

### 1. User Authentication
```typescript
// Sign up
authService.signUp(email, password)
  → Supabase creates user
  → Profile record created (trigger)
  → Session established
  → User redirected to app

// Sign in
authService.signIn(email, password)
  → Supabase validates credentials
  → Session established
  → Check for localStorage data
  → Prompt migration if needed
  → Load user data
```

### 2. Project Creation
```typescript
// Create project
databaseService.createProject(userId, projectData)
  → Validate user is authenticated
  → Insert into projects table
  → RLS policy checks user_id
  → Return created project
  → Update component state
```

### 3. Image Upload & Mockup Generation
```typescript
// Upload and generate
1. User uploads image
   → storageService.uploadImage(userId, file, 'uploads')
   → File stored in user-files/{userId}/uploads/
   → Returns storage path

2. Generate mockup with Gemini
   → geminiService.generateMockup(prompt, image)
   → Returns base64 image

3. Save generated mockup
   → storageService.uploadBase64Image(userId, base64, 'mockups')
   → File stored in user-files/{userId}/mockups/
   → databaseService.saveMockup(projectId, imagePath)
   → Database record created
```

### 4. Offline Operation
```typescript
// User makes change while offline
1. Detect offline state
   → syncService.isOnline() returns false

2. Queue change
   → syncService.queueChange({
       type: 'create',
       entity: 'project',
       data: projectData
     })
   → Stored in IndexedDB

3. Show offline indicator
   → OfflineIndicator component displays

4. User reconnects
   → onConnectionChange fires
   → syncService.syncPendingChanges()
   → Process queued changes
   → Update UI on success
```

## Error Handling Patterns

### Service-Level Errors
```typescript
try {
  const result = await supabase.from('projects').select();
  if (result.error) throw result.error;
  return result.data;
} catch (error) {
  throw new SupabaseError({
    type: SupabaseErrorType.DATABASE_ERROR,
    message: 'Failed to fetch projects',
    originalError: error
  });
}
```

### Component-Level Errors
```typescript
try {
  await databaseService.createProject(userId, data);
  setSuccess(true);
} catch (error) {
  if (error instanceof SupabaseError) {
    setError(error.message);
  } else {
    setError('An unexpected error occurred');
  }
}
```

### Retry Logic
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}
```

## Security Patterns

### Row Level Security (RLS)
Every table has policies ensuring users can only access their own data:
```sql
CREATE POLICY "Users can view own data" ON projects
  FOR SELECT USING (auth.uid() = user_id);
```

### Storage Security
Files organized by user ID with policies:
```sql
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-files' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

### API Key Management
- Anon key: Safe for client-side use
- Service role: NEVER exposed to client
- Environment variables for configuration
- Vite injects at build time

## Performance Patterns

### Pagination
```typescript
const { data, error } = await supabase
  .from('mockups')
  .select('*')
  .range(0, 19) // First 20 items
  .order('created_at', { ascending: false });
```

### Caching
```typescript
const cache = new Map<string, { data: any; timestamp: number }>();

function getCached<T>(key: string, ttl: number): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}
```

### Lazy Loading
```typescript
// Load images as user scrolls
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadImage(entry.target);
    }
  });
});
```
