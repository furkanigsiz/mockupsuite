# Design Document

## Overview

The User Profile Page is a comprehensive interface that allows users to manage their account information, view subscription details, and access their generated content. The design integrates seamlessly with the existing MockupSuite application architecture, utilizing the current StaggeredMenu navigation system and maintaining consistency with the dark mode design language.

## Architecture

### Component Hierarchy

```
App.tsx
├── StaggeredMenu (existing)
│   └── Profile menu item (new)
├── UnifiedHeader (existing)
│   └── Profile icon (enhanced with navigation)
└── ProfilePage (new)
    ├── ProfileSidebar
    │   ├── UserProfileHeader
    │   ├── NavigationMenu
    │   └── SignOutButton
    └── ProfileContent
        ├── ProfileDetailsSection
        │   ├── ProfileHeader
        │   │   ├── AvatarDisplay
        │   │   └── UploadAvatarButton
        │   └── PersonalInfoForm
        │       ├── FirstNameInput
        │       ├── LastNameInput
        │       ├── EmailInput (read-only)
        │       └── FormActions
        └── SubscriptionSection
            ├── CurrentPlanDisplay
            ├── QuotaDisplay
            └── ManageSubscriptionButton
```

### State Management

The ProfilePage component will manage the following state:

```typescript
interface ProfilePageState {
  // User profile data
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  
  // Form state
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  
  // Loading states
  isLoadingProfile: boolean;
  isUploadingAvatar: boolean;
  isSavingProfile: boolean;
  
  // Subscription data
  subscription: UserSubscription | null;
  quotaInfo: QuotaInfo | null;
  
  // UI state
  activeSection: 'profile' | 'settings' | 'security' | 'subscription' | 'generations';
  showUpgradeModal: boolean;
  error: string | null;
  successMessage: string | null;
}
```

## Components and Interfaces

### 1. ProfilePage Component

**Purpose**: Main container component for the profile page

**Props**:
```typescript
interface ProfilePageProps {
  // No props needed - uses AuthProvider context
}
```

**Responsibilities**:
- Fetch user profile data on mount
- Manage profile state and updates
- Handle navigation between sections
- Coordinate with AuthProvider and database services

### 2. ProfileSidebar Component

**Purpose**: Left sidebar navigation for profile sections

**Props**:
```typescript
interface ProfileSidebarProps {
  user: User;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onSignOut: () => void;
}
```

**Design**:
- Fixed width: 256px (w-64)
- Background: bg-background-light dark:bg-background-dark
- Border: border-r border-slate-200/10
- Padding: p-4

**Navigation Items**:
```typescript
const navigationItems = [
  { id: 'profile', label: 'Profile Details', icon: 'person' },
  { id: 'settings', label: 'Account Settings', icon: 'settings' },
  { id: 'security', label: 'Security', icon: 'lock' },
  { id: 'subscription', label: 'Subscription', icon: 'credit_card' },
  { id: 'generations', label: 'My Generations', icon: 'photo_library' },
];
```

### 3. ProfileHeader Component

**Purpose**: Display user avatar and upload functionality

**Props**:
```typescript
interface ProfileHeaderProps {
  avatarUrl: string | null;
  userName: string;
  userEmail: string;
  onAvatarUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}
```

**Design**:
- Container: rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10
- Avatar: 96px (w-24 h-24) rounded-full
- Upload button: bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20

### 4. PersonalInfoForm Component

**Purpose**: Form for editing user profile information

**Props**:
```typescript
interface PersonalInfoFormProps {
  firstName: string;
  lastName: string;
  email: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  hasChanges: boolean;
}
```

**Validation Rules**:
- First Name: Required, min 1 character, max 50 characters
- Last Name: Required, min 1 character, max 50 characters
- Email: Read-only (managed by Supabase Auth)

**Design**:
- Container: rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10
- Grid: grid-cols-1 md:grid-cols-2 gap-6
- Input styling: form-input with focus:ring-2 focus:ring-primary/50

### 5. SubscriptionSection Component

**Purpose**: Display current subscription plan and quota information

**Props**:
```typescript
interface SubscriptionSectionProps {
  subscription: UserSubscription | null;
  quotaInfo: QuotaInfo | null;
  onManageSubscription: () => void;
  isLoading: boolean;
}
```

**Design**:
- Container: rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10
- Plan badge: bg-primary/20 text-primary
- Manage button: bg-primary/20 text-primary hover:bg-primary/30

## Data Models

### User Profile Extension

The user profile data will be stored in a new `user_profiles` table:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### TypeScript Interface

```typescript
export interface UserProfile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  avatarPath: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## Service Layer

### profileService.ts

New service for profile-related operations:

```typescript
export async function getUserProfile(userId: string): Promise<UserProfile | null>;
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
export async function uploadAvatar(userId: string, file: File): Promise<string>;
export async function deleteAvatar(userId: string, avatarPath: string): Promise<void>;
```

## Error Handling

### Error Types

```typescript
enum ProfileErrorType {
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  UPDATE_FAILED = 'UPDATE_FAILED',
  AVATAR_UPLOAD_FAILED = 'AVATAR_UPLOAD_FAILED',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  NETWORK_ERROR = 'NETWORK_ERROR',
}
```

### Error Messages

```typescript
const errorMessages = {
  PROFILE_NOT_FOUND: 'Profile not found',
  UPDATE_FAILED: 'Failed to update profile',
  AVATAR_UPLOAD_FAILED: 'Failed to upload avatar',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a JPEG, PNG, or WebP image',
  FILE_TOO_LARGE: 'File size exceeds 5MB limit',
  NETWORK_ERROR: 'Network error. Please check your connection',
};
```

## Testing Strategy

### Unit Tests

1. **ProfilePage Component**
   - Renders correctly with user data
   - Handles form submission
   - Validates input fields
   - Displays error messages

2. **ProfileSidebar Component**
   - Renders navigation items
   - Highlights active section
   - Handles section changes
   - Calls signOut on logout

3. **PersonalInfoForm Component**
   - Validates form inputs
   - Detects unsaved changes
   - Handles save and cancel actions
   - Displays loading states

4. **profileService**
   - Fetches user profile correctly
   - Updates profile successfully
   - Handles upload errors
   - Validates file types and sizes

### Integration Tests

1. **Profile Data Flow**
   - Load profile on page mount
   - Update profile and verify database changes
   - Upload avatar and verify storage

2. **Navigation Integration**
   - Navigate from StaggeredMenu to profile
   - Navigate from UnifiedHeader to profile
   - Navigate between profile sections

3. **Subscription Integration**
   - Display correct subscription data
   - Open upgrade modal on manage click
   - Refresh quota after generation

### E2E Tests

1. **Complete Profile Update Flow**
   - Sign in
   - Navigate to profile
   - Update first and last name
   - Upload new avatar
   - Verify changes persist

2. **Subscription Management Flow**
   - Navigate to profile
   - View subscription details
   - Click manage subscription
   - Verify upgrade modal opens

## Responsive Design

### Breakpoints

- **Mobile** (< 768px):
  - Sidebar hidden by default
  - Hamburger menu to toggle sidebar
  - Form fields stack vertically
  - Buttons expand to full width

- **Tablet** (768px - 1024px):
  - Sidebar visible
  - Two-column form layout
  - Compact spacing

- **Desktop** (> 1024px):
  - Full sidebar visible
  - Two-column form layout
  - Generous spacing

### Mobile Sidebar Behavior

```typescript
// Mobile sidebar state
const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

// Toggle function
const toggleMobileSidebar = () => {
  setIsMobileSidebarOpen(!isMobileSidebarOpen);
};

// Sidebar classes
const sidebarClasses = cn(
  'fixed md:relative inset-y-0 left-0 z-50',
  'transform transition-transform duration-300',
  isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
);
```

## Accessibility

### ARIA Labels

- Profile page: `aria-label="User profile page"`
- Navigation menu: `role="navigation"` with `aria-label="Profile navigation"`
- Form inputs: Proper `label` elements with `htmlFor` attributes
- Buttons: Descriptive `aria-label` attributes
- Avatar upload: `aria-label="Upload profile picture"`

### Keyboard Navigation

- Tab order follows visual flow
- Enter key submits forms
- Escape key cancels editing
- Focus indicators visible on all interactive elements

### Screen Reader Support

- Form validation errors announced
- Loading states announced
- Success messages announced
- Section changes announced

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
   - Profile page loaded only when accessed
   - Avatar images lazy loaded

2. **Caching**
   - Profile data cached in memory
   - Avatar URLs cached with 55-minute TTL

3. **Debouncing**
   - Form input changes debounced (300ms)
   - Avatar upload progress throttled

4. **Image Optimization**
   - Avatar images resized to 256x256px
   - WebP format preferred
   - Compression applied (quality: 85)

## Integration Points

### 1. App.tsx Integration

```typescript
// Add profile route
const [mainView, setMainView] = useState<'generator' | 'gallery' | 'admin' | 'profile'>('generator');

// Render profile page
{mainView === 'profile' && <ProfilePage />}
```

### 2. StaggeredMenu Integration

```typescript
// Add profile menu item
const menuItems: StaggeredMenuItem[] = [
  // ... existing items
  {
    label: 'Profile',
    ariaLabel: 'View profile',
    link: '#',
    onClick: () => setMainView('profile'),
  },
];
```

### 3. UnifiedHeader Integration

```typescript
// Make profile icon clickable
<div
  className="... cursor-pointer"
  onClick={() => setMainView('profile')}
  role="button"
  aria-label="View profile"
  tabIndex={0}
>
  {/* Avatar */}
</div>
```

## Styling Guidelines

### Color Palette

- Primary: `#2bcdee`
- Background Light: `#f6f8f8`
- Background Dark: `#101f22`
- Border Light: `#e5e7eb` (slate-200)
- Border Dark: `rgba(255, 255, 255, 0.1)`

### Typography

- Font Family: Space Grotesk
- Headings: font-bold
- Body: font-normal
- Labels: font-medium

### Spacing

- Section padding: p-6
- Form gap: gap-6
- Button padding: px-4 py-2 (small), px-5 py-3 (medium)

### Border Radius

- Default: rounded-lg (0.5rem)
- Cards: rounded-xl (0.75rem)
- Avatar: rounded-full

## Security Considerations

1. **Authentication**
   - All profile operations require authenticated user
   - User can only access their own profile data

2. **Authorization**
   - RLS policies enforce user-level access
   - Avatar uploads restricted to authenticated users

3. **Input Validation**
   - Client-side validation for immediate feedback
   - Server-side validation for security
   - XSS prevention through proper escaping

4. **File Upload Security**
   - File type validation (JPEG, PNG, WebP only)
   - File size limit (5MB)
   - Virus scanning (if available)
   - Secure storage paths

## Internationalization

The profile page will use the existing `useTranslations` hook for all user-facing text:

```typescript
const { t } = useTranslations();

// Translation keys
const translations = {
  profile_page_title: 'Profile Details',
  profile_first_name: 'First Name',
  profile_last_name: 'Last Name',
  profile_email: 'Email Address',
  profile_upload_avatar: 'Upload new picture',
  profile_save_changes: 'Save Changes',
  profile_cancel: 'Cancel',
  profile_subscription_title: 'Subscription Plan',
  profile_current_plan: 'Current Plan',
  profile_manage_subscription: 'Manage Subscription',
  profile_sign_out: 'Sign Out',
  // ... more keys
};
```

## Migration Strategy

Since this is a new feature, no data migration is required. However, we need to:

1. Create the `user_profiles` table
2. Create a trigger to auto-create profile on user signup
3. Backfill profiles for existing users

```sql
-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Backfill existing users
INSERT INTO user_profiles (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_profiles);
```
