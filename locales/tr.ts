import { Translations } from './en';

export const tr: Translations = {
    // App
    app_title: 'MockupSuite',
    prompt_label: 'Mockup Açıklaması',
    prompt_placeholder: 'Örn: Yüklenen ürün fotoğrafı ahşap bir masanın üzerinde, arkada bir bitki ile.',
    generate_button: 'Mockup Oluştur',
    generate_button_loading: 'Oluşturuluyor...',
    suggest_button: 'Fikir Öner',
    suggest_button_loading: 'Düşünülüyor...',
    
    // Main Page
    create_mockup_title: 'Mockup\'ını Oluştur',

    // Modes
    mode_scene: 'Sahne Oluşturma',
    mode_product: 'Ürün Mockup\'ları',
    mode_video: 'Video',
    mode_background_remover: 'Arkaplan Silici',

    // Spinner
    spinner_title: 'İsteğiniz işleniyor...',
    spinner_description: 'Bu biraz zaman alabilir. Lütfen bekleyin.',
    
    // --- Scene Mode ---
    // Image Uploader (Scene Mode)
    uploader_title: '1. Ürün Fotoğraf(lar)ınızı Yükleyin',
    uploader_cta_multi: 'Yüklemek için tıklayın veya sürükleyip bırakın',
    uploader_cta_alt: 'resimlerinizi buraya',
    uploader_add_more: 'Daha fazla resim ekle',
    uploader_file_types: 'PNG, JPG, WEBP desteklenmektedir',
    // Prompt
    scene_prompt_title: '2. Sahneyi Tanımlayın',
    // Aspect Ratio
    aspect_ratio_label: '3. En-Boy Oranını Seçin',
    aspect_ratio_square: 'Kare (1:1)',
    aspect_ratio_landscape: 'Yatay (16:9)',
    aspect_ratio_portrait: 'Dikey (9:16)',

    // --- Video Mode ---
    video_prompt_title: '2. Videonuzu Tanımlayın',
    video_prompt_placeholder: 'Oluşturmak istediğiniz video animasyonunu açıklayın...',
    video_duration_label: '3. Süre',
    video_aspect_ratio_label: '4. En-Boy Oranı',
    generate_video_button: 'Video Oluştur',
    generate_video_button_loading: 'Video Oluşturuluyor...',
    download_video_button: 'Videoyu İndir',
    remove_video_button: 'Kaldır',
    video_saved_to_project: 'Projeye kaydedildi',
    video_saved_success: 'Video başarıyla kaydedildi!',
    video_save_error: 'Video kaydedilemedi. Lütfen tekrar deneyin.',
    video_removed_success: 'Video başarıyla kaldırıldı!',
    video_remove_error: 'Video kaldırılamadı. Lütfen tekrar deneyin.',
    video_download_error: 'Video indirilemedi. Lütfen tekrar deneyin.',

    // Background Remover
    background_remover_title: 'Arkaplan Silici',
    background_remover_description: 'Arka planını kaldırmak için bir resim yükleyin. Araç sağ tarafta görüntülenecektir.',
    grid_video_placeholder_title: 'Videonuz burada görünecek',
    grid_video_placeholder_description: 'Başlamak için bir resim yükleyin ve videonuzu tanımlayın',
    video_prompt_suggestion_base: 'Bu görsel için yaratıcı video animasyon fikirleri önerin',

    // --- Product Mockup Mode ---
    step_1_title: '1. Tasarımınızı Yükleyin',
    design_uploader_title: '1. Tasarımınızı Yükleyin',
    design_uploader_cta_title: 'Dosyanızı buraya sürükleyip bırakın veya gözatın.',
    design_uploader_cta_subtitle: 'Desteklenenler: PNG, JPG, SVG. Maks boyut: 10MB.',
    design_uploader_cta_button: 'Dosya Yükle',
    step_2_title: '2. Bir Ürün Seçin',
    step_2_subtitle: 'Tasarımınızı uygulamak için bir şablon seçin.',
    search_products_placeholder: 'Ürünleri ara...',
    all_categories_option: 'Tüm Kategoriler',
    step_3_title: '3. Özelleştir',
    color_label: 'Ürün Rengi',
    style_selector_title: 'Stil Önayarları',
    style_preset_studio: 'Stüdyo',

    // Migration
    migration_title: 'Verilerinizi Taşıyın',
    migration_description: 'Tarayıcınızda mevcut veri bulduk. Hesabınıza taşımak ister misiniz?',
    migration_button_migrate: 'Verileri Taşı',
    migration_button_skip: 'Atla',
    migration_button_cancel: 'İptal',
    migration_in_progress: 'Verileriniz taşınıyor...',
    migration_success_title: 'Taşıma Başarılı!',
    migration_success_description: 'Verileriniz başarıyla hesabınıza taşındı.',
    migration_error_title: 'Taşıma Başarısız',
    migration_error_description: 'Taşıma sırasında bazı hatalar oluştu. Yerel verileriniz korundu.',
    migration_partial_success: 'Taşıma bazı hatalarla tamamlandı.',
    migration_stats: 'Taşınan: {projects} proje, {mockups} mockup, {templates} şablon',
    migration_button_close: 'Kapat',
    migration_button_retry: 'Tekrar Dene',
    style_preset_lifestyle: 'Yaşam Tarzı',
    style_preset_outdoor: 'Dış Mekan',
    style_preset_flatlay: 'Düz Çekim',
    style_prompt_label: 'Stil Detayları (İsteğe Bağlı)',
    style_prompt_placeholder: 'örn: model üzerinde, dramatik ışıklandırma',
    
    // Generated Image Grid
    grid_title: 'Oluşturulan Mockup\'lar',
    grid_batch_placeholder_title: 'Oluşturulan mockup\'larınız burada görünecektir.',
    grid_batch_placeholder_description: 'Başlamak için soldaki adımları tamamlayın.',
    download_button: 'İndir',
    save_button: 'Kaydet',
    saved_button: 'Kaydedildi',
    use_in_scene_button: 'Sahnede Kullan',

    // Saved Image Grid
    saved_grid_title: 'Kaydedilen Mockup\'lar',
    download_all_button: 'Tümünü İndir',
    saved_grid_placeholder: 'Kaydedilen resimleriniz burada görünecektir. Kaydetmek için oluşturulan bir resimdeki yıldız simgesine tıklayın.',
    remove_button: 'Kaldır',

    // Image Modal
    image_modal_title: 'Oluşturulan Resim Önizlemesi',
    image_modal_close_button: 'Önizlemeyi kapat',

    // Errors
    error_title: 'Bir Hata Oluştu',
    error_no_image_or_prompt: 'Lütfen oluşturmadan önce en az bir resim yükleyin ve bir açıklama girin.',
    error_no_product_or_design: 'Lütfen oluşturmadan önce bir ürün seçin ve bir logo veya tasarım yükleyin.',
    error_no_image_for_suggestions: 'Öneri almak için lütfen önce bir resim yükleyin.',
    error_suggestions_failed: 'Üzgünüz, şu anda öneri oluşturamadık. Lütfen tekrar deneyin.',
    error_unknown: 'Bilinmeyen bir hata oluştu. Lütfen daha fazla ayrıntı için konsolu kontrol edin.',
    error_loading_data: 'Verileriniz yüklenemedi. Lütfen sayfayı yenileyin.',
    error_not_authenticated: 'Mockup oluşturmak için giriş yapmalısınız.',
    error_video_generation_failed: 'Video oluşturulamadı. Lütfen tekrar deneyin.',
    error_video_upload_failed: 'Video yüklenemedi. Lütfen bağlantınızı kontrol edin.',
    error_invalid_video_source: 'Lütfen video oluşturma için geçerli bir resim yükleyin.',
    error_video_quota_exceeded: 'Video oluşturma limitinize ulaştınız.',
    error_video_timeout: 'Video oluşturma zaman aşımına uğradı. Lütfen tekrar deneyin.',
    error_video_api_unavailable: 'Video oluşturma şu anda kullanılamıyor. Bu özellik Google\'ın Veo API\'si genel kullanıma açıldığında etkinleştirilecektir.',

    // Progress Text
    progress_text_generating: '"{fileName}" için oluşturuluyor ({current}/{total})...',
    progress_text_generating_video: 'Video oluşturuluyor... Bu 60 saniyeye kadar sürebilir.',
    progress_text_uploading_video: 'Video yükleniyor...',
    progress_text_downloading_video: 'Video indirmeye hazırlanıyor...',

    // Prompt Suggestions
    prompt_suggestion_base: 'Yüklenen resme dayanarak 4 farklı ve yaratıcı mockup sahnesi açıklaması sağlayın. Açıklamalar kısa ve ilham verici olmalıdır. Örneğin: "Buharı tüten bir fincan kahvenin yanında temiz bir mermer tezgah üzerinde." veya "Bulanık bir şehir sokağı arka planına karşı bir elde tutuluyor."',
    suggest_prompts: 'Fikir Öner',
    suggesting_prompts: 'Öneriliyor...',
    suggested_prompts_label: 'Önerilen promptlar:',
    
    // Project Manager
    project_manager_title: 'Projeler',
    create_project_button: 'Yeni Proje Oluştur',
    delete_project_button: 'Projeyi Sil',
    new_project_default_name: 'Yeni Proje',
    default_project_name: 'İlk Projem',
    loading_project: 'Proje yükleniyor...',

    // Brand Kit
    brand_kit_title: 'Marka Kiti',
    logo_label: 'Marka Logosu (Filigran için)',
    logo_upload_cta: 'Logo Yükle',
    logo_replace_cta: 'Logoyu Değiştir',
    use_watermark_label: 'Oluşturulan resimlere filigran ekle',
    colors_label: 'Marka Renkleri',
    add_color_placeholder: 'Hex renk kodu ekle (örn: #4F46E5)',
    add_color_button: 'Ekle',
    copy_color_tooltip: 'Panoya kopyala',

    // Prompt Templates
    prompt_templates_title: 'Şablonlarım',
    save_prompt_button: 'Mevcut prompt\'u şablon olarak kaydet',
    no_templates_placeholder: 'Henüz kaydedilmiş şablon yok.',
    
    // Gallery Page (Old)
    nav_generate: 'Oluştur',
    nav_gallery: 'Galeri',
    nav_account: 'Hesap',
    generate_new_mockup_button: 'Yeni Mockup Oluştur',
    gallery_title: 'Galerim',
    gallery_subtitle: 'Yapay zeka tarafından oluşturulan mockup\'larınıza göz atın, yönetin ve indirin.',
    select_multiple_button: 'Çoklu Seçim',
    search_mockups_label: 'Mockup Ara',
    search_mockups_placeholder: "örn: 'Tişört'",
    filter_by_label: 'Filtrele',
    project_filter_label: 'Proje',
    all_projects_option: 'Tüm Projeler',
    date_filter_label: 'Tarih Aralığı',
    sort_by_label: 'Sırala',
    sort_newest: 'En Yeni',
    sort_oldest: 'En Eski',
    sort_name_az: 'İsim (A-Z)',
    share_button: 'Paylaş',
    edit_button: 'Düzenle',
    delete_button: 'Sil',
    favorite_button: 'Favorilere Ekle',
    unfavorite_button: 'Favorilerden Kaldır',
    
    // App Header
    nav_create_new: 'Yeni Oluştur',
    nav_integrations: 'Entegrasyonlar',
    nav_help: 'Yardım',
    upgrade_button: 'Yükselt',

    // Dashboard / Account Page
    dashboard_title: 'Çalışmalarım',
    dashboard_nav_creations: 'Çalışmalarım',
    dashboard_nav_profile: 'Profil',
    dashboard_nav_settings: 'Ayarlar',
    dashboard_nav_logout: 'Çıkış Yap',
    dashboard_generate_new_button: 'Yeni Mock-up Oluştur',
    dashboard_search_placeholder: 'Çalışmalarımda ara...',
    dashboard_filter_all: 'Tümü',
    dashboard_filter_by_product: 'Ürüne Göre',
    dashboard_filter_by_date: 'Tarihe Göre',
    dashboard_card_created: 'Oluşturuldu',
    dashboard_view_button: 'Görüntüle',
    dashboard_empty_title: 'Henüz Çalışma Yok',
    dashboard_empty_subtitle: 'Henüz bir mock-up oluşturmadınız. Başlamak ve tasarımlarınızı hayata geçirmek için aşağıdaki düğmeye tıklayın!',
    dashboard_empty_button: 'İlk Mock-up\'ını Oluştur',

    // Authentication
    auth_sign_in: 'Giriş Yap',
    auth_sign_up: 'Kayıt Ol',
    auth_sign_out: 'Çıkış Yap',
    auth_email: 'E-posta',
    auth_password: 'Şifre',
    auth_confirm_password: 'Şifreyi Onayla',
    auth_forgot_password: 'Şifrenizi mi unuttunuz?',
    auth_reset_password: 'Şifreyi Sıfırla',
    auth_send_reset_link: 'Sıfırlama Bağlantısı Gönder',
    auth_back_to_sign_in: 'Giriş Sayfasına Dön',
    auth_no_account: 'Hesabınız yok mu?',
    auth_have_account: 'Zaten hesabınız var mı?',
    auth_sign_in_with_google: 'Google ile giriş yap',
    auth_sign_in_with_github: 'GitHub ile giriş yap',
    auth_or_continue_with: 'Veya şununla devam et',
    auth_email_placeholder: 'sen@ornek.com',
    auth_password_placeholder: 'Şifrenizi girin',
    auth_confirm_password_placeholder: 'Şifrenizi onaylayın',
    auth_signing_in: 'Giriş yapılıyor...',
    auth_signing_up: 'Hesap oluşturuluyor...',
    auth_sending_reset: 'Bağlantı gönderiliyor...',
    auth_reset_sent: 'Şifre sıfırlama bağlantısı gönderildi! E-postanızı kontrol edin.',
    auth_passwords_dont_match: 'Şifreler eşleşmiyor',
    auth_invalid_email: 'Lütfen geçerli bir e-posta adresi girin',
    auth_password_too_short: 'Şifre en az 6 karakter olmalıdır',
    auth_error_occurred: 'Bir hata oluştu. Lütfen tekrar deneyin.',

    // Offline Indicator
    offline_status: 'Çevrimdışı',
    online_status: 'Çevrimiçi',
    syncing_status: 'Senkronize ediliyor...',
    sync_complete: 'Senkronize edildi',
    pending_changes: '{count} bekleyen değişiklik',
    sync_failed: 'Senkronizasyon başarısız',
    retry_sync: 'Tekrar Dene',

    // Error Messages
    error_auth_failed: 'Kimlik doğrulama başarısız. Lütfen kimlik bilgilerinizi kontrol edin ve tekrar deneyin.',
    error_auth_session_expired: 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.',
    error_database_save_failed: 'Verileriniz kaydedilemedi. Lütfen tekrar deneyin.',
    error_database_load_failed: 'Verileriniz yüklenemedi. Lütfen sayfayı yenileyin.',
    error_database_delete_failed: 'Silinemedi. Lütfen tekrar deneyin.',
    error_storage_upload_failed: 'Dosya yüklenemedi. Lütfen dosyayı kontrol edin ve tekrar deneyin.',
    error_storage_download_failed: 'Dosya indirilemedi. Lütfen tekrar deneyin.',
    error_storage_delete_failed: 'Dosya silinemedi. Lütfen tekrar deneyin.',
    error_network_connection: 'Ağ bağlantısı kesildi. Lütfen internet bağlantınızı kontrol edin.',
    error_network_timeout: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
    error_quota_exceeded: 'Depolama kotası aşıldı. Lütfen bazı dosyaları silin veya planınızı yükseltin.',
    error_validation_invalid_input: 'Geçersiz veri sağlandı. Lütfen girişinizi kontrol edin ve tekrar deneyin.',
    error_validation_file_too_large: 'Dosya çok büyük. Maksimum boyut {maxSize}MB.',
    error_validation_invalid_file_type: 'Geçersiz dosya türü. İzin verilen türler: {allowedTypes}.',
    error_retry_failed: 'İşlem birden fazla denemeden sonra başarısız oldu. Lütfen daha sonra tekrar deneyin.',
    
    // Payment Error Messages
    error_payment_failed: 'Ödeme başarısız oldu. Lütfen ödeme bilgilerinizi kontrol edin ve tekrar deneyin.',
    error_payment_cancelled: 'Ödeme iptal edildi. Devam etmek isterseniz lütfen tekrar deneyin.',
    error_payment_invalid_card: 'Geçersiz kart bilgisi. Lütfen kart bilgilerinizi kontrol edin.',
    error_payment_insufficient_funds: 'Yetersiz bakiye. Lütfen hesap bakiyenizi kontrol edin.',
    error_payment_processing: 'Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.',
    error_payment_timeout: 'Ödeme isteği zaman aşımına uğradı. Lütfen tekrar deneyin.',
    error_payment_network: 'Ödeme sırasında ağ hatası oluştu. Lütfen bağlantınızı kontrol edin ve tekrar deneyin.',
    
    // Quota Error Messages
    error_quota_exhausted: 'Aylık kotanız tükendi. Devam etmek için lütfen planınızı yükseltin.',
    error_quota_insufficient: 'Bu işlemi tamamlamak için yetersiz kota. Lütfen planınızı yükseltin.',
    error_no_credits: 'Krediniz kalmadı. Devam etmek için lütfen kredi satın alın.',
    error_subscription_expired: 'Aboneliğinizin süresi doldu. Devam etmek için lütfen yenileyin.',
    error_subscription_inactive: 'Aboneliğiniz aktif değil. Lütfen aboneliğinizi aktifleştirin veya yenileyin.',
    error_plan_selection_required: 'Hizmeti kullanmaya devam etmek için lütfen bir plan seçin.',
    
    // Toast Notifications
    toast_success: 'Başarılı!',
    toast_error: 'Hata',
    toast_warning: 'Uyarı',
    toast_info: 'Bilgi',

    // Pricing / Plan Selection
    pricing_title: 'Mükemmel Planı Bulun',
    pricing_subtitle: 'Size uygun planı seçin ve yaratıcı potansiyelinizi ortaya çıkarın.',
    pricing_most_popular: 'En Popüler',
    pricing_per_month: '/ay',
    pricing_start_free: 'Ücretsiz Başla',
    pricing_choose_plan: 'Planı Seç',
    pricing_processing: 'İşleniyor...',
    pricing_footer_note: 'Tüm planlar 30 günlük dönem içindir. İstediğiniz zaman iptal edebilirsiniz.',
    
    // Payment Checkout
    payment_checkout_title: 'Güvenli Ödeme',
    payment_checkout_preparing: 'Ödeme sayfası hazırlanıyor...',
    payment_checkout_redirecting: 'Lütfen bekleyin, güvenli ödeme sayfasına yönlendiriliyorsunuz.',
    payment_checkout_retrying: 'Tekrar deneniyor...',
    payment_checkout_failed_title: 'Ödeme Başarısız',
    payment_checkout_retry_button: 'Tekrar Dene',
    payment_checkout_cancel_button: 'İptal',
    payment_checkout_close_button: 'Kapat',
    payment_checkout_secure_payment: 'Güvenli ödeme - İyzico tarafından sağlanmaktadır',
    payment_checkout_plan_label: 'Plan',
    payment_checkout_package_label: 'Paket',
    
    // Plan Names
    pricing_plan_free_name: 'Ücretsiz',
    pricing_plan_starter_name: 'Başlangıç',
    pricing_plan_pro_name: 'Pro',
    pricing_plan_business_name: 'İşletme',
    
    // Plan Descriptions
    pricing_plan_free_description: 'Temel özelliklerimizi denemek için.',
    pricing_plan_starter_description: 'Profesyoneller ve küçük ekipler için.',
    pricing_plan_pro_description: 'Yoğun kullanım için en iyi seçim.',
    pricing_plan_business_description: 'Büyük ekipler ve ajanslar için.',
    
    // Plan Features
    pricing_feature_quota: '{quota} mockup oluşturma/ay',
    pricing_feature_watermark: 'Filigran ile',
    pricing_feature_no_watermark: 'Filigransız',
    pricing_feature_resolution: '{resolution} çözünürlük',
    pricing_feature_high_resolution: 'Yüksek çözünürlük (4K\'ya kadar)',
    pricing_feature_priority_queue: 'Öncelikli işleme',
    pricing_feature_priority_support: 'Öncelikli destek',
    pricing_feature_email_support: 'E-posta desteği',
    pricing_feature_community_support: 'Topluluk desteği',
    
    // Quota Widget
    quota_widget_active_plan: 'Aktif Plan',
    quota_widget_plan_status: 'Plan Durumu',
    quota_widget_remaining_quota: 'Kalan Kota',
    quota_widget_remaining_image_quota: 'Kalan Görsel Kotası',
    quota_widget_remaining_video_quota: 'Kalan Video Kotası',
    quota_widget_used_mockups: '{used} mockup kullanıldı',
    quota_widget_used_videos: '{used} video oluşturuldu',
    quota_widget_renewal_date: 'Yenileme tarihi',
    quota_widget_expired: 'Süresi doldu',
    quota_widget_today: 'Bugün',
    quota_widget_tomorrow: 'Yarın',
    quota_widget_in_days: '{days} gün içinde',
    quota_widget_credit_balance: 'Kredi Bakiyesi',
    quota_widget_credits: '{credits} kredi',
    quota_widget_credits_note: 'Kota bittiğinde kullanılabilir',
    quota_widget_upgrade_now: 'Şimdi Yükselt',
    quota_widget_renew_plan: 'Planı Yenile',
    quota_widget_low_quota_warning: '⚠️ Kotanız azalıyor. Daha fazla mockup oluşturmak için planınızı yükseltin.',
    quota_widget_exhausted_warning: '🚫 Kotanız tükendi.',
    quota_widget_exhausted_with_credits: 'Kredi bakiyeniz kullanılacak.',
    quota_widget_exhausted_upgrade: 'Devam etmek için yükseltin.',
    quota_widget_loading_error: 'Kota bilgileri yüklenemedi',
    
    // Upgrade Modal
    upgrade_modal_title: 'Planınızı Yükseltin',
    upgrade_modal_quota_exhausted_message: 'Aylık kotanız tükendi. Daha fazla mockup oluşturmak için planınızı yükseltin.',
    upgrade_modal_renewal_reminder_message: 'Aboneliğiniz yakında yenilenecek. Daha fazla özellik için planınızı yükseltmeyi düşünün.',
    upgrade_modal_manual_message: 'Daha fazla mockup oluşturun ve premium özelliklerin keyfini çıkarın.',
    upgrade_modal_current_plan: 'Mevcut Planınız',
    upgrade_modal_remaining: 'kalan',
    upgrade_modal_compare_plans: 'Planları Karşılaştır',
    upgrade_modal_prorated_today: 'Bugün ödenecek',
    upgrade_modal_prorated_explanation: 'Kalan dönem için orantılı ücret',
    upgrade_modal_upgrade_button: 'Hemen Yükselt',
    upgrade_modal_footer_note: 'Planınızı istediğiniz zaman değiştirebilir veya iptal edebilirsiniz.',
    
    // Upgrade Success/Error Messages
    upgrade_success_message: 'Planınız başarıyla yükseltildi!',
    upgrade_error_message: 'Planınız yükseltilemedi. Lütfen tekrar deneyin.',
    
    // Profile Page
    profile_page_title: 'Profil Detayları',
    profile_first_name: 'Ad',
    profile_last_name: 'Soyad',
    profile_email: 'E-posta Adresi',
    profile_upload_avatar: 'Yeni resim yükle',
    profile_uploading_avatar: 'Yükleniyor...',
    profile_save_changes: 'Değişiklikleri Kaydet',
    profile_cancel: 'İptal',
    profile_subscription_title: 'Abonelik Planı',
    profile_current_plan: 'Mevcut Plan',
    profile_manage_subscription: 'Aboneliği Yönet',
    profile_sign_out: 'Çıkış Yap',
    
    // Menu
    menu_sign_out: 'Çıkış Yap',
    profile_avatar_upload_success: 'Avatar başarıyla güncellendi!',
    profile_avatar_upload_error: 'Avatar yüklenemedi. Lütfen tekrar deneyin.',
    profile_invalid_file_type: 'Geçersiz dosya türü. Lütfen JPEG, PNG, WebP veya GIF resmi yükleyin.',
    profile_file_too_large: 'Dosya boyutu 5MB sınırını aşıyor.',
    
    // Profile Sidebar
    profile_nav_profile: 'Profil Detayları',
    profile_nav_settings: 'Hesap Ayarları',
    profile_nav_security: 'Güvenlik',
    profile_nav_subscription: 'Abonelik',
    profile_nav_generations: 'Oluşturduklarım',
    
    // Profile Header
    profile_user_avatar: 'Kullanıcı avatarı',
    
    // Personal Info Form
    profile_personal_info_title: 'Kişisel Bilgiler',
    profile_first_name_placeholder: 'Adınızı girin',
    profile_last_name_placeholder: 'Soyadınızı girin',
    profile_email_readonly_note: 'E-posta değiştirilemez',
    profile_first_name_required: 'Ad gereklidir',
    profile_last_name_required: 'Soyad gereklidir',
    profile_first_name_too_long: 'Ad 50 karakter veya daha az olmalıdır',
    profile_last_name_too_long: 'Soyad 50 karakter veya daha az olmalıdır',
    profile_update_success: 'Profil başarıyla güncellendi',
    profile_update_failed: 'Profil güncellenemedi. Lütfen tekrar deneyin.',
    profile_not_found: 'Profil bulunamadı. Lütfen sayfayı yenileyin.',
    profile_saving: 'Kaydediliyor...',
    
    // Subscription Section
    subscription_section_title: 'Abonelik Planı',
    subscription_status_active: 'Aktif',
    subscription_status_cancelled: 'İptal Edildi',
    subscription_status_expired: 'Süresi Doldu',
    subscription_per_month: '/ay',
    subscription_renews_on: '{date} tarihinde yenilenir',
    subscription_access_until: '{date} tarihine kadar erişim',
    subscription_monthly_generations: 'Aylık Oluşturmalar',
    subscription_resets_on: '{date} tarihinde sıfırlanır',
    subscription_plan_features: 'Plan Özellikleri',
    subscription_generations_per_month: 'Ayda {quota} oluşturma',
    subscription_max_resolution: '{resolution}px çözünürlüğe kadar',
    subscription_no_watermark: 'Filigransız',
    subscription_high_resolution: 'Yüksek çözünürlüklü indirmeler',
    subscription_priority_queue: 'Öncelikli kuyruk işleme',
    subscription_priority_support: 'Öncelikli destek',
    subscription_email_support: 'E-posta desteği',
    subscription_no_subscription: 'Abonelik bulunamadı',
    subscription_loading_error: 'Abonelik verileri yüklenemedi',
    subscription_try_again: 'Tekrar dene',
    subscription_low_quota_warning: 'Oluşturma kotanız azalıyor. Oluşturmaya devam etmek için planınızı yükseltmeyi düşünün.',
    subscription_no_quota_warning: 'Bu ay için tüm oluşturmalarınızı kullandınız. Devam etmek için yükseltin veya {date} tarihine kadar bekleyin.',
    
    // Help Center
    help_center_title: 'Yardım Merkezi',
    help_center_subtitle: 'Bir sorunuz mu var? Cevabını burada bulun.',
    help_center_search_placeholder: 'Soru ara...',
    help_center_contact_title: 'Aradığınızı bulamadınız mı?',
    help_center_contact_description: 'Destek ekibimiz her zaman yardıma hazır. Sorularınız için bize ulaşın.',
    help_center_contact_button: 'Destek ile İletişime Geç',
    help_center_no_results: '"{query}" için sonuç bulunamadı. Farklı anahtar kelimeler deneyin veya kategorilere göz atın.',
    
    // FAQ Categories
    faq_category_all: 'Tümü',
    faq_category_getting_started: 'Başlarken',
    faq_category_billing: 'Faturalandırma',
    faq_category_ai_features: 'Yapay Zeka Özellikleri',
    faq_category_troubleshooting: 'Sorun Giderme',
    faq_category_privacy: 'Gizlilik',
    
    // FAQ Items - Getting Started
    faq_gs_1_question: 'MockupSuite nedir?',
    faq_gs_1_answer: 'MockupSuite, ürün görsellerinizi ve tasarımlarınızı yükleyerek otomatik olarak profesyonel, yüksek kaliteli fotoğraflar ve mockup\'lar oluşturmanıza olanak tanıyan yapay zeka destekli bir mockup oluşturucudur. E-ticaret, pazarlama ve tasarım sunumları için mükemmeldir.',
    
    faq_gs_2_question: 'MockupSuite\'i kullanmaya nasıl başlarım?',
    faq_gs_2_answer: 'Başlamak çok kolay! Ücretsiz bir hesap oluşturun, ürün fotoğrafınızı veya tasarımınızı yükleyin, istediğiniz sahneyi tanımlayın veya bir ürün şablonu seçin ve oluştur\'a tıklayın. Profesyonel mockup\'ınız saniyeler içinde hazır olacak.',
    
    faq_gs_3_question: 'Ne tür mockup\'lar oluşturabilirim?',
    faq_gs_3_answer: 'İki tür mockup oluşturabilirsiniz: Sahne Oluşturma (ürün fotoğraflarını özel arka planlarla stüdyo kalitesinde görsellere dönüştürme) ve Ürün Mockup\'ları (tasarımları giyim, ev eşyaları, baskı malzemeleri ve teknoloji ürünleri gibi şablonlara uygulama).',
    
    faq_gs_4_question: 'MockupSuite\'i kullanmak için tasarım deneyimine ihtiyacım var mı?',
    faq_gs_4_answer: 'Tasarım deneyimi gerekmez! MockupSuite herkes için kullanıcı dostu olacak şekilde tasarlanmıştır. Sadece görselinizi yükleyin, ne istediğinizi tanımlayın ve yapay zekamız gerisini halleder. Arayüz sezgiseldir ve her adımda size rehberlik eder.',
    
    faq_gs_5_question: 'MockupSuite\'i mobil cihazlarda kullanabilir miyim?',
    faq_gs_5_answer: 'Evet! MockupSuite tamamen duyarlıdır ve cep telefonları, tabletler ve masaüstü bilgisayarlarda sorunsuz çalışır. İnternet bağlantısı olan herhangi bir cihazdan profesyonel mockup\'lar oluşturabilirsiniz.',
    
    // FAQ Items - Billing
    faq_billing_1_question: 'Hangi abonelik planlarını sunuyorsunuz?',
    faq_billing_1_answer: 'Dört plan sunuyoruz: Ücretsiz (5 mockup/ay), Başlangıç (299 TRY karşılığında 50 mockup/ay), Pro (649 TRY karşılığında 200 mockup/ay) ve İşletme (1.199 TRY karşılığında 700 mockup/ay). Tüm ücretli planlar yüksek çözünürlüklü dışa aktarma ve filigransız içerik içerir.',
    
    faq_billing_2_question: 'Aboneliğimi istediğim zaman iptal edebilir miyim?',
    faq_billing_2_answer: 'Evet, aboneliğinizi hesap ayarlarınızdan istediğiniz zaman iptal edebilirsiniz. Planınız mevcut fatura döneminin sonuna kadar aktif kalacak ve tekrar ücretlendirilmeyeceksiniz.',
    
    faq_billing_3_question: 'Aylık kotam bittiğinde ne olur?',
    faq_billing_3_answer: 'Aylık kotanız tükendiğinde, daha yüksek bir plana yükseltebilir veya kredi paketleri satın alabilirsiniz. Kredilerin süresi dolmaz ve kotanız bittiğinde her zaman kullanılabilir.',
    
    faq_billing_4_question: 'Para iadesi sunuyor musunuz?',
    faq_billing_4_answer: 'İlk kez abone olanlar için 14 günlük para iade garantisi sunuyoruz. Hizmetten memnun kalmazsanız, ilk satın alma işleminizden sonraki 14 gün içinde destek ekibimizle iletişime geçerek tam para iadesi alabilirsiniz.',
    
    faq_billing_5_question: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
    faq_billing_5_answer: 'Güvenli ödeme işlemcimiz İyzico aracılığıyla tüm büyük kredi kartlarını (Visa, Mastercard, American Express) ve banka kartlarını kabul ediyoruz. Tüm işlemler şifrelenmiş ve güvenlidir.',
    
    faq_billing_6_question: 'Kredi sistemi nasıl çalışır?',
    faq_billing_6_answer: 'Krediler, aylık kotanız bittiğinde satın alabileceğiniz ek oluşturma birimleridir. Aylık kotalardan farklı olarak, kredilerin süresi dolmaz ve kullanılana kadar hesabınızda kalır. Bir kredi, bir mockup oluşturmaya eşittir.',
    
    // FAQ Items - AI Features
    faq_ai_1_question: 'MockupSuite\'i hangi yapay zeka teknolojisi destekliyor?',
    faq_ai_1_answer: 'MockupSuite, görsel oluşturma için Google\'ın Gemini 2.5 Flash yapay zeka modelini kullanır. Bu gelişmiş yapay zeka, mükemmel ışıklandırma, gölgeler ve perspektifle fotorealistik mockup\'lar oluşturur.',
    
    faq_ai_2_question: 'Bir mockup oluşturmak ne kadar sürer?',
    faq_ai_2_answer: 'Çoğu mockup 10-30 saniye içinde oluşturulur. Pro ve İşletme planı aboneleri daha da hızlı oluşturma süreleri için öncelikli işleme alır.',
    
    faq_ai_3_question: 'Oluşturulan mockup\'ları özelleştirebilir miyim?',
    faq_ai_3_answer: 'Evet! Detaylı sahne açıklamaları sağlayarak, farklı ürün şablonları seçerek, renkler seçerek ve stil önayarları uygulayarak mockup\'ları özelleştirebilirsiniz. Açıklamanız ne kadar spesifik olursa, sonuçlar o kadar iyi olur.',
    
    faq_ai_4_question: 'Yüklemeler için hangi dosya formatları destekleniyor?',
    faq_ai_4_answer: 'JPEG, PNG, WEBP ve GIF formatlarını destekliyoruz. En iyi sonuçlar için, temiz arka planlı yüksek çözünürlüklü görseller yüklemenizi öneririz. Maksimum dosya boyutu 10MB\'dir.',
    
    faq_ai_5_question: 'Aynı anda birden fazla mockup oluşturabilir miyim?',
    faq_ai_5_answer: 'Evet! Birden fazla ürün görseli yükleyebilir ve hepsi için tek bir toplu işlemde mockup\'lar oluşturabilirsiniz. Her görsel ayrı ayrı işlenecek ve tamamlandıkça sonuçları göreceksiniz.',
    
    faq_ai_6_question: 'Oluşturulan mockup\'ların çözünürlüğü nedir?',
    faq_ai_6_answer: 'Ücretsiz plan kullanıcıları filigran içeren standart çözünürlüklü mockup\'lar alır. Ücretli plan aboneleri, profesyonel kullanım için mükemmel olan, filigransız 4K kaliteye kadar yüksek çözünürlüklü dışa aktarmalar alır.',
    
    // FAQ Items - Troubleshooting
    faq_trouble_1_question: 'Mockup oluşturmam neden başarısız oluyor?',
    faq_trouble_1_answer: 'Oluşturma hataları çeşitli nedenlerden kaynaklanabilir: düşük görsel kalitesi, desteklenmeyen dosya formatı, ağ sorunları veya kota tükenmesi. Dosya formatınızı kontrol edin, kalan kotanızın olduğundan emin olun ve kararlı bir internet bağlantısıyla tekrar deneyin.',
    
    faq_trouble_2_question: 'Oluşturulan mockup açıklamamla eşleşmiyor. Ne yapmalıyım?',
    faq_trouble_2_answer: 'Açıklamanızda daha spesifik olmayı deneyin. Işıklandırma, arka plan, perspektif ve stil hakkında detaylar ekleyin. İlham almak için prompt şablonlarımızı veya öneri özelliğimizi de kullanabilirsiniz.',
    
    faq_trouble_3_question: 'Oluşturulan mockup\'ların kalitesini nasıl artırabilirim?',
    faq_trouble_3_answer: 'Yüksek çözünürlüklü kaynak görseller yükleyin, detaylı ve spesifik açıklamalar sağlayın, stil önayarlarını kullanın ve maksimum çözünürlük (4K\'ya kadar) için Pro veya İşletme planlarına yükseltmeyi düşünün.',
    
    faq_trouble_4_question: 'Görsellerim galeride yüklenmiyor. Ne yapmalıyım?',
    faq_trouble_4_answer: 'Bu genellikle geçici bir sorundur. Sayfayı yenilemeyi, tarayıcı önbelleğinizi temizlemeyi veya internet bağlantınızı kontrol etmeyi deneyin. Sorun devam ederse, destek ekibimizle iletişime geçin.',
    
    faq_trouble_5_question: 'Memnun kalmazsam bir mockup\'ı yeniden oluşturabilir miyim?',
    faq_trouble_5_answer: 'Evet! Mockup\'ları istediğiniz kadar (kota limitiniz dahilinde) yeniden oluşturabilirsiniz. Her oluşturma bir kota birimi veya kredi kullanır. Farklı sonuçlar için açıklamanızı veya ayarlarınızı değiştirmeyi deneyin.',
    
    faq_trouble_6_question: 'Yapay zeka neden bazen beklenmedik öğeler ekliyor?',
    faq_trouble_6_answer: 'Yapay zeka oluşturma doğası gereği yaratıcıdır ve prompt\'ları farklı yorumlayabilir. Daha öngörülebilir sonuçlar almak için açıklamalarınızda çok spesifik olun ve istenmeyen öğeleri hariç tutmak için negatif prompt\'lar kullanın.',
    
    // FAQ Items - Privacy
    faq_privacy_1_question: 'Verilerim ve gizliliğim nasıl korunuyor?',
    faq_privacy_1_answer: 'Veri gizliliğini çok ciddiye alıyoruz. Yüklenen tüm görseller ve oluşturulan içerik Supabase kullanılarak şifrelenir ve güvenli bir şekilde saklanır. Verilerinizi size hizmet sağlamak dışında hiçbir amaçla kullanmıyoruz.',
    
    faq_privacy_2_question: 'Oluşturulan mockup\'ların sahibi kim?',
    faq_privacy_2_answer: 'MockupSuite kullanarak oluşturduğunuz tüm mockup\'ların tam sahipliğini ve ticari haklarını siz saklarsınız. Atıf yapmadan ticari projeler dahil olmak üzere herhangi bir amaç için kullanabilirsiniz.',
    
    faq_privacy_3_question: 'Görsellerimi üçüncü taraflarla paylaşıyor musunuz?',
    faq_privacy_3_answer: 'Hayır, görsellerinizi asla üçüncü taraflarla paylaşmıyoruz. Yüklemeleriniz ve oluşturulan mockup\'larınız özeldir ve yalnızca hesabınız aracılığıyla size erişilebilir.',
    
    faq_privacy_4_question: 'Verilerimi silebilir miyim?',
    faq_privacy_4_answer: 'Evet, galerinizden istediğiniz zaman tek tek mockup\'ları silebilirsiniz. Tüm hesabınızı ve ilişkili tüm verileri silmek isterseniz, destek ekibimizle iletişime geçin ve talebinizi 30 gün içinde işleme koyacağız.',
    
    faq_privacy_5_question: 'Ödeme bilgilerim güvende mi?',
    faq_privacy_5_answer: 'Kesinlikle. PCI-DSS uyumlu bir ödeme işlemcisi olan İyzico kullanıyoruz. Kredi kartı bilgilerinizi asla sunucularımızda saklamıyoruz. Tüm ödeme verileri şifrelenir ve ödeme ortağımız tarafından güvenli bir şekilde işlenir.',
    
    faq_privacy_6_question: 'Görsellerimi yapay zeka modellerini eğitmek için kullanıyor musunuz?',
    faq_privacy_6_answer: 'Hayır, yüklediğiniz görselleri veya oluşturulan mockup\'ları yapay zeka modellerini eğitmek için kullanmıyoruz. İçeriğiniz özel kalır ve yalnızca talep ettiğiniz hizmeti sağlamak için kullanılır.',
    
    // Landing Page
    landing_nav_features: 'Özellikler',
    landing_nav_pricing: 'Fiyatlandırma',
    landing_nav_faq: 'SSS',
    landing_nav_contact: 'İletişim',
    landing_get_started_free: 'Ücretsiz Başla',
    landing_hero_title: 'Yapay Zeka ile Saniyeler İçinde Muhteşem Ürün Mockup\'ları Oluşturun.',
    landing_hero_subtitle: 'Ürün fotoğraflarınızı profesyonel stüdyo çekimlerine dönüştürün ve anında gerçekçi mockup\'lar oluşturun. Stüdyoya gerek yok.',
    landing_hero_generate_button: 'Mockup Oluştur',
    landing_hero_examples_button: 'Örnekleri Gör',
    landing_how_it_works_title: 'Nasıl Çalışır',
    landing_step_1_title: '1. Görselinizi Yükleyin',
    landing_step_1_description: 'Ürününüzün basit bir fotoğrafı veya benzersiz tasarım dosyanızla başlayın.',
    landing_step_2_title: '2. Yapay Zeka Sihirini Yapsın',
    landing_step_2_description: 'Yapay zekamız görselinizi analiz eder ve yüksek kaliteli, gerçekçi mockup\'lar oluşturur.',
    landing_step_3_title: '3. Mockup\'ınızı İndirin',
    landing_step_3_description: 'Mağazanız veya sosyal medyanız için stüdyo kalitesinde fotoğraflarınızı hazırlayın.',
    landing_features_title: 'Ürününüzün Görsellerini Yükseltin',
    landing_features_subtitle: 'Mockup oluşturmayı zahmetsiz ve profesyonel hale getiren güçlü özellikleri keşfedin.',
    landing_feature_1_title: 'Stüdyo Kalitesinde Fotoğraflar',
    landing_feature_1_description: 'Profesyonel bir stüdyoda çekilmiş gibi görünen fotorealistik görseller oluşturun.',
    landing_feature_2_title: 'Anında Mockup\'lar',
    landing_feature_2_description: 'Tasarımlarınızı giyimden baskıya kadar çeşitli ürünlere anında yerleştirin.',
    landing_feature_3_title: 'Mükemmel Işıklandırma ve Gölgeler',
    landing_feature_3_description: 'Yapay zekamız mükemmel gerçekçi bir sonuç için ışıklandırmayı ve gölgeleri otomatik olarak ayarlar.',
    landing_feature_4_title: 'Sınırsız Arka Planlar',
    landing_feature_4_description: 'Geniş bir arka plan kütüphanesinden seçin veya markanıza uygun özel bir tane oluşturun.',
    landing_cta_title: 'Ürününüzün Görsellerini Yükseltmeye Hazır mısınız?',
    landing_cta_subtitle: 'Yapay zeka ile ürün görsellerini dönüştüren işletmelerin arasına katılın. Profesyonel mockup\'lar oluşturmaya bugün başlayın—tamamen ücretsiz.',
    landing_cta_button: 'Hemen Başla',
    landing_footer_copyright: '© 2025 MockupSuite. Tüm hakları saklıdır.',
    landing_footer_about: 'Hakkımızda',
    landing_footer_contact: 'İletişim',
    landing_footer_terms: 'Hizmet Şartları',
    landing_footer_privacy: 'Gizlilik Politikası',
    landing_faq_more_questions: 'Daha Fazla Sorunuz mu Var?',
    landing_faq_view_all: 'Tüm SSS\'leri Görüntüle',
    landing_back_to_home: 'Ana Sayfaya Dön',
    landing_sign_in: 'Giriş Yap',
    
    // Integrations Page
    integrations_page_title: 'Entegrasyonlar',
    integrations_page_subtitle: 'MockupSuite\'i favori araçlarınız ve platformlarınızla bağlayın',
    integrations_search_placeholder: 'Entegrasyonları ara...',
    integrations_category_all: 'Tümü',
    integrations_category_design_tools: 'Tasarım Araçları',
    integrations_category_ecommerce: 'E-ticaret',
    integrations_category_marketing: 'Pazarlama',
    integrations_category_storage: 'Bulut Depolama',
    integrations_coming_soon_title: 'Yakında',
    integrations_no_results: '"{query}" ile eşleşen entegrasyon bulunamadı',
    integrations_loading: 'Entegrasyonlar yükleniyor...',
    integrations_error_loading: 'Entegrasyonlar yüklenemedi. Lütfen tekrar deneyin.',
    
    // Integration Card
    integration_status_connected: 'Bağlı',
    integration_status_coming_soon: 'Yakında',
    integration_connect_button: 'Bağlan',
    integration_disconnect_button: 'Bağlantıyı Kes',
    integration_sync_button: 'Senkronize Et',
    integration_browse_button: 'Dosyalara Gözat',
    integration_save_button: 'Buluta Kaydet',
    integration_sync_products_button: 'Ürünleri Senkronize Et',
    
    // Connection Modal
    connection_modal_title: '{platform}\'a Bağlan',
    connection_modal_connecting: '{platform}\'a bağlanılıyor...',
    connection_modal_instructions: 'MockupSuite\'in {platform} hesabınıza erişmesine izin vermek için aşağıdaki düğmeye tıklayın.',
    connection_modal_authorize_button: 'Yetkilendir',
    connection_modal_cancel_button: 'İptal',
    connection_modal_disconnect_title: '{platform}\'dan bağlantı kesilsin mi?',
    connection_modal_disconnect_message: '{platform}\'dan bağlantıyı kesmek istediğinizden emin misiniz? Senkronize edilmiş verilere erişiminizi kaybedeceksiniz.',
    connection_modal_disconnect_confirm: 'Evet, Bağlantıyı Kes',
    connection_modal_disconnect_cancel: 'İptal',
    
    // Integration Success Messages
    integration_connected_success: '{platform}\'a başarıyla bağlandı!',
    integration_disconnected_success: '{platform}\'dan başarıyla bağlantı kesildi',
    integration_sync_success: '{platform} ile başarıyla senkronize edildi',
    integration_products_imported: '{platform}\'dan {count} ürün içe aktarıldı',
    integrations_products_imported: '{count} ürün içe aktarıldı',
    integration_mockup_published: 'Mockup {platform}\'da yayınlandı',
    integrations_mockups_published: '{count} mockup yayınlandı',
    integration_files_saved: '{count} dosya {platform}\'a kaydedildi',
    integrations_files_uploaded: '{count} dosya yüklendi',
    integration_design_imported: '{platform}\'dan tasarım içe aktarıldı',
    
    // Integration Error Messages
    integration_error_connection_failed: '{platform}\'a bağlanılamadı. Lütfen tekrar deneyin.',
    integration_error_oauth_failed: 'Yetkilendirme başarısız. Lütfen izinlerinizi kontrol edin ve tekrar deneyin.',
    integration_error_token_expired: '{platform}\'a bağlantınızın süresi doldu. Lütfen yeniden bağlanın.',
    integration_error_api_error: '{platform} ile iletişim kurulurken bir hata oluştu.',
    integration_error_sync_failed: '{platform} ile veri senkronizasyonu başarısız. Lütfen daha sonra tekrar deneyin.',
    integration_error_invalid_credentials: '{platform} için geçersiz kimlik bilgileri. Lütfen yeniden bağlanın.',
    integration_error_rate_limit: '{platform}\'a çok fazla istek. Lütfen bekleyin ve tekrar deneyin.',
    integration_error_network: 'Ağ hatası. Lütfen bağlantınızı kontrol edin ve tekrar deneyin.',
    integration_error_disconnection_failed: '{platform}\'dan bağlantı kesilemedi. Lütfen tekrar deneyin.',
    integration_error_no_files_selected: 'Dosya seçilmedi. Lütfen kaydetmek için dosya seçin.',
    integration_error_upload_failed: '{platform}\'a dosya yüklenemedi. Lütfen tekrar deneyin.',
    
    // OAuth Callback Messages
    integration_oauth_processing: 'Yetkilendirme işleniyor...',
    integration_oauth_error: 'Yetkilendirme tamamlanamadı',
    integration_oauth_invalid_callback: 'Geçersiz OAuth geri dönüş parametreleri',
    integration_oauth_success_title: 'Bağlantı Başarılı!',
    integration_oauth_error_title: 'Yetkilendirme Başarısız',
    integration_oauth_redirecting: 'Yönlendiriliyor...',
    integration_oauth_closing: 'Bu pencere otomatik olarak kapanacak...',
    integration_error_no_folder_selected: 'Lütfen önce Entegrasyonlar sayfasından bir Google Drive klasörü seçin.',
    integration_select_folder_button: 'Klasör Seç',
    integration_select_folder_title: 'Google Drive Klasörü Seç',
    integration_root_folder: 'Kök Klasör (Drive\'ım)',
    integration_no_folders: 'Klasör bulunamadı. Dosyalar köke yüklenecek.',
    integration_select_folder_confirm: 'Klasörü Seç',
    integration_folder_selected: 'Seçilen klasör: {folder}',
};
