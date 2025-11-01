# Implementation Plan

- [x] 1. Set up database schema and migrations





  - Create user_profiles table with RLS policies
  - Create trigger for auto-creating profiles on user signup
  - Create migration file in supabase/migrations
  - Add backfill script for existing users
  - _Requirements: 1.1, 3.1, 4.6_

- [x] 2. Create profileService for data operations





  - [x] 2.1 Implement getUserProfile function


    - Fetch user profile from database
    - Handle case when profile doesn't exist
    - Return UserProfile interface
    - _Requirements: 1.3, 3.2_

  - [x] 2.2 Implement updateUserProfile function

    - Validate input data
    - Update profile in database
    - Return updated profile
    - _Requirements: 3.5, 3.6_

  - [x] 2.3 Implement uploadAvatar function

    - Validate file type and size
    - Upload to Supabase Storage in avatars folder
    - Return storage path
    - _Requirements: 4.3, 4.4, 4.5_

  - [x] 2.4 Implement deleteAvatar function

    - Delete file from storage
    - Update profile to remove avatar_path
    - _Requirements: 4.6_

- [x] 3. Add UserProfile type to types.ts





  - Define UserProfile interface
  - Add ProfileErrorType enum
  - Export types for use in components
  - _Requirements: 1.3, 3.1_

- [x] 4. Create ProfileSidebar component





  - [x] 4.1 Implement sidebar layout and styling

    - Create fixed width sidebar (w-64)
    - Add dark mode support
    - Style with Tailwind classes
    - _Requirements: 2.1, 2.2_


  - [x] 4.2 Implement user profile header section

    - Display user avatar (40px size)
    - Show user name and email
    - Style with proper spacing
    - _Requirements: 2.2_



  - [x] 4.3 Implement navigation menu

    - Create navigation items array with icons
    - Render clickable navigation links
    - Highlight active section
    - Handle section change events

    - _Requirements: 2.3, 2.4_


  - [x] 4.4 Implement sign out button

    - Add button at bottom of sidebar
    - Call signOut from AuthProvider
    - Style with hover effects
    - _Requirements: 2.5, 2.6_

  - [x] 4.5 Add Material Symbols icons

    - Use person, settings, lock, credit_card, photo_library icons
    - Ensure icons match design
    - _Requirements: 2.7_

- [x] 5. Create ProfileHeader component





  - [x] 5.1 Implement avatar display


    - Show current avatar or placeholder
    - Style as 96px rounded-full
    - Handle missing avatar gracefully
    - _Requirements: 4.1_


  - [x] 5.2 Implement upload avatar button





    - Create file input with accept attribute
    - Trigger file dialog on button click
    - Show loading state during upload
    - _Requirements: 4.2, 4.3_


  - [x] 5.3 Handle avatar upload





    - Validate file type (JPEG, PNG, WebP, GIF)
    - Validate file size (max 5MB)
    - Call uploadAvatar service
    - Update UI with new avatar
    - Display error messages on failure
    - _Requirements: 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 6. Create PersonalInfoForm component





  - [x] 6.1 Implement form layout


    - Create two-column grid for desktop
    - Add proper spacing and styling
    - Style with dark mode support
    - _Requirements: 3.1_


  - [x] 6.2 Implement form inputs

    - Create First Name input field
    - Create Last Name input field
    - Create read-only Email field
    - Add proper labels and styling
    - _Requirements: 3.2, 3.3, 3.4_


  - [x] 6.3 Implement form validation

    - Validate required fields
    - Show validation errors
    - Disable save button when invalid
    - _Requirements: 3.7_

  - [x] 6.4 Implement save and cancel actions


    - Handle save button click
    - Call updateUserProfile service
    - Show success message on save
    - Handle cancel button to reset form
    - Track unsaved changes
    - _Requirements: 3.5, 3.6, 3.8_

- [x] 7. Create SubscriptionSection component





  - [x] 7.1 Implement subscription display


    - Fetch subscription data from subscriptionService
    - Display plan name and price
    - Show loading state while fetching
    - _Requirements: 5.1, 5.6, 5.7_

  - [x] 7.2 Implement quota display

    - Fetch quota info from subscriptionService
    - Display remaining generations
    - Format numbers properly
    - _Requirements: 5.2_

  - [x] 7.3 Implement manage subscription button

    - Create button with primary styling
    - Open upgrade modal on click
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 8. Create ProfilePage main component





  - [x] 8.1 Implement page layout


    - Create flex layout with sidebar and content
    - Add proper spacing and styling
    - Ensure dark mode support
    - _Requirements: 1.4, 6.1_

  - [x] 8.2 Implement data fetching

    - Fetch user profile on mount
    - Fetch subscription data
    - Handle loading states
    - Handle errors
    - _Requirements: 1.3, 5.1_

  - [x] 8.3 Implement section navigation

    - Track active section state
    - Handle section changes
    - Render appropriate content for each section
    - _Requirements: 2.4, 7.1, 7.2_

  - [x] 8.4 Integrate all child components

    - Render ProfileSidebar
    - Render ProfileHeader
    - Render PersonalInfoForm
    - Render SubscriptionSection
    - Pass props and callbacks
    - _Requirements: 1.3, 3.1, 4.1, 5.1_

- [x] 9. Implement responsive design




  - [x] 9.1 Add mobile sidebar toggle


    - Create hamburger menu button
    - Implement sidebar open/close state
    - Add overlay when sidebar is open
    - _Requirements: 6.2, 6.3_

  - [x] 9.2 Adjust form layout for mobile


    - Stack form fields vertically on mobile
    - Expand buttons to full width
    - Adjust spacing for smaller screens
    - _Requirements: 6.4, 6.5_

  - [x] 9.3 Adjust profile header for mobile


    - Change layout from horizontal to vertical
    - Adjust avatar and button sizes
    - _Requirements: 6.6_

  - [x] 9.4 Test responsive breakpoints


    - Test on mobile (< 768px)
    - Test on tablet (768px - 1024px)
    - Test on desktop (> 1024px)
    - _Requirements: 6.1, 6.7_

- [x] 10. Integrate ProfilePage with App.tsx





  - [x] 10.1 Add profile route to mainView state


    - Update mainView type to include 'profile'
    - Add conditional rendering for ProfilePage
    - _Requirements: 8.1_

  - [x] 10.2 Update StaggeredMenu with profile item

    - Add Profile menu item to items array
    - Set onClick to navigate to profile
    - Use person icon
    - _Requirements: 8.2_

  - [x] 10.3 Make UnifiedHeader profile icon clickable

    - Add onClick handler to avatar div
    - Navigate to profile page on click
    - Add proper ARIA labels
    - _Requirements: 1.1, 8.3_

  - [x] 10.4 Handle navigation to gallery

    - Implement My Generations click handler
    - Update mainView to 'gallery'
    - Maintain project context
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 11. Add internationalization support





  - Add translation keys to locales files (en.ts, tr.ts, es.ts)
  - Use useTranslations hook in all components
  - Translate all user-facing text
  - _Requirements: 1.4, 2.3, 3.1, 4.2, 5.1_

- [ ] 12. Implement error handling and user feedback






  - [x] 12.1 Add error state management

    - Create error state in ProfilePage
    - Display error messages to user
    - Style error messages appropriately
    - _Requirements: 3.7, 4.8_


  - [x] 12.2 Add success message display

    - Show success toast on profile update
    - Show success message on avatar upload
    - Auto-dismiss after 3 seconds
    - _Requirements: 3.8_


  - [x] 12.3 Add loading indicators

    - Show spinner during data fetch
    - Show loading state on save button
    - Show loading state on avatar upload
    - _Requirements: 4.3, 5.7_

- [x] 13. Add accessibility features





  - [x] 13.1 Add ARIA labels


    - Add aria-label to profile page
    - Add role and aria-label to navigation
    - Add aria-label to buttons
    - _Requirements: 1.4, 2.3, 4.2_

  - [x] 13.2 Implement keyboard navigation


    - Ensure proper tab order
    - Handle Enter key on forms
    - Handle Escape key to cancel
    - Add visible focus indicators
    - _Requirements: 6.1_

  - [x] 13.3 Add screen reader support


    - Announce form validation errors
    - Announce loading states
    - Announce success messages
    - Announce section changes
    - _Requirements: 3.7, 3.8_

- [x] 14. Run database migration




  - Execute migration to create user_profiles table (ben profil güncellemeyi denedim ad soyad olarak güncelleniyor ve supabaseye kaydediliyor bu onla alakalı ise eğer atlayabilirsin bu adımı)
  - Verify RLS policies are active
  - Run backfill script for existing users
  - Test profile creation on new user signup
  - _Requirements: 1.1, 3.1, 4.6_

- [x] 15. Test complete profile flow
  - Test navigation from menu to profile
  - Test profile data loading
  - Test form editing and saving
  - Test avatar upload
  - Test subscription display
  - Test navigation to gallery
  - Test sign out functionality
  - _Requirements: 1.1, 1.3, 3.5, 4.7, 5.1, 7.1, 2.6_
