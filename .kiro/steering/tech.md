# Tech Stack

## Core Technologies

- **Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 6.2.0
- **Backend**: Supabase (PostgreSQL database, authentication, storage)
- **AI Integration**: Google Generative AI SDK (@google/genai)
- **Styling**: Tailwind CSS (via utility classes)
- **State Management**: React hooks (useState, useCallback, useEffect)
- **Storage**: Supabase Storage for images, IndexedDB for offline queue
- **Caching**: In-memory cache with 5-minute TTL

## Project Configuration

- **TypeScript**: ES2022 target, JSX transform, path aliases (@/*)
- **Vite**: Dev server on port 3000, environment variable injection
- **Environment Variables**: 
  - `GEMINI_API_KEY` - Required for AI image generation
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Common Commands

```bash
# Install dependencies
npm install

# Run development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

## API Integration

### AI Services
- Uses Gemini 2.5 Flash for image generation
- Gemini 2.5 Flash Image for mockup generation with image input
- Structured JSON output for prompt suggestions
- Base64 image encoding for API requests

### Supabase Services

#### Authentication
- Email/password authentication
- OAuth providers (Google, GitHub)
- Session management with automatic refresh
- Password reset functionality
- Auth state change listeners

#### Database (PostgreSQL)
- **Tables**: projects, mockups, brand_kits, prompt_templates
- **Row Level Security (RLS)**: All tables protected by user_id policies
- **Relationships**: Projects → Mockups (one-to-many)
- **Pagination**: Cursor-based pagination for large datasets (20 items per page)
- **Caching**: In-memory cache for frequently accessed data (5-minute TTL)

#### Storage
- **Bucket**: `user-files` with public read access
- **Folders**: `uploads/`, `mockups/`, `logos/`
- **File Types**: JPEG, PNG, WebP, GIF (max 10MB)
- **Thumbnails**: Auto-generated 300x300px thumbnails for gallery views
- **Signed URLs**: 1-hour expiration with 5-minute cache buffer

#### Offline Support
- **Queue**: IndexedDB-based queue for offline operations
- **Sync**: Automatic sync on reconnection
- **Conflict Resolution**: Last-write-wins strategy
- **Status Indicator**: Real-time connection status display

## Authentication Patterns

```typescript
// Sign in with email/password
import { authService } from './services/authService';
const user = await authService.signIn(email, password);

// Sign in with OAuth
await authService.signInWithProvider('google');

// Get current user
const user = await authService.getCurrentUser();

// Sign out (clears cache automatically)
await authService.signOut();

// Listen to auth state changes
const unsubscribe = authService.onAuthStateChange((user) => {
  if (user) {
    // User signed in
  } else {
    // User signed out
  }
});
```

## Database Query Patterns

```typescript
import * as db from './services/databaseService';

// Get projects (cached)
const projects = await db.getProjects(userId);

// Get paginated mockups
const { mockups, hasMore, nextCursor } = await db.getSavedMockupsPaginated(
  userId,
  20, // limit
  cursor // optional cursor for next page
);

// Create project (invalidates cache)
const project = await db.createProject(userId, projectData);

// Update project (invalidates cache if userId provided)
const updated = await db.updateProject(projectId, updates, userId);

// Get brand kit (cached)
const brandKit = await db.getBrandKit(userId);
```

## Storage Patterns

```typescript
import * as storage from './services/storageService';

// Upload image with thumbnail
const { imagePath, thumbnailPath } = await storage.uploadImageWithThumbnail(
  userId,
  file,
  'mockups'
);

// Get signed URL (cached for 55 minutes)
const url = await storage.getImageUrl(imagePath);

// Delete image
await storage.deleteImage(imagePath);
```

## Cache Management

```typescript
import { cacheService } from './services/cacheService';

// Cache is automatically managed by database service
// Manual cache operations:

// Invalidate specific cache
cacheService.invalidateProjects(userId);
cacheService.invalidateBrandKit(userId);

// Clear all cache for a user
cacheService.clearUserCache(userId);

// Clear all cache
cacheService.clearAll();
```

## Error Handling

```typescript
import { handleSupabaseError, isNetworkError } from './services/errorHandler';

try {
  await db.createProject(userId, projectData);
} catch (error) {
  const handled = handleSupabaseError(error);
  
  if (isNetworkError(handled)) {
    // Queue for offline sync
    await syncService.queueChange('create', 'projects', projectData);
  } else {
    // Show error to user
    showErrorToast(handled.userMessage);
  }
}
```
