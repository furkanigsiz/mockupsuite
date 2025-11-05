export const en = {
    // App
    app_title: 'MockupSuite',
    prompt_label: 'Mockup Description',
    prompt_placeholder: 'e.g., A product photo of the uploaded image on a wooden table, with a plant in the background.',
    generate_button: 'Generate Mockups',
    generate_button_loading: 'Generating...',
    suggest_button: 'Suggest Ideas',
    suggest_button_loading: 'Thinking...',
    
    // Main Page
    create_mockup_title: 'Create Your Mock-up',

    // Modes
    mode_scene: 'Scene Generation',
    mode_product: 'Product Mockups',
    mode_video: 'Video',
    mode_background_remover: 'BG Remover',

    // Spinner
    spinner_title: 'Processing your request...',
    spinner_description: 'This may take a moment. Please wait.',
    
    // --- Scene Mode ---
    // Image Uploader (Scene Mode)
    uploader_title: '1. Upload Your Product Photo(s)',
    uploader_cta_multi: 'Click to upload or drag and drop',
    uploader_cta_alt: 'your images here',
    uploader_add_more: 'Add more images',
    uploader_file_types: 'PNG, JPG, WEBP supported',
     // Prompt
    scene_prompt_title: '2. Describe the Scene',
    // Aspect Ratio
    aspect_ratio_label: '3. Select Aspect Ratio',
    aspect_ratio_square: 'Square (1:1)',
    aspect_ratio_landscape: 'Landscape (16:9)',
    aspect_ratio_portrait: 'Portrait (9:16)',

    // --- Video Mode ---
    video_prompt_title: '2. Describe Your Video',
    video_prompt_placeholder: 'Describe the video animation you want to create...',
    video_duration_label: '3. Duration',
    video_aspect_ratio_label: '4. Aspect Ratio',
    generate_video_button: 'Generate Video',
    generate_video_button_loading: 'Generating Video...',
    download_video_button: 'Download Video',
    remove_video_button: 'Remove',
    video_saved_to_project: 'Saved to project',
    video_saved_success: 'Video saved successfully!',
    video_save_error: 'Failed to save video. Please try again.',
    video_removed_success: 'Video removed successfully!',
    video_remove_error: 'Failed to remove video. Please try again.',
    video_download_error: 'Failed to download video. Please try again.',

    // Background Remover
    background_remover_title: 'Background Remover',
    background_remover_description: 'Upload an image to remove its background. The tool will be displayed on the right side.',
    grid_video_placeholder_title: 'Your video will appear here',
    grid_video_placeholder_description: 'Upload an image and describe your video to get started',
    video_prompt_suggestion_base: 'Suggest creative video animation ideas for this image',
    progress_text_downloading_video: 'Downloading video...',

    // --- Product Mockup Mode ---
    step_1_title: '1. Upload Your Design',
    design_uploader_title: '1. Upload Your Design',
    design_uploader_cta_title: 'Drag & drop your file here, or browse.',
    design_uploader_cta_subtitle: 'Supports: PNG, JPG, SVG. Max size: 10MB.',
    design_uploader_cta_button: 'Upload File',
    step_2_title: '2. Choose a Product',
    step_2_subtitle: 'Select a template to apply your design to.',
    search_products_placeholder: 'Search products...',
    all_categories_option: 'All Categories',
    step_3_title: '3. Customize',
    color_label: 'Product Color',
    style_selector_title: 'Style Presets',
    style_preset_studio: 'Studio',

    // Migration
    migration_title: 'Migrate Your Data',
    migration_description: 'We found existing data in your browser. Would you like to migrate it to your account?',
    migration_button_migrate: 'Migrate Data',
    migration_button_skip: 'Skip',
    migration_button_cancel: 'Cancel',
    migration_in_progress: 'Migrating your data...',
    migration_success_title: 'Migration Successful!',
    migration_success_description: 'Your data has been successfully migrated to your account.',
    migration_error_title: 'Migration Failed',
    migration_error_description: 'Some errors occurred during migration. Your local data has been preserved.',
    migration_partial_success: 'Migration completed with some errors.',
    migration_stats: 'Migrated: {projects} projects, {mockups} mockups, {templates} templates',
    migration_button_close: 'Close',
    migration_button_retry: 'Retry',
    style_preset_lifestyle: 'Lifestyle',
    style_preset_outdoor: 'Outdoor',
    style_preset_flatlay: 'Flat Lay',
    style_prompt_label: 'Style Details (Optional)',
    style_prompt_placeholder: 'e.g., worn by a model, dramatic lighting',
    
    // Generated Image Grid
    grid_title: 'Generated Mockups',
    grid_batch_placeholder_title: 'Your generated mockups will appear here.',
    grid_batch_placeholder_description: 'Complete the steps on the left to get started.',
    download_button: 'Download',
    save_button: 'Save',
    saved_button: 'Saved',
    use_in_scene_button: 'Use in Scene',
    
    // Saved Image Grid
    saved_grid_title: 'Saved Mockups',
    download_all_button: 'Download All Saved',
    saved_grid_placeholder: 'Your saved images will appear here. Click the star icon on a generated image to save it.',
    remove_button: 'Remove',
    
    // Image Modal
    image_modal_title: 'Generated Image Preview',
    image_modal_close_button: 'Close preview',
    
    // Errors
    error_title: 'An Error Occurred',
    error_no_image_or_prompt: 'Please upload at least one image and provide a prompt before generating.',
    error_no_product_or_design: 'Please select a product and upload a logo or design before generating.',
    error_no_image_for_suggestions: 'Please upload an image first to get suggestions.',
    error_suggestions_failed: 'Sorry, we couldn\'t generate suggestions at this time. Please try again.',
    error_unknown: 'An unknown error occurred. Please check the console for more details.',
    error_loading_data: 'Failed to load your data. Please refresh the page.',
    error_not_authenticated: 'You must be signed in to generate mockups.',
    error_video_generation_failed: 'Failed to generate video. Please try again.',
    error_video_upload_failed: 'Failed to upload video. Please check your connection.',
    error_invalid_video_source: 'Please upload a valid image for video generation.',
    error_video_quota_exceeded: 'You have reached your video generation limit.',
    error_video_timeout: 'Video generation timed out. Please try again.',
    error_video_api_unavailable: 'Video generation is currently unavailable. This feature will be enabled once Google\'s Veo API becomes publicly accessible.',

    // Progress Text
    progress_text_generating: 'Generating for "{fileName}" ({current}/{total})...',
    progress_text_generating_video: 'Generating video... This may take up to 60 seconds.',
    progress_text_uploading_video: 'Uploading video...',

    // Prompt Suggestions
    prompt_suggestion_base: 'Based on the uploaded image, provide 4 diverse and creative mockup scene descriptions. The descriptions should be brief and inspiring. For example: "On a clean marble countertop next to a steaming cup of coffee." or "Held in a hand against a blurred city street background."',
    suggest_prompts: 'Suggest Ideas',
    suggesting_prompts: 'Suggesting...',
    suggested_prompts_label: 'Suggested prompts:',

    // Project Manager
    project_manager_title: 'Projects',
    create_project_button: 'Create New Project',
    delete_project_button: 'Delete Project',
    new_project_default_name: 'New Project',
    default_project_name: 'My First Project',
    loading_project: 'Loading project...',

    // Brand Kit
    brand_kit_title: 'Brand Kit',
    logo_label: 'Brand Logo (for Watermark)',
    logo_upload_cta: 'Upload Logo',
    logo_replace_cta: 'Replace Logo',
    use_watermark_label: 'Apply watermark to generated images',
    colors_label: 'Brand Colors',
    add_color_placeholder: 'Add hex color (e.g. #4F46E5)',
    add_color_button: 'Add',
    copy_color_tooltip: 'Copy to clipboard',

    // Prompt Templates
    prompt_templates_title: 'My Templates',
    save_prompt_button: 'Save current prompt as template',
    no_templates_placeholder: 'No saved templates yet.',

    // Gallery Page (Old)
    nav_generate: 'Generate',
    nav_gallery: 'Gallery',
    nav_account: 'Account',
    generate_new_mockup_button: 'Generate New Mockup',
    gallery_title: 'My Gallery',
    gallery_subtitle: 'Browse, manage, and download your AI-generated mockups.',
    select_multiple_button: 'Select Multiple',
    search_mockups_label: 'Search Mockups',
    search_mockups_placeholder: "e.g., 'T-shirt'",
    filter_by_label: 'Filter by',
    project_filter_label: 'Project',
    all_projects_option: 'All Projects',
    date_filter_label: 'Date Range',
    sort_by_label: 'Sort by',
    sort_newest: 'Newest',
    sort_oldest: 'Oldest',
    sort_name_az: 'Name (A-Z)',
    share_button: 'Share',
    edit_button: 'Edit',
    delete_button: 'Delete',
    favorite_button: 'Favorite',
    unfavorite_button: 'Unfavorite',
    
    // App Header
    nav_create_new: 'Create New',
    nav_integrations: 'Integrations',
    nav_help: 'Help',
    upgrade_button: 'Upgrade',

    // Dashboard / Account Page
    dashboard_title: 'My Creations',
    dashboard_nav_creations: 'My Creations',
    dashboard_nav_profile: 'Profile',
    dashboard_nav_settings: 'Settings',
    dashboard_nav_logout: 'Log Out',
    dashboard_generate_new_button: 'Generate New Mock-up',
    dashboard_search_placeholder: 'Search my creations...',
    dashboard_filter_all: 'All',
    dashboard_filter_by_product: 'By Product',
    dashboard_filter_by_date: 'By Date',
    dashboard_card_created: 'Created',
    dashboard_view_button: 'View',
    dashboard_empty_title: 'No Creations Yet',
    dashboard_empty_subtitle: "You haven't generated any mock-ups. Click the button below to get started and bring your designs to life!",
    dashboard_empty_button: 'Generate Your First Mock-up',

    // Authentication
    auth_sign_in: 'Sign In',
    auth_sign_up: 'Sign Up',
    auth_sign_out: 'Sign Out',
    auth_email: 'Email',
    auth_password: 'Password',
    auth_confirm_password: 'Confirm Password',
    auth_forgot_password: 'Forgot Password?',
    auth_reset_password: 'Reset Password',
    auth_send_reset_link: 'Send Reset Link',
    auth_back_to_sign_in: 'Back to Sign In',
    auth_no_account: "Don't have an account?",
    auth_have_account: 'Already have an account?',
    auth_sign_in_with_google: 'Sign in with Google',
    auth_sign_in_with_github: 'Sign in with GitHub',
    auth_or_continue_with: 'Or continue with',
    auth_email_placeholder: 'you@example.com',
    auth_password_placeholder: 'Enter your password',
    auth_confirm_password_placeholder: 'Confirm your password',
    auth_signing_in: 'Signing in...',
    auth_signing_up: 'Creating account...',
    auth_sending_reset: 'Sending reset link...',
    auth_reset_sent: 'Password reset link sent! Check your email.',
    auth_passwords_dont_match: 'Passwords do not match',
    auth_invalid_email: 'Please enter a valid email address',
    auth_password_too_short: 'Password must be at least 6 characters',
    auth_error_occurred: 'An error occurred. Please try again.',

    // Offline Indicator
    offline_status: 'Offline',
    online_status: 'Online',
    syncing_status: 'Syncing...',
    sync_complete: 'Synced',
    pending_changes: '{count} pending changes',
    sync_failed: 'Sync failed',
    retry_sync: 'Retry',

    // Error Messages
    error_auth_failed: 'Authentication failed. Please check your credentials and try again.',
    error_auth_session_expired: 'Your session has expired. Please sign in again.',
    error_database_save_failed: 'Failed to save your data. Please try again.',
    error_database_load_failed: 'Failed to load your data. Please refresh the page.',
    error_database_delete_failed: 'Failed to delete. Please try again.',
    error_storage_upload_failed: 'Failed to upload file. Please check the file and try again.',
    error_storage_download_failed: 'Failed to download file. Please try again.',
    error_storage_delete_failed: 'Failed to delete file. Please try again.',
    error_network_connection: 'Network connection lost. Please check your internet connection.',
    error_network_timeout: 'Request timed out. Please try again.',
    error_quota_exceeded: 'Storage quota exceeded. Please delete some files or upgrade your plan.',
    error_validation_invalid_input: 'Invalid data provided. Please check your input and try again.',
    error_validation_file_too_large: 'File is too large. Maximum size is {maxSize}MB.',
    error_validation_invalid_file_type: 'Invalid file type. Allowed types: {allowedTypes}.',
    error_retry_failed: 'Operation failed after multiple attempts. Please try again later.',
    
    // Payment Error Messages
    error_payment_failed: 'Payment failed. Please check your payment details and try again.',
    error_payment_cancelled: 'Payment was cancelled. Please try again if you wish to continue.',
    error_payment_invalid_card: 'Invalid card information. Please check your card details.',
    error_payment_insufficient_funds: 'Insufficient funds. Please check your account balance.',
    error_payment_processing: 'Payment processing failed. Please try again.',
    error_payment_timeout: 'Payment request timed out. Please try again.',
    error_payment_network: 'Network error during payment. Please check your connection and try again.',
    
    // Quota Error Messages
    error_quota_exhausted: 'Your monthly quota is exhausted. Please upgrade your plan to continue.',
    error_quota_insufficient: 'Insufficient quota to complete this action. Please upgrade your plan.',
    error_no_credits: 'You have no credits remaining. Please purchase credits to continue.',
    error_subscription_expired: 'Your subscription has expired. Please renew to continue.',
    error_subscription_inactive: 'Your subscription is not active. Please activate or renew your subscription.',
    error_plan_selection_required: 'Please select a plan to continue using the service.',
    
    // Toast Notifications
    toast_success: 'Success!',
    toast_error: 'Error',
    toast_warning: 'Warning',
    toast_info: 'Info',

    // Pricing / Plan Selection
    pricing_title: 'Find the Perfect Plan',
    pricing_subtitle: 'Choose the plan that\'s right for you and unlock your creative potential.',
    pricing_most_popular: 'Most Popular',
    pricing_per_month: '/month',
    pricing_start_free: 'Start for Free',
    pricing_choose_plan: 'Choose Plan',
    pricing_processing: 'Processing...',
    pricing_footer_note: 'All plans are for 30-day periods. Cancel anytime.',
    
    // Payment Checkout
    payment_checkout_title: 'Secure Payment',
    payment_checkout_preparing: 'Preparing payment page...',
    payment_checkout_redirecting: 'Please wait, redirecting to secure payment page.',
    payment_checkout_retrying: 'Retrying...',
    payment_checkout_failed_title: 'Payment Failed',
    payment_checkout_retry_button: 'Retry',
    payment_checkout_cancel_button: 'Cancel',
    payment_checkout_close_button: 'Close',
    payment_checkout_secure_payment: 'Secure payment - Powered by İyzico',
    payment_checkout_plan_label: 'Plan',
    payment_checkout_package_label: 'Package',
    
    // Plan Names
    pricing_plan_free_name: 'Free',
    pricing_plan_starter_name: 'Starter',
    pricing_plan_pro_name: 'Pro',
    pricing_plan_business_name: 'Business',
    
    // Plan Descriptions
    pricing_plan_free_description: 'For trying out our core features.',
    pricing_plan_starter_description: 'For professionals and small teams.',
    pricing_plan_pro_description: 'Best choice for heavy usage.',
    pricing_plan_business_description: 'For larger teams and agencies.',
    
    // Plan Features
    pricing_feature_quota: '{quota} mockup generations/month',
    pricing_feature_watermark: 'With watermark',
    pricing_feature_no_watermark: 'No watermark',
    pricing_feature_resolution: '{resolution} resolution',
    pricing_feature_high_resolution: 'High resolution (up to 4K)',
    pricing_feature_priority_queue: 'Priority processing',
    pricing_feature_priority_support: 'Priority support',
    pricing_feature_email_support: 'Email support',
    pricing_feature_community_support: 'Community support',
    
    // Quota Widget
    quota_widget_active_plan: 'Active Plan',
    quota_widget_plan_status: 'Plan Status',
    quota_widget_remaining_quota: 'Remaining Quota',
    quota_widget_remaining_image_quota: 'Remaining Image Quota',
    quota_widget_remaining_video_quota: 'Remaining Video Quota',
    quota_widget_used_mockups: '{used} mockups used',
    quota_widget_used_videos: '{used} videos created',
    quota_widget_renewal_date: 'Renewal date',
    quota_widget_expired: 'Expired',
    quota_widget_today: 'Today',
    quota_widget_tomorrow: 'Tomorrow',
    quota_widget_in_days: 'In {days} days',
    quota_widget_credit_balance: 'Credit Balance',
    quota_widget_credits: '{credits} credits',
    quota_widget_credits_note: 'Available when quota runs out',
    quota_widget_upgrade_now: 'Upgrade Now',
    quota_widget_renew_plan: 'Renew Plan',
    quota_widget_low_quota_warning: '⚠️ Your quota is running low. Upgrade your plan to generate more mockups.',
    quota_widget_exhausted_warning: '🚫 Your quota is exhausted.',
    quota_widget_exhausted_with_credits: 'Your credit balance will be used.',
    quota_widget_exhausted_upgrade: 'Upgrade to continue.',
    quota_widget_loading_error: 'Failed to load quota information',
    
    // Upgrade Modal
    upgrade_modal_title: 'Upgrade Your Plan',
    upgrade_modal_quota_exhausted_message: 'Your monthly quota is exhausted. Upgrade your plan to generate more mockups.',
    upgrade_modal_renewal_reminder_message: 'Your subscription will renew soon. Consider upgrading for more features.',
    upgrade_modal_manual_message: 'Generate more mockups and enjoy premium features.',
    upgrade_modal_current_plan: 'Your Current Plan',
    upgrade_modal_remaining: 'remaining',
    upgrade_modal_compare_plans: 'Compare Plans',
    upgrade_modal_prorated_today: 'Due today',
    upgrade_modal_prorated_explanation: 'Prorated charge for remaining period',
    upgrade_modal_upgrade_button: 'Upgrade Now',
    upgrade_modal_footer_note: 'You can change or cancel your plan at any time.',
    
    // Upgrade Success/Error Messages
    upgrade_success_message: 'Your plan has been upgraded successfully!',
    upgrade_error_message: 'Failed to upgrade your plan. Please try again.',
    
    // Profile Page
    profile_page_title: 'Profile Details',
    profile_first_name: 'First Name',
    profile_last_name: 'Last Name',
    profile_email: 'Email Address',
    profile_upload_avatar: 'Upload new picture',
    profile_uploading_avatar: 'Uploading...',
    profile_save_changes: 'Save Changes',
    profile_cancel: 'Cancel',
    profile_subscription_title: 'Subscription Plan',
    profile_current_plan: 'Current Plan',
    profile_manage_subscription: 'Manage Subscription',
    profile_sign_out: 'Sign Out',
    
    // Menu
    menu_sign_out: 'Sign Out',
    profile_avatar_upload_success: 'Avatar updated successfully!',
    profile_avatar_upload_error: 'Failed to upload avatar. Please try again.',
    profile_invalid_file_type: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.',
    profile_file_too_large: 'File size exceeds 5MB limit.',
    
    // Profile Sidebar
    profile_nav_profile: 'Profile Details',
    profile_nav_settings: 'Account Settings',
    profile_nav_security: 'Security',
    profile_nav_subscription: 'Subscription',
    profile_nav_generations: 'My Generations',
    
    // Profile Header
    profile_user_avatar: 'User avatar',
    
    // Personal Info Form
    profile_personal_info_title: 'Personal Information',
    profile_first_name_placeholder: 'Enter your first name',
    profile_last_name_placeholder: 'Enter your last name',
    profile_email_readonly_note: 'Email cannot be changed',
    profile_first_name_required: 'First name is required',
    profile_last_name_required: 'Last name is required',
    profile_first_name_too_long: 'First name must be 50 characters or less',
    profile_last_name_too_long: 'Last name must be 50 characters or less',
    profile_update_success: 'Profile updated successfully',
    profile_update_failed: 'Failed to update profile. Please try again.',
    profile_not_found: 'Profile not found. Please refresh the page.',
    profile_saving: 'Saving...',
    
    // Subscription Section
    subscription_section_title: 'Subscription Plan',
    subscription_status_active: 'Active',
    subscription_status_cancelled: 'Cancelled',
    subscription_status_expired: 'Expired',
    subscription_per_month: '/month',
    subscription_renews_on: 'Renews on {date}',
    subscription_access_until: 'Access until {date}',
    subscription_monthly_generations: 'Monthly Generations',
    subscription_resets_on: 'Resets on {date}',
    subscription_plan_features: 'Plan Features',
    subscription_generations_per_month: '{quota} generations per month',
    subscription_max_resolution: 'Up to {resolution}px resolution',
    subscription_no_watermark: 'No watermark',
    subscription_high_resolution: 'High resolution downloads',
    subscription_priority_queue: 'Priority queue processing',
    subscription_priority_support: 'Priority support',
    subscription_email_support: 'Email support',
    subscription_no_subscription: 'No subscription found',
    subscription_loading_error: 'Failed to load subscription data',
    subscription_try_again: 'Try again',
    subscription_low_quota_warning: 'You\'re running low on generations. Consider upgrading your plan to continue creating.',
    subscription_no_quota_warning: 'You\'ve used all your generations for this month. Upgrade to continue or wait until {date}.',
    
    // Help Center
    help_center_title: 'Help Center',
    help_center_subtitle: 'Have a question? Find your answer here.',
    help_center_search_placeholder: 'Search for questions...',
    help_center_contact_title: 'Can\'t find what you\'re looking for?',
    help_center_contact_description: 'Our support team is always ready to help. Reach out to us for any questions you might have.',
    help_center_contact_button: 'Contact Support',
    help_center_no_results: 'No results found for "{query}". Try different keywords or browse by category.',
    
    // FAQ Categories
    faq_category_all: 'All',
    faq_category_getting_started: 'Getting Started',
    faq_category_billing: 'Billing',
    faq_category_ai_features: 'AI Features',
    faq_category_troubleshooting: 'Troubleshooting',
    faq_category_privacy: 'Privacy',
    
    // FAQ Items - Getting Started
    faq_gs_1_question: 'What is MockupSuite?',
    faq_gs_1_answer: 'MockupSuite is an AI-powered mockup generator that allows you to upload your product images and designs to create professional, high-quality photos and mockups automatically. It\'s perfect for e-commerce, marketing, and design presentations.',
    
    faq_gs_2_question: 'How do I get started with MockupSuite?',
    faq_gs_2_answer: 'Getting started is easy! Simply sign up for a free account, upload your product photo or design, describe the scene you want or select a product template, and click generate. Your professional mockup will be ready in seconds.',
    
    faq_gs_3_question: 'What types of mockups can I create?',
    faq_gs_3_answer: 'You can create two types of mockups: Scene Generation (transform product photos into studio-quality images with custom backgrounds) and Product Mockups (apply designs to templates like apparel, home goods, print materials, and tech products).',
    
    faq_gs_4_question: 'Do I need design experience to use MockupSuite?',
    faq_gs_4_answer: 'No design experience is required! MockupSuite is designed to be user-friendly for everyone. Simply upload your image, describe what you want, and our AI handles the rest. The interface is intuitive and guides you through each step.',
    
    faq_gs_5_question: 'Can I use MockupSuite on mobile devices?',
    faq_gs_5_answer: 'Yes! MockupSuite is fully responsive and works seamlessly on mobile phones, tablets, and desktop computers. You can create professional mockups from any device with an internet connection.',
    
    // FAQ Items - Billing
    faq_billing_1_question: 'What subscription plans do you offer?',
    faq_billing_1_answer: 'We offer four plans: Free (5 mockups/month), Starter (50 mockups/month for 299 TRY), Pro (200 mockups/month for 649 TRY), and Business (700 mockups/month for 1,199 TRY). All paid plans include high-resolution exports and no watermarks.',
    
    faq_billing_2_question: 'Can I cancel my subscription at any time?',
    faq_billing_2_answer: 'Yes, you can cancel your subscription at any time from your account settings. Your plan will remain active until the end of the current billing cycle, and you will not be charged again.',
    
    faq_billing_3_question: 'What happens when I run out of monthly quota?',
    faq_billing_3_answer: 'When your monthly quota is exhausted, you can either upgrade to a higher plan or purchase credit packages. Credits never expire and can be used anytime your quota runs out.',
    
    faq_billing_4_question: 'Do you offer refunds?',
    faq_billing_4_answer: 'We offer a 14-day money-back guarantee for first-time subscribers. If you\'re not satisfied with the service, contact our support team within 14 days of your initial purchase for a full refund.',
    
    faq_billing_5_question: 'What payment methods do you accept?',
    faq_billing_5_answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and debit cards through our secure payment processor İyzico. All transactions are encrypted and secure.',
    
    faq_billing_6_question: 'How does the credit system work?',
    faq_billing_6_answer: 'Credits are additional generation units you can purchase when your monthly quota runs out. Unlike monthly quotas, credits never expire and remain in your account until used. One credit equals one mockup generation.',
    
    // FAQ Items - AI Features
    faq_ai_1_question: 'What AI technology powers MockupSuite?',
    faq_ai_1_answer: 'MockupSuite uses Google\'s Gemini 2.5 Flash AI model for image generation. This advanced AI creates photorealistic mockups with perfect lighting, shadows, and perspective.',
    
    faq_ai_2_question: 'How long does it take to generate a mockup?',
    faq_ai_2_answer: 'Most mockups are generated in 10-30 seconds. Pro and Business plan subscribers get priority processing for even faster generation times.',
    
    faq_ai_3_question: 'Can I customize the generated mockups?',
    faq_ai_3_answer: 'Yes! You can customize mockups by providing detailed scene descriptions, selecting different product templates, choosing colors, and applying style presets. The more specific your description, the better the results.',
    
    faq_ai_4_question: 'What file formats are supported for uploads?',
    faq_ai_4_answer: 'We support JPEG, PNG, WEBP, and GIF formats. For best results, we recommend uploading high-resolution images with a clean background. Maximum file size is 10MB.',
    
    faq_ai_5_question: 'Can I generate multiple mockups at once?',
    faq_ai_5_answer: 'Yes! You can upload multiple product images and generate mockups for all of them in a single batch. Each image will be processed individually, and you\'ll see the results as they\'re completed.',
    
    faq_ai_6_question: 'What resolution are the generated mockups?',
    faq_ai_6_answer: 'Free plan users receive standard resolution mockups with watermarks. Paid plan subscribers get high-resolution exports up to 4K quality without watermarks, perfect for professional use.',
    
    // FAQ Items - Troubleshooting
    faq_trouble_1_question: 'Why is my mockup generation failing?',
    faq_trouble_1_answer: 'Generation failures can occur due to several reasons: poor image quality, unsupported file format, network issues, or quota exhaustion. Check your file format, ensure you have remaining quota, and try again with a stable internet connection.',
    
    faq_trouble_2_question: 'The generated mockup doesn\'t match my description. What should I do?',
    faq_trouble_2_answer: 'Try being more specific in your description. Include details about lighting, background, perspective, and style. You can also use our prompt templates or suggestion feature for inspiration.',
    
    faq_trouble_3_question: 'How do I improve the quality of generated mockups?',
    faq_trouble_3_answer: 'Upload high-resolution source images, provide detailed and specific descriptions, use the style presets, and consider upgrading to Pro or Business plans for maximum resolution (up to 4K).',
    
    faq_trouble_4_question: 'My images are not loading in the gallery. What should I do?',
    faq_trouble_4_answer: 'This is usually a temporary issue. Try refreshing the page, clearing your browser cache, or checking your internet connection. If the problem persists, contact our support team.',
    
    faq_trouble_5_question: 'Can I regenerate a mockup if I\'m not satisfied?',
    faq_trouble_5_answer: 'Yes! You can regenerate mockups as many times as you want (within your quota limits). Each generation uses one quota unit or credit. Try adjusting your description or settings for different results.',
    
    faq_trouble_6_question: 'Why does the AI sometimes add unexpected elements?',
    faq_trouble_6_answer: 'AI generation is creative by nature and may interpret prompts differently. To get more predictable results, be very specific in your descriptions and use negative prompts to exclude unwanted elements.',
    
    // FAQ Items - Privacy
    faq_privacy_1_question: 'How is my data and privacy protected?',
    faq_privacy_1_answer: 'We take data privacy very seriously. All uploaded images and generated content are encrypted and stored securely using Supabase. We do not use your data for any purpose other than providing the service to you.',
    
    faq_privacy_2_question: 'Who owns the generated mockups?',
    faq_privacy_2_answer: 'You retain full ownership and commercial rights to all mockups you generate using MockupSuite. You can use them for any purpose, including commercial projects, without attribution.',
    
    faq_privacy_3_question: 'Do you share my images with third parties?',
    faq_privacy_3_answer: 'No, we never share your images with third parties. Your uploads and generated mockups are private and only accessible to you through your account.',
    
    faq_privacy_4_question: 'Can I delete my data?',
    faq_privacy_4_answer: 'Yes, you can delete individual mockups from your gallery at any time. If you want to delete your entire account and all associated data, contact our support team and we\'ll process your request within 30 days.',
    
    faq_privacy_5_question: 'Is my payment information secure?',
    faq_privacy_5_answer: 'Absolutely. We use İyzico, a PCI-DSS compliant payment processor. We never store your credit card information on our servers. All payment data is encrypted and handled securely by our payment partner.',
    
    faq_privacy_6_question: 'Do you use my images to train AI models?',
    faq_privacy_6_answer: 'No, we do not use your uploaded images or generated mockups to train AI models. Your content remains private and is only used to provide the service you requested.',
    
    // Landing Page
    landing_nav_features: 'Features',
    landing_nav_pricing: 'Pricing',
    landing_nav_faq: 'FAQ',
    landing_nav_contact: 'Contact',
    landing_get_started_free: 'Get Started for Free',
    landing_hero_title: 'Create Stunning Product Mockups in Seconds with AI.',
    landing_hero_subtitle: 'Transform your product photos into professional studio shots and generate realistic mockups instantly. No studio required.',
    landing_hero_generate_button: 'Generate Mockup',
    landing_hero_examples_button: 'See Examples',
    landing_how_it_works_title: 'How It Works',
    landing_step_1_title: '1. Upload Your Image',
    landing_step_1_description: 'Start with a simple photo of your product or your unique design file.',
    landing_step_2_title: '2. Let AI Work Its Magic',
    landing_step_2_description: 'Our AI analyzes your image and generates high-quality, realistic mockups.',
    landing_step_3_title: '3. Download Your Mockup',
    landing_step_3_description: 'Get your studio-quality photos ready for your store or social media.',
    landing_features_title: 'Elevate Your Product\'s Visuals',
    landing_features_subtitle: 'Discover the powerful features that make mockup creation effortless and professional.',
    landing_feature_1_title: 'Studio-Quality Photos',
    landing_feature_1_description: 'Generate photorealistic images that look like they were taken in a professional studio.',
    landing_feature_2_title: 'Instant Mockups',
    landing_feature_2_description: 'Instantly place your designs on a variety of products, from apparel to print.',
    landing_feature_3_title: 'Perfect Lighting & Shadows',
    landing_feature_3_description: 'Our AI automatically adjusts lighting and shadows for a perfectly realistic result.',
    landing_feature_4_title: 'Endless Backgrounds',
    landing_feature_4_description: 'Choose from a vast library of backgrounds or generate a custom one to match your brand.',
    landing_cta_title: 'Ready to Elevate Your Product\'s Visuals?',
    landing_cta_subtitle: 'Join thousands of creators and businesses transforming their product visuals with AI. Start creating professional mockups today—completely free.',
    landing_cta_button: 'Get Started Now',
    landing_footer_copyright: '© 2025 MockupSuite. All rights reserved.',
    landing_footer_about: 'About Us',
    landing_footer_contact: 'Contact',
    landing_footer_terms: 'Terms of Service',
    landing_footer_privacy: 'Privacy Policy',
    landing_faq_more_questions: 'Have More Questions?',
    landing_faq_view_all: 'View All FAQs',
    landing_back_to_home: 'Back to Home',
    landing_sign_in: 'Sign In',
    
    // Integrations Page
    integrations_page_title: 'Integrations',
    integrations_page_subtitle: 'Connect MockupSuite with your favorite tools and platforms',
    integrations_search_placeholder: 'Search integrations...',
    integrations_category_all: 'All',
    integrations_category_design_tools: 'Design Tools',
    integrations_category_ecommerce: 'E-commerce',
    integrations_category_marketing: 'Marketing',
    integrations_category_storage: 'Cloud Storage',
    integrations_coming_soon_title: 'Coming Soon',
    integrations_no_results: 'No integrations found matching "{query}"',
    integrations_loading: 'Loading integrations...',
    integrations_error_loading: 'Failed to load integrations. Please try again.',
    
    // Integration Card
    integration_status_connected: 'Connected',
    integration_status_coming_soon: 'Coming Soon',
    integration_connect_button: 'Connect',
    integration_disconnect_button: 'Disconnect',
    integration_sync_button: 'Sync',
    integration_browse_button: 'Browse Files',
    integration_save_button: 'Save to Cloud',
    integration_sync_products_button: 'Sync Products',
    
    // Connection Modal
    connection_modal_title: 'Connect to {platform}',
    connection_modal_connecting: 'Connecting to {platform}...',
    connection_modal_instructions: 'Click the button below to authorize MockupSuite to access your {platform} account.',
    connection_modal_authorize_button: 'Authorize',
    connection_modal_cancel_button: 'Cancel',
    connection_modal_disconnect_title: 'Disconnect from {platform}?',
    connection_modal_disconnect_message: 'Are you sure you want to disconnect from {platform}? You will lose access to synced data.',
    connection_modal_disconnect_confirm: 'Yes, Disconnect',
    connection_modal_disconnect_cancel: 'Cancel',
    
    // Integration Success Messages
    integration_connected_success: 'Successfully connected to {platform}!',
    integration_disconnected_success: 'Successfully disconnected from {platform}',
    integration_sync_success: 'Successfully synced with {platform}',
    integration_products_imported: '{count} products imported from {platform}',
    integrations_products_imported: '{count} products imported',
    integration_mockup_published: 'Mockup published to {platform}',
    integrations_mockups_published: '{count} mockups published',
    integration_files_saved: '{count} files saved to {platform}',
    integrations_files_uploaded: '{count} files uploaded',
    integration_design_imported: 'Design imported from {platform}',
    
    // Integration Error Messages
    integration_error_connection_failed: 'Failed to connect to {platform}. Please try again.',
    integration_error_oauth_failed: 'Authorization failed. Please check your permissions and try again.',
    integration_error_token_expired: 'Your connection to {platform} has expired. Please reconnect.',
    integration_error_api_error: 'An error occurred while communicating with {platform}.',
    integration_error_sync_failed: 'Failed to sync data with {platform}. Please try again later.',
    integration_error_invalid_credentials: 'Invalid credentials for {platform}. Please reconnect.',
    integration_error_rate_limit: 'Too many requests to {platform}. Please wait and try again.',
    integration_error_network: 'Network error. Please check your connection and try again.',
    integration_error_disconnection_failed: 'Failed to disconnect from {platform}. Please try again.',
    integration_error_no_files_selected: 'No files selected. Please select files to save.',
    integration_error_upload_failed: 'Failed to upload files to {platform}. Please try again.',
    integration_error_no_folder_selected: 'Please select a Google Drive folder first from the Integrations page.',
    integration_select_folder_button: 'Select Folder',
    integration_select_folder_title: 'Select Google Drive Folder',
    integration_root_folder: 'Root Folder (My Drive)',
    integration_no_folders: 'No folders found. Files will be uploaded to root.',
    integration_select_folder_confirm: 'Select Folder',
    integration_folder_selected: 'Folder selected: {folder}',
    
    // OAuth Callback Messages
    integration_oauth_processing: 'Processing authorization...',
    integration_oauth_error: 'Failed to complete authorization',
    integration_oauth_invalid_callback: 'Invalid OAuth callback parameters',
    integration_oauth_success_title: 'Connection Successful!',
    integration_oauth_error_title: 'Authorization Failed',
    integration_oauth_redirecting: 'Redirecting...',
    integration_oauth_closing: 'This window will close automatically...',
};

export type Translations = typeof en;
