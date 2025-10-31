# Project Brief: MockupSuite - Supabase Integration

## Project Overview

MockupSuite is an AI-powered mockup generator that creates professional product photography and mockups using Google's Gemini AI. The current project phase focuses on integrating Supabase to provide cloud-based authentication, database storage, and file storage capabilities.

## Core Requirements

### Current State
- React 19.2.0 + TypeScript application
- Vite build system
- Google Gemini AI integration for mockup generation
- localStorage-based data persistence
- Multi-language support (English, Turkish, Spanish)
- Two generation modes: Scene Generation and Product Mockups

### Integration Goals
1. **User Authentication**: Email/password and OAuth (Google, GitHub) authentication
2. **Cloud Database**: Replace localStorage with Supabase PostgreSQL for projects, brand kits, and prompt templates
3. **File Storage**: Store uploaded images and generated mockups in Supabase Storage
4. **Data Migration**: Seamless migration from localStorage to Supabase
5. **Offline Support**: Queue changes when offline and sync when reconnected
6. **Security**: Row Level Security (RLS) policies for data privacy
7. **Performance**: Pagination, caching, and thumbnail optimization

## Supabase Configuration

- **Project URL**: https://wjliqsmzsyfmiohwfonc.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbGlxc216c3lmbWlvaHdmb25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzM3MjksImV4cCI6MjA3NzQ0OTcyOX0.FB4dIeEbJiITHoNix7h7CBYzaMjONYUU9U7aKTP42_U
- **Service Role**: (Available but should never be exposed in client-side code)

## Success Criteria

1. Users can create accounts and authenticate
2. All data persists in Supabase database
3. Images stored securely in Supabase Storage
4. Existing localStorage data can be migrated
5. Application works offline with sync on reconnection
6. Only authenticated users can access their own data
7. Application loads quickly with optimized queries

## Scope

**In Scope:**
- Full Supabase integration (auth, database, storage)
- Data migration from localStorage
- Offline support with sync
- Security policies (RLS)
- Performance optimizations
- Comprehensive testing

**Out of Scope:**
- Real-time collaboration features
- Payment/subscription system
- Advanced analytics
- Mobile app development
