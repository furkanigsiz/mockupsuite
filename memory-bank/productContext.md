# Product Context

## Why This Project Exists

MockupSuite helps creators and businesses generate professional product mockups without expensive photoshoots or design skills. The Supabase integration addresses critical limitations of the current localStorage-based approach:

### Problems Being Solved

1. **Data Loss Risk**: localStorage data can be cleared by browsers, causing users to lose their work
2. **Single Device Limitation**: Users can't access their mockups from different devices
3. **No User Accounts**: No way to identify or authenticate users
4. **Scalability Issues**: localStorage has size limits (~5-10MB)
5. **No Collaboration**: Users can't share projects or work together
6. **Security Concerns**: No access control or data privacy

## How It Should Work

### User Experience Flow

#### New User Journey
1. User visits MockupSuite landing page
2. Clicks "Get Started" and sees authentication options
3. Signs up with email/password or social login (Google/GitHub)
4. Immediately starts creating mockups
5. All work automatically saves to cloud
6. Can access from any device by logging in

#### Existing User Journey (Migration)
1. User with localStorage data logs in for first time
2. System detects existing data and prompts migration
3. User confirms migration
4. All projects, mockups, and settings transfer to Supabase
5. localStorage cleared after successful migration
6. User continues working seamlessly

#### Daily Usage
1. User logs in from any device
2. Sees all their projects and mockups
3. Creates new mockups (uploads images, generates with AI)
4. Works offline if needed (changes queue for sync)
5. Changes sync automatically when back online
6. Logs out securely

### Key Features

#### Authentication
- Email/password signup and login
- Social login (Google, GitHub)
- Password reset via email
- Secure session management
- Auto-logout on session expiry

#### Data Management
- Projects organized by user
- Brand kit (logo, colors) per user
- Reusable prompt templates
- Saved mockups with thumbnails
- Automatic cloud sync

#### File Storage
- Uploaded product images
- Generated mockup images
- Brand logos for watermarks
- Organized by user folders
- Secure signed URLs (1-hour expiry)

#### Offline Support
- Continue working without internet
- Changes queued locally (IndexedDB)
- Auto-sync when reconnected
- Conflict resolution (latest wins)
- Visual offline indicator

## User Experience Goals

### Performance
- Fast initial load (<2 seconds)
- Smooth image gallery scrolling
- Quick authentication (<1 second)
- Responsive UI during uploads
- Progress indicators for long operations

### Reliability
- No data loss
- Graceful error handling
- Automatic retry on failures
- Clear error messages
- Rollback on migration failures

### Security
- Private data (only user can access)
- Secure file storage
- Protected API endpoints
- No exposed secrets
- HTTPS everywhere

### Usability
- Seamless migration (no manual steps)
- Intuitive authentication UI
- Clear loading states
- Helpful error messages
- Multi-language support maintained
