# Design Document

## Overview

This design document outlines the technical architecture for integrating Supabase into MockupSuite. The integration will provide authentication, database storage, and file storage capabilities while maintaining the existing user experience and adding multi-device synchronization.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth UI    │  │  App Logic   │  │  Components  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │           Supabase Service Layer                    │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │    │
│  │  │   Auth   │  │ Database │  │ Storage  │         │    │
│  │  │ Service  │  │ Service  │  │ Service  │         │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘         │    │
│  └───────┼─────────────┼─────────────┼───────────────┘    │
└──────────┼─────────────┼─────────────┼────────────────────┘
           │             │             │
           ▼             ▼             ▼
    ┌──────────────────────────────────────┐
    │         Supabase Backend             │
    │  ┌──────────┐  ┌──────────┐  ┌────┐ │
    │  │   Auth   │  │ Postgres │  │ S3 │ │
    │  └──────────┘  └──────────┘  └────┘ │
    └──────────────────────────────────────┘
```

### Technology Stack Updates

- **Supabase Client**: @supabase/supabase-js (latest)
- **Authentication**: Supabase Auth with email/password and OAuth providers
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage (S3-compatible)
- **Real-time**: Supabase Realtime for live updates (future enhancement)

## Components and Interfaces

### 1. Supabase Client Configuration

**File**: `services/supabaseClient.ts`

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
```

### 2. Authentication Service

**File**: `services/authService.ts`

```typescript
interface AuthService {
  signUp(email: string, password: string): Promise<User>;
  signIn(email: string, password: string): Promise<User>;
  signInWithProvider(provider: 'google' | 'github'): Promise<User>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}
```

**Key Methods**:
- `signUp`: Create new user account
- `signIn`: Authenticate existing user
- `signInWithProvider`: OAuth authentication
- `signOut`: End user session
- `resetPassword`: Send password reset email
- `getCurrentUser`: Get current authenticated user
- `onAuthStateChange`: Subscribe to auth state changes

### 3. Database Service

**File**: `services/databaseService.ts`

```typescript
interface DatabaseService {
  // Projects
  getProjects(userId: string): Promise<Project[]>;
  createProject(userId: string, project: Omit<Project, 'id'>): Promise<Project>;
  updateProject(projectId: string, updates: Partial<Project>): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;
  
  // Brand Kit
  getBrandKit(userId: string): Promise<BrandKit | null>;
  saveBrandKit(userId: string, brandKit: BrandKit): Promise<BrandKit>;
  
  // Prompt Templates
  getPromptTemplates(userId: string): Promise<PromptTemplate[]>;
  savePromptTemplate(userId: string, template: PromptTemplate): Promise<PromptTemplate>;
  deletePromptTemplate(templateId: string): Promise<void>;
  
  // Saved Mockups
  getSavedMockups(projectId: string): Promise<SavedMockup[]>;
  saveMockup(projectId: string, mockup: SavedMockup): Promise<SavedMockup>;
  deleteMockup(mockupId: string): Promise<void>;
}
```

### 4. Storage Service

**File**: `services/storageService.ts`

```typescript
interface StorageService {
  uploadImage(userId: string, file: File, folder: 'uploads' | 'mockups' | 'logos'): Promise<string>;
  getImageUrl(path: string): Promise<string>;
  deleteImage(path: string): Promise<void>;
  uploadBase64Image(userId: string, base64: string, fileName: string, folder: string): Promise<string>;
}
```

**Storage Structure**:
```
user-files/
├── {userId}/
│   ├── uploads/        # User uploaded product images
│   ├── mockups/        # Generated mockup images
│   └── logos/          # Brand kit logos
```

### 5. Migration Service

**File**: `services/migrationService.ts`

```typescript
interface MigrationService {
  hasLocalStorageData(): boolean;
  migrateToSupabase(userId: string): Promise<MigrationResult>;
  clearLocalStorage(): void;
}

interface MigrationResult {
  success: boolean;
  projectsMigrated: number;
  mockupsMigrated: number;
  errors: string[];
}
```

### 6. Sync Service (Offline Support)

**File**: `services/syncService.ts`

```typescript
interface SyncService {
  queueChange(change: PendingChange): void;
  syncPendingChanges(): Promise<SyncResult>;
  isOnline(): boolean;
  onConnectionChange(callback: (online: boolean) => void): () => void;
}

interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'project' | 'mockup' | 'brandKit' | 'template';
  data: any;
  timestamp: number;
}
```

## Data Models

### Database Schema

**Table: profiles**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Table: projects**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt TEXT,
  aspect_ratio TEXT CHECK (aspect_ratio IN ('1:1', '16:9', '9:16')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Table: mockups**
```sql
CREATE TABLE mockups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  thumbnail_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Table: brand_kits**
```sql
CREATE TABLE brand_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logo_path TEXT,
  use_watermark BOOLEAN DEFAULT FALSE,
  colors TEXT[], -- Array of hex color codes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Table: prompt_templates**
```sql
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

All tables will have RLS enabled with the following policies:

```sql
-- Users can only read their own data
CREATE POLICY "Users can view own data" ON {table_name}
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own data
CREATE POLICY "Users can insert own data" ON {table_name}
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own data
CREATE POLICY "Users can update own data" ON {table_name}
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own data
CREATE POLICY "Users can delete own data" ON {table_name}
  FOR DELETE USING (auth.uid() = user_id);
```

### Storage Policies

```sql
-- Users can upload to their own folder
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can read their own files
CREATE POLICY "Users can read own files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## Error Handling

### Error Types

```typescript
enum SupabaseErrorType {
  AUTH_ERROR = 'AUTH_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
}

interface SupabaseError {
  type: SupabaseErrorType;
  message: string;
  originalError?: any;
}
```

### Error Handling Strategy

1. **Authentication Errors**: Redirect to login page, display user-friendly message
2. **Database Errors**: Retry with exponential backoff, fallback to cached data
3. **Storage Errors**: Display upload failure, allow retry
4. **Network Errors**: Queue changes for sync, display offline indicator
5. **Quota Errors**: Display upgrade prompt, prevent further uploads

## Testing Strategy

### Unit Tests

- Test each service method independently
- Mock Supabase client responses
- Test error handling scenarios
- Test data transformation logic

### Integration Tests

- Test authentication flow end-to-end
- Test data persistence and retrieval
- Test file upload and download
- Test migration from localStorage

### E2E Tests

- Test complete user workflows
- Test offline/online transitions
- Test multi-device synchronization
- Test data consistency

## Migration Strategy

### Phase 1: Setup (Week 1)
1. Install Supabase dependencies
2. Configure Supabase client
3. Create database schema
4. Set up storage buckets
5. Configure RLS policies

### Phase 2: Core Services (Week 2)
1. Implement authentication service
2. Implement database service
3. Implement storage service
4. Add error handling

### Phase 3: UI Integration (Week 3)
1. Add authentication UI components
2. Update App.tsx to use Supabase services
3. Replace localStorage calls with database calls
4. Add loading states and error messages

### Phase 4: Migration & Sync (Week 4)
1. Implement migration service
2. Implement sync service for offline support
3. Add migration UI flow
4. Test data migration

### Phase 5: Testing & Optimization (Week 5)
1. Write unit and integration tests
2. Optimize database queries
3. Implement caching strategies
4. Performance testing and optimization

## Performance Considerations

1. **Lazy Loading**: Load images and data on-demand
2. **Pagination**: Implement cursor-based pagination for large datasets
3. **Caching**: Cache frequently accessed data in memory
4. **Thumbnails**: Generate and store thumbnail versions of images
5. **Batch Operations**: Batch multiple database operations when possible
6. **Connection Pooling**: Reuse Supabase client connections
7. **Signed URLs**: Cache signed URLs until expiration

## Security Considerations

1. **Never expose service role key** in client-side code
2. **Use RLS policies** for all database access
3. **Validate file types** before upload
4. **Limit file sizes** to prevent abuse
5. **Sanitize user inputs** before database operations
6. **Use HTTPS** for all API calls
7. **Implement rate limiting** for API endpoints
8. **Regular security audits** of RLS policies
