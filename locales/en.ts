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

    // Progress Text
    progress_text_generating: 'Generating for "{fileName}" ({current}/{total})...',

    // Prompt Suggestions
    prompt_suggestion_base: 'Based on the uploaded image, provide 4 diverse and creative mockup scene descriptions. The descriptions should be brief and inspiring. For example: "On a clean marble countertop next to a steaming cup of coffee." or "Held in a hand against a blurred city street background."',

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
    quota_widget_used_mockups: '{used} mockups used',
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
};

export type Translations = typeof en;