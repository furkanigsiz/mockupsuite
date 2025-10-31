# Implementation Plan

- [x] 1. Update type definitions and add video-related types




  - Add 'video' to AppMode type union
  - Create VideoResult interface with source, generatedUrl, duration, and createdAt fields
  - Create VideoGenerationRequest interface for API requests
  - Create VideoQueueItem interface extending QueueItem
  - Add VideoErrorType enum for error handling
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Create Veo3Service for video generation
  - [ ] 2.1 Implement generateVideo function
    - Set up Google GenAI client with Veo 3 model
    - Accept prompt, sourceImage, duration, and aspectRatio parameters
    - Handle video response format (base64 or streaming)
    - Return base64 video data
    - _Requirements: 1.4, 2.1_
  
  - [ ] 2.2 Add error handling and timeout logic
    - Implement 90-second timeout for API calls
    - Handle API errors with user-friendly messages
    - Add retry logic for transient failures
    - _Requirements: 2.4, 6.1, 6.4_
  
  - [ ] 2.3 Write unit tests for Veo3Service
    - Test successful video generation
    - Test timeout handling
    - Test error scenarios
    - _Requirements: 1.4, 2.1_

- [ ] 3. Update StorageService for video handling
  - [ ] 3.1 Implement uploadVideo function
    - Create videos folder structure in Supabase Storage
    - Upload video file with user ID path
    - Return storage path
    - Handle upload errors with retry logic
    - _Requirements: 3.3, 6.2_
  
  - [ ] 3.2 Implement getVideoUrl function
    - Generate signed URL with 1-hour expiration
    - Cache URL for 55 minutes
    - Handle URL generation errors
    - _Requirements: 3.1, 3.4_
  
  - [ ] 3.3 Implement deleteVideo function
    - Delete video from Supabase Storage
    - Handle deletion errors
    - _Requirements: 3.3_
  
  - [ ] 3.4 Write unit tests for video storage functions
    - Test video upload
    - Test URL retrieval and caching
    - Test video deletion
    - _Requirements: 3.3_

- [ ] 4. Update SubscriptionService for video quota management
  - [ ] 4.1 Implement canGenerateVideo function
    - Check user's video generation quota
    - Consider video generation cost (e.g., 5 credits per video)
    - Return boolean indicating if user can generate
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [ ] 4.2 Implement decrementVideoQuota function
    - Deduct appropriate credits for video generation
    - Update user_subscriptions table
    - Handle quota exhaustion
    - _Requirements: 4.3, 4.4_
  
  - [ ] 4.3 Implement getVideoQuotaInfo function
    - Retrieve video-specific quota information
    - Return QuotaInfo with total, used, remaining, and resetDate
    - _Requirements: 4.4_
  
  - [ ] 4.4 Write unit tests for video quota functions
    - Test quota checking
    - Test quota deduction
    - Test quota info retrieval
    - _Requirements: 4.1, 4.3, 4.4_

- [ ] 5. Create database migration for videos table
  - Create videos table with id, user_id, project_id, storage_path, source_image_path, prompt, duration, aspect_ratio, created_at, updated_at columns
  - Add RLS policies for SELECT, INSERT, DELETE operations
  - Add remaining_video_quota column to user_subscriptions table
  - Create indexes for performance optimization
  - _Requirements: 3.3, 4.4_

- [ ] 6. Update ModeSwitcher component to include video mode
  - Add 'video' mode to modes array with labelKey 'mode_video'
  - Update grid layout from w-1/2 to w-1/3 for three tabs
  - Ensure styling is consistent across all three modes
  - _Requirements: 1.1_

- [ ] 7. Create VideoGeneratorControls component
  - [ ] 7.1 Create component structure and props interface
    - Define VideoGeneratorControlsProps interface
    - Set up component with all required props
    - _Requirements: 1.2_
  
  - [ ] 7.2 Implement image uploader section
    - Reuse ImageUploader component with maxImages=1
    - Handle source image selection
    - Display selected image preview
    - _Requirements: 1.3_
  
  - [ ] 7.3 Implement video prompt input
    - Create textarea for video description
    - Add placeholder text
    - Handle prompt changes
    - _Requirements: 1.2_
  
  - [ ] 7.4 Implement duration selector
    - Create button group for 5s, 7s, 10s options
    - Highlight selected duration
    - Handle duration changes
    - _Requirements: 1.2_
  
  - [ ] 7.5 Implement aspect ratio selector
    - Create button group for 16:9, 9:16, 1:1 options
    - Highlight selected ratio
    - Handle ratio changes
    - _Requirements: 1.2_
  
  - [ ] 7.6 Implement generate button
    - Add generate button with loading state
    - Disable when inputs are invalid
    - Call onGenerate handler
    - _Requirements: 1.4_
  
  - [ ] 7.7 Write unit tests for VideoGeneratorControls
    - Test component rendering
    - Test user interactions
    - Test validation logic
    - _Requirements: 1.2_

- [ ] 8. Update App.tsx to support video mode
  - [ ] 8.1 Add video-specific state variables
    - Add videoSourceImage state
    - Add videoPrompt state
    - Add videoDuration state (default 7)
    - Add videoAspectRatio state (default '16:9')
    - Add currentVideoResult state
    - _Requirements: 1.2, 1.5_
  
  - [ ] 8.2 Implement handleVideoGenerate function
    - Validate inputs (source image and prompt)
    - Check video generation quota
    - Show upgrade modal if quota exhausted
    - Set loading state and progress text
    - Add request to queue
    - Call veo3Service.generateVideo
    - Convert base64 to file and upload to storage
    - Get signed URL for video
    - Update queue item status
    - Set video result
    - Decrement video quota
    - Handle errors and update queue on failure
    - _Requirements: 1.4, 2.1, 2.2, 2.5, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3_
  
  - [ ] 8.3 Update GeneratorControls rendering logic
    - Add conditional rendering for video mode
    - Pass video-specific props to VideoGeneratorControls
    - Maintain existing scene and product mode rendering
    - _Requirements: 1.1, 1.2_
  
  - [ ] 8.4 Update results display logic
    - Add conditional rendering for GeneratedVideo component
    - Pass currentVideoResult, isLoading, error, and progressText props
    - Maintain existing GeneratedImageGrid rendering for other modes
    - _Requirements: 1.5, 2.1, 2.2_
  
  - [ ] 8.5 Write integration tests for video generation flow
    - Test complete video generation workflow
    - Test quota enforcement
    - Test error handling
    - _Requirements: 1.4, 2.1, 4.1, 6.1_

- [ ] 9. Update GeneratorControls component to handle video mode
  - Add mode === 'video' condition in render logic
  - Render VideoGeneratorControls when in video mode
  - Pass all required props from App.tsx
  - Ensure proper prop drilling for video-specific state
  - _Requirements: 1.1, 1.2_

- [ ] 10. Add video-related translations to locale files
  - [ ] 10.1 Add translations to en.ts
    - Add mode_video, video_prompt_title, video_prompt_placeholder
    - Add video_duration_label, video_aspect_ratio_label
    - Add generate_video_button, generate_video_button_loading
    - Add download_video_button
    - Add progress_text_generating_video, progress_text_uploading_video, progress_text_downloading_video
    - Add error messages for video generation
    - Add grid_video_placeholder_title, grid_video_placeholder_description
    - _Requirements: 1.1, 1.2, 2.2, 6.1_
  
  - [ ] 10.2 Add translations to tr.ts
    - Translate all video-related strings to Turkish
    - _Requirements: 1.1, 1.2, 2.2, 6.1_
  
  - [ ] 10.3 Add translations to es.ts
    - Translate all video-related strings to Spanish
    - _Requirements: 1.1, 1.2, 2.2, 6.1_

- [ ] 11. Update QueueManagerService to support video requests
  - Add videoGeneration flag to queue item request data
  - Handle video-specific queue item updates
  - Store video URL in result data
  - Update queue status appropriately for video generation
  - _Requirements: 2.1, 2.5, 6.2_

- [ ] 12. Update DatabaseService for video operations
  - [ ] 12.1 Implement saveVideo function
    - Insert video record into videos table
    - Store video metadata (prompt, duration, aspect ratio)
    - Return saved video record
    - _Requirements: 3.3_
  
  - [ ] 12.2 Implement getVideos function
    - Retrieve user's videos from database
    - Support pagination
    - Return video records with metadata
    - _Requirements: 3.4_
  
  - [ ] 12.3 Implement deleteVideo function
    - Delete video record from database
    - Trigger storage deletion
    - Handle cascading deletes
    - _Requirements: 3.3_
  
  - [ ] 12.4 Write unit tests for video database operations
    - Test video saving
    - Test video retrieval
    - Test video deletion
    - _Requirements: 3.3_

- [ ] 13. Update QuotaWidget to display video quota
  - Add video quota display section
  - Show remaining video generations
  - Display video quota reset date
  - Update styling to accommodate video quota info
  - _Requirements: 4.4_

- [ ] 14. Add video support to offline queue system
  - Update offlineDataService to handle video generation requests
  - Queue video requests when offline
  - Sync video requests when connection restored
  - Handle video upload retry logic
  - _Requirements: 6.2, 6.3_

- [ ] 15. Update BrandKit integration for videos
  - [ ] 15.1 Apply brand colors to video prompts
    - Inject brand color information into video generation prompts
    - _Requirements: 5.1_
  
  - [ ] 15.2 Support watermark application to videos
    - Implement video watermarking if brand kit watermark is enabled
    - Apply watermark overlay to generated videos
    - _Requirements: 5.2_
  
  - [ ] 15.3 Associate videos with project brand settings
    - Link generated videos to project's brand kit
    - Store brand kit reference in video metadata
    - _Requirements: 5.3_

- [ ] 16. Implement video save and download functionality
  - [ ] 16.1 Add save video handler
    - Save video to project
    - Store video metadata in database
    - Update project's saved videos list
    - _Requirements: 3.1, 3.3_
  
  - [ ] 16.2 Implement video download
    - Use downloadVideo utility from fileUtils
    - Handle download errors
    - Show download progress
    - _Requirements: 3.1_
  
  - [ ] 16.3 Add remove video handler
    - Delete video from storage
    - Remove video from database
    - Update project's saved videos list
    - _Requirements: 3.3_

- [ ] 17. Add environment variables and configuration
  - Add VITE_VEO3_API_KEY to .env.local
  - Add VITE_VIDEO_MAX_DURATION configuration
  - Add VITE_VIDEO_MAX_FILE_SIZE configuration
  - Update vite.config.ts to inject video-related env variables
  - _Requirements: 1.4, 2.1_

- [ ] 18. Configure Supabase Storage for videos
  - Create videos bucket in Supabase Storage
  - Set file size limit to 20 MB
  - Configure MIME type restrictions (video/mp4, video/webm)
  - Set up appropriate access policies
  - _Requirements: 3.3_

- [ ] 19. Update error handling for video generation
  - Add VideoErrorType enum to types
  - Create video-specific error messages
  - Update error handler to recognize video errors
  - Display appropriate error UI for video failures
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 20. Add video icon component
  - Create VideoIcon component in components/icons
  - Use in VideoGeneratorControls and GeneratedVideo
  - Ensure consistent styling with other icons
  - _Requirements: 1.1, 1.2_
