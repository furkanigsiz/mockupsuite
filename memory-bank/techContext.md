# Tech Context

## Technologies Used

### Core Stack
- **React**: 19.2.0 - UI framework
- **TypeScript**: 5.8.2 - Type safety
- **Vite**: 6.2.0 - Build tool and dev server
- **Tailwind CSS**: Utility-first styling (via classes)

### AI Integration
- **@google/genai**: 1.28.0 - Google Gemini AI SDK
- **Models Used**:
  - `gemini-2.5-flash-image`: Image generation with image input
  - `gemini-2.5-flash`: Text generation and prompt suggestions

### Supabase Integration (New)
- **@supabase/supabase-js**: Latest - Supabase client library
- **Services**:
  - Supabase Auth: User authentication
  - Supabase Database: PostgreSQL with RLS
  - Supabase Storage: S3-compatible file storage

### Development Tools
- **@types/node**: 22.14.0 - Node.js type definitions
- **@vitejs/plugin-react**: 5.0.0 - React plugin for Vite

## Development Setup

### Prerequisites
- Node.js (latest LTS recommended)
- npm or yarn package manager
- Supabase account and project

### Environment Variables

Create `.env.local` file:
```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase
SUPABASE_URL=https://wjliqsmzsyfmiohwfonc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Installation
```bash
# Install dependencies
npm install

# Install Supabase client (new)
npm install @supabase/supabase-js
```

### Running the Application
```bash
# Development server (localhost:3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Technical Constraints

### Browser Compatibility
- Modern browsers with ES2022 support
- IndexedDB support required (for offline sync)
- localStorage support required (for migration)
- Intersection Observer API (for lazy loading)

### API Limitations
- **Gemini API**: Rate limits apply based on API key tier
- **Supabase Free Tier**:
  - 500MB database storage
  - 1GB file storage
  - 50,000 monthly active users
  - 2GB bandwidth

### File Size Limits
- **Upload**: 10MB per file (configurable)
- **Storage**: Supabase storage limits apply
- **localStorage**: ~5-10MB (for migration source)

### Performance Targets
- Initial load: <2 seconds
- Authentication: <1 second
- Image upload: <5 seconds (depends on size)
- Database queries: <500ms
- Page navigation: <200ms

## Dependencies

### Production Dependencies
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "@google/genai": "^1.28.0",
  "@supabase/supabase-js": "^latest"
}
```

### Development Dependencies
```json
{
  "@types/node": "^22.14.0",
  "@vitejs/plugin-react": "^5.0.0",
  "typescript": "~5.8.2",
  "vite": "^6.2.0"
}
```

## Tool Usage Patterns

### Vite Configuration

**File**: `vite.config.ts`

```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
```

### TypeScript Configuration

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "types": ["node"],
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

### Supabase Client Pattern

```typescript
// services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Service Pattern

```typescript
// services/authService.ts
import { supabase } from './supabaseClient';

export const authService = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  },
  
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  },
  
  // ... more methods
};
```

### React Context Pattern

```typescript
// hooks/useAuth.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    authService.getCurrentUser().then(setUser).finally(() => setLoading(false));
    
    // Listen for auth changes
    const unsubscribe = authService.onAuthStateChange(setUser);
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

## Project Structure

```
/
├── components/              # React components
│   ├── icons/              # Icon components
│   ├── auth/               # Auth-related components (new)
│   │   ├── LoginForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── PasswordResetForm.tsx
│   └── *.tsx               # Feature components
├── hooks/                  # Custom React hooks
│   ├── useTranslations.ts  # i18n hook
│   └── useAuth.ts          # Auth hook (new)
├── locales/                # i18n translation files
│   ├── en.ts
│   ├── tr.ts
│   └── es.ts
├── services/               # External API integrations
│   ├── geminiService.ts    # Gemini AI
│   ├── supabaseClient.ts   # Supabase client (new)
│   ├── authService.ts      # Auth operations (new)
│   ├── databaseService.ts  # Database operations (new)
│   ├── storageService.ts   # File storage (new)
│   ├── migrationService.ts # Data migration (new)
│   └── syncService.ts      # Offline sync (new)
├── utils/                  # Helper functions
│   ├── imageUtils.ts       # Image processing
│   └── fileUtils.ts        # File handling
├── .kiro/                  # Kiro IDE configuration
│   ├── specs/              # Feature specifications
│   └── steering/           # AI steering rules
├── memory-bank/            # Memory Bank files (new)
│   ├── projectbrief.md
│   ├── productContext.md
│   ├── systemPatterns.md
│   ├── techContext.md
│   ├── activeContext.md
│   └── progress.md
├── App.tsx                 # Main application component
├── index.tsx               # React entry point
├── types.ts                # TypeScript type definitions
├── vite.config.ts          # Build configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies
├── .env.local              # Environment variables (gitignored)
└── README.md               # Project documentation
```

## Coding Conventions

### Component Structure
- Functional components with TypeScript
- Props interfaces defined inline or in types.ts
- Dark mode support via Tailwind classes (dark:*)
- Responsive design with Tailwind breakpoints

### File Naming
- Components: PascalCase (e.g., `GeneratorControls.tsx`)
- Services: camelCase (e.g., `authService.ts`)
- Utilities: camelCase (e.g., `imageUtils.ts`)
- Types: Centralized in `types.ts`
- Locales: Language code (e.g., `en.ts`, `tr.ts`)

### Type Definitions
- Core types in `types.ts`
- Service-specific types in service files
- Component props: Inline interfaces
- Translation keys: Type-safe via `Translations` type

### State Management
- Local state with `useState`
- Context for global state (Auth, Language)
- localStorage for persistence (being replaced)
- Supabase for cloud persistence (new)

### Internationalization
- `useTranslations` hook for all user-facing text
- Translation keys in `locales/*.ts`
- String interpolation via replacements parameter
- Browser language detection on initial load

## Testing Strategy (Future)

### Unit Tests
- Test service methods with mocked Supabase client
- Test utility functions
- Test custom hooks

### Integration Tests
- Test authentication flow
- Test data persistence
- Test file upload/download
- Test migration process

### E2E Tests
- Test complete user workflows
- Test offline/online transitions
- Test multi-device scenarios
