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

    // Progress Text
    progress_text_generating: '"{fileName}" için oluşturuluyor ({current}/{total})...',

    // Prompt Suggestions
    prompt_suggestion_base: 'Yüklenen resme dayanarak 4 farklı ve yaratıcı mockup sahnesi açıklaması sağlayın. Açıklamalar kısa ve ilham verici olmalıdır. Örneğin: "Buharı tüten bir fincan kahvenin yanında temiz bir mermer tezgah üzerinde." veya "Bulanık bir şehir sokağı arka planına karşı bir elde tutuluyor."',
    
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
    error_unknown: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
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
    quota_widget_used_mockups: '{used} mockup kullanıldı',
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
};