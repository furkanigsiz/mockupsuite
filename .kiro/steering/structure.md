# Project Structure

## Directory Organization

```
/
├── components/          # React components
│   ├── icons/          # Icon components
│   └── *.tsx           # Feature components
├── hooks/              # Custom React hooks
├── locales/            # i18n translation files
├── services/           # External API integrations
├── utils/              # Helper functions
├── App.tsx             # Main application component
├── index.tsx           # React entry point
├── types.ts            # TypeScript type definitions
└── vite.config.ts      # Build configuration
```

## Key Conventions

### Component Structure
- Functional components with TypeScript
- Props interfaces defined inline or in types.ts
- Dark mode support via Tailwind classes (dark:*)
- Responsive design with Tailwind breakpoints

### State Management
- Local state with useState
- Context for language/translations (LanguageProvider)
- localStorage for persistence (projects, brand kit, templates)
- Transient data (uploadedImages, suggestedPrompts) excluded from storage

### File Naming
- Components: PascalCase (e.g., GeneratorControls.tsx)
- Utilities: camelCase (e.g., imageUtils.ts)
- Types: Centralized in types.ts
- Locales: Language code (e.g., en.ts, tr.ts)

### Type Definitions
- Core types in types.ts: UploadedImage, Project, BrandKit, etc.
- Component props: Inline interfaces
- Translation keys: Type-safe via Translations type

### Internationalization
- useTranslations hook for all user-facing text
- Translation keys in locales/*.ts
- String interpolation via replacements parameter
- Browser language detection on initial load
