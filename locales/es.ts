import { Translations } from './en';

export const es: Translations = {
    // App
    app_title: 'MockupSuite',
    prompt_label: 'Descripción de la Maqueta',
    prompt_placeholder: 'Ej: Una foto de producto de la imagen subida sobre una mesa de madera, con una planta al fondo.',
    generate_button: 'Generar Maquetas',
    generate_button_loading: 'Generando...',
    suggest_button: 'Sugerir Ideas',
    suggest_button_loading: 'Pensando...',
    
    // Main Page
    create_mockup_title: 'Crea Tu Maqueta',

    // Modes
    mode_scene: 'Generación de Escenas',
    mode_product: 'Maquetas de Productos',
    mode_video: 'Video',
    mode_background_remover: 'Quitar Fondo',

    // Spinner
    spinner_title: 'Procesando tu solicitud...',
    spinner_description: 'Esto puede tardar un momento. Por favor, espera.',

    // --- Scene Mode ---
    // Image Uploader (Scene Mode)
    uploader_title: '1. Sube tu(s) Foto(s) de Producto',
    uploader_cta_multi: 'Haz clic para subir o arrastra y suelta',
    uploader_cta_alt: 'tus imágenes aquí',
    uploader_add_more: 'Añadir más imágenes',
    uploader_file_types: 'Soporta PNG, JPG, WEBP',
    // Prompt
    scene_prompt_title: '2. Describe la Escena',
    // Aspect Ratio
    aspect_ratio_label: '3. Seleccionar Relación de Aspecto',
    aspect_ratio_square: 'Cuadrado (1:1)',
    aspect_ratio_landscape: 'Horizontal (16:9)',
    aspect_ratio_portrait: 'Vertical (9:16)',

    // --- Video Mode ---
    video_prompt_title: '2. Describe Tu Video',
    video_prompt_placeholder: 'Describe la animación de video que quieres crear...',
    video_duration_label: '3. Duración',
    video_aspect_ratio_label: '4. Relación de Aspecto',
    generate_video_button: 'Generar Video',
    generate_video_button_loading: 'Generando Video...',
    download_video_button: 'Descargar Video',
    remove_video_button: 'Eliminar',
    video_saved_to_project: 'Guardado en el proyecto',
    video_saved_success: '¡Video guardado exitosamente!',
    video_save_error: 'Error al guardar el video. Por favor, inténtalo de nuevo.',
    video_removed_success: '¡Video eliminado exitosamente!',
    video_remove_error: 'Error al eliminar el video. Por favor, inténtalo de nuevo.',
    video_download_error: 'Error al descargar el video. Por favor, inténtalo de nuevo.',

    // Background Remover
    background_remover_title: 'Eliminador de Fondo',
    background_remover_description: 'Sube una imagen para eliminar su fondo. La herramienta se mostrará en el lado derecho.',
    grid_video_placeholder_title: 'Tu video aparecerá aquí',
    grid_video_placeholder_description: 'Sube una imagen y describe tu video para comenzar',
    video_prompt_suggestion_base: 'Sugiere ideas creativas de animación de video para esta imagen',

    // --- Product Mockup Mode ---
    step_1_title: '1. Sube tu Diseño',
    design_uploader_title: '1. Sube tu Diseño',
    design_uploader_cta_title: 'Arrastra y suelta tu archivo aquí, o búscalo.',
    design_uploader_cta_subtitle: 'Soporta: PNG, JPG, SVG. Tamaño máx: 10MB.',
    design_uploader_cta_button: 'Subir Archivo',
    step_2_title: '2. Elige un Producto',
    step_2_subtitle: 'Selecciona una plantilla para aplicar tu diseño.',
    search_products_placeholder: 'Buscar productos...',
    all_categories_option: 'Todas las Categorías',
    step_3_title: '3. Personalizar',
    color_label: 'Color del Producto',
    style_selector_title: 'Estilos Predefinidos',
    style_preset_studio: 'Estudio',

    // Migration
    migration_title: 'Migrar Tus Datos',
    migration_description: 'Encontramos datos existentes en tu navegador. ¿Te gustaría migrarlos a tu cuenta?',
    migration_button_migrate: 'Migrar Datos',
    migration_button_skip: 'Omitir',
    migration_button_cancel: 'Cancelar',
    migration_in_progress: 'Migrando tus datos...',
    migration_success_title: '¡Migración Exitosa!',
    migration_success_description: 'Tus datos se han migrado exitosamente a tu cuenta.',
    migration_error_title: 'Migración Fallida',
    migration_error_description: 'Ocurrieron algunos errores durante la migración. Tus datos locales se han conservado.',
    migration_partial_success: 'Migración completada con algunos errores.',
    migration_stats: 'Migrado: {projects} proyectos, {mockups} mockups, {templates} plantillas',
    migration_button_close: 'Cerrar',
    migration_button_retry: 'Reintentar',
    style_preset_lifestyle: 'Estilo de Vida',
    style_preset_outdoor: 'Exterior',
    style_preset_flatlay: 'Plano Cenital',
    style_prompt_label: 'Detalles de Estilo (Opcional)',
    style_prompt_placeholder: 'ej: usado por un modelo, luz dramática',

    // Generated Image Grid
    grid_title: 'Maquetas Generadas',
    grid_batch_placeholder_title: 'Tus maquetas generadas aparecerán aquí.',
    grid_batch_placeholder_description: 'Completa los pasos a la izquierda para empezar.',
    download_button: 'Descargar',
    save_button: 'Guardar',
    saved_button: 'Guardado',
    use_in_scene_button: 'Usar en Escena',

    // Saved Image Grid
    saved_grid_title: 'Maquetas Guardadas',
    download_all_button: 'Descargar Todas',
    saved_grid_placeholder: 'Tus imágenes guardadas aparecerán aquí. Haz clic en el icono de estrella en una imagen generada para guardarla.',
    remove_button: 'Eliminar',

    // Image Modal
    image_modal_title: 'Vista Previa de Imagen Generada',
    image_modal_close_button: 'Cerrar vista previa',

    // Errors
    error_title: 'Ocurrió un Error',
    error_no_image_or_prompt: 'Por favor, sube al menos una imagen y proporciona una descripción antes de generar.',
    error_no_product_or_design: 'Por favor, selecciona un producto y sube un logo o diseño antes de generar.',
    error_no_image_for_suggestions: 'Por favor, sube primero una imagen para obtener sugerencias.',
    error_suggestions_failed: 'Lo sentimos, no pudimos generar sugerencias en este momento. Por favor, inténtalo de nuevo.',
    error_unknown: 'Ocurrió un error desconocido. Por favor, revisa la consola para más detalles.',
    error_loading_data: 'No se pudieron cargar tus datos. Por favor, actualiza la página.',
    error_not_authenticated: 'Debes iniciar sesión para generar mockups.',
    error_video_generation_failed: 'No se pudo generar el video. Por favor, inténtalo de nuevo.',
    error_video_upload_failed: 'No se pudo subir el video. Por favor, verifica tu conexión.',
    error_invalid_video_source: 'Por favor, sube una imagen válida para la generación de video.',
    error_video_quota_exceeded: 'Has alcanzado tu límite de generación de videos.',
    error_video_timeout: 'La generación de video agotó el tiempo de espera. Por favor, inténtalo de nuevo.',
    error_video_api_unavailable: 'La generación de video no está disponible actualmente. Esta función se habilitará una vez que la API Veo de Google esté disponible públicamente.',

    // Progress Text
    progress_text_generating: 'Generando para "{fileName}" ({current}/{total})...',
    progress_text_generating_video: 'Generando video... Esto puede tardar hasta 60 segundos.',
    progress_text_uploading_video: 'Subiendo video...',
    progress_text_downloading_video: 'Preparando video para descarga...',

    // Prompt Suggestions
    prompt_suggestion_base: 'Basado en la imagen subida, proporciona 4 descripciones de escenas de maqueta diversas y creativas. Las descripciones deben ser breves e inspiradoras. Por ejemplo: "Sobre una encimera de mármol limpia junto a una taza de café humeante." o "Sostenido en una mano con un fondo de calle de ciudad borroso."',
    suggest_prompts: 'Sugerir Ideas',
    suggesting_prompts: 'Sugiriendo...',
    suggested_prompts_label: 'Sugerencias de prompts:',
    
    // Project Manager
    project_manager_title: 'Proyectos',
    create_project_button: 'Crear Nuevo Proyecto',
    delete_project_button: 'Eliminar Proyecto',
    new_project_default_name: 'Nuevo Proyecto',
    default_project_name: 'Mi Primer Proyecto',
    loading_project: 'Cargando proyecto...',

    // Brand Kit
    brand_kit_title: 'Kit de Marca',
    logo_label: 'Logo de Marca (para Marca de Agua)',
    logo_upload_cta: 'Subir Logo',
    logo_replace_cta: 'Reemplazar Logo',
    use_watermark_label: 'Aplicar marca de agua a las imágenes generadas',
    colors_label: 'Colores de Marca',
    add_color_placeholder: 'Añadir color hex (ej: #4F46E5)',
    add_color_button: 'Añadir',
    copy_color_tooltip: 'Copiar al portapapeles',

    // Prompt Templates
    prompt_templates_title: 'Mis Plantillas',
    save_prompt_button: 'Guardar prompt actual como plantilla',
    no_templates_placeholder: 'Aún no hay plantillas guardadas.',
    
    // Gallery Page (Old)
    nav_generate: 'Generar',
    nav_gallery: 'Galería',
    nav_account: 'Cuenta',
    generate_new_mockup_button: 'Generar Nueva Maqueta',
    gallery_title: 'Mi Galería',
    gallery_subtitle: 'Explora, gestiona y descarga tus maquetas generadas por IA.',
    select_multiple_button: 'Selección Múltiple',
    search_mockups_label: 'Buscar Maquetas',
    search_mockups_placeholder: "ej: 'Camiseta'",
    filter_by_label: 'Filtrar por',
    project_filter_label: 'Proyecto',
    all_projects_option: 'Todos los Proyectos',
    date_filter_label: 'Rango de Fechas',
    sort_by_label: 'Ordenar por',
    sort_newest: 'Más Recientes',
    sort_oldest: 'Más Antiguos',
    sort_name_az: 'Nombre (A-Z)',
    share_button: 'Compartir',
    edit_button: 'Editar',
    delete_button: 'Eliminar',
    favorite_button: 'Favorito',
    unfavorite_button: 'Quitar de Favoritos',
    
    // App Header
    nav_create_new: 'Crear Nuevo',
    nav_integrations: 'Integraciones',
    nav_help: 'Ayuda',
    upgrade_button: 'Actualizar',

    // Dashboard / Account Page
    dashboard_title: 'Mis Creaciones',
    dashboard_nav_creations: 'Mis Creaciones',
    dashboard_nav_profile: 'Perfil',
    dashboard_nav_settings: 'Ajustes',
    dashboard_nav_logout: 'Cerrar Sesión',
    dashboard_generate_new_button: 'Generar Nueva Maqueta',
    dashboard_search_placeholder: 'Buscar mis creaciones...',
    dashboard_filter_all: 'Todo',
    dashboard_filter_by_product: 'Por Producto',
    dashboard_filter_by_date: 'Por Fecha',
    dashboard_card_created: 'Creado',
    dashboard_view_button: 'Ver',
    dashboard_empty_title: 'Aún No Hay Creaciones',
    dashboard_empty_subtitle: 'No has generado ninguna maqueta. ¡Haz clic en el botón de abajo para empezar y dar vida a tus diseños!',
    dashboard_empty_button: 'Genera Tu Primera Maqueta',

    // Authentication
    auth_sign_in: 'Iniciar Sesión',
    auth_sign_up: 'Registrarse',
    auth_sign_out: 'Cerrar Sesión',
    auth_email: 'Correo Electrónico',
    auth_password: 'Contraseña',
    auth_confirm_password: 'Confirmar Contraseña',
    auth_forgot_password: '¿Olvidaste tu contraseña?',
    auth_reset_password: 'Restablecer Contraseña',
    auth_send_reset_link: 'Enviar Enlace de Restablecimiento',
    auth_back_to_sign_in: 'Volver a Iniciar Sesión',
    auth_no_account: '¿No tienes una cuenta?',
    auth_have_account: '¿Ya tienes una cuenta?',
    auth_sign_in_with_google: 'Iniciar sesión con Google',
    auth_sign_in_with_github: 'Iniciar sesión con GitHub',
    auth_or_continue_with: 'O continuar con',
    auth_email_placeholder: 'tu@ejemplo.com',
    auth_password_placeholder: 'Ingresa tu contraseña',
    auth_confirm_password_placeholder: 'Confirma tu contraseña',
    auth_signing_in: 'Iniciando sesión...',
    auth_signing_up: 'Creando cuenta...',
    auth_sending_reset: 'Enviando enlace...',
    auth_reset_sent: '¡Enlace de restablecimiento enviado! Revisa tu correo.',
    auth_passwords_dont_match: 'Las contraseñas no coinciden',
    auth_invalid_email: 'Por favor ingresa un correo electrónico válido',
    auth_password_too_short: 'La contraseña debe tener al menos 6 caracteres',
    auth_error_occurred: 'Ocurrió un error. Por favor, inténtalo de nuevo.',

    // Offline Indicator
    offline_status: 'Sin conexión',
    online_status: 'En línea',
    syncing_status: 'Sincronizando...',
    sync_complete: 'Sincronizado',
    pending_changes: '{count} cambios pendientes',
    sync_failed: 'Sincronización fallida',
    retry_sync: 'Reintentar',

    // Error Messages
    error_auth_failed: 'Autenticación fallida. Por favor, verifica tus credenciales e inténtalo de nuevo.',
    error_auth_session_expired: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    error_database_save_failed: 'No se pudieron guardar tus datos. Por favor, inténtalo de nuevo.',
    error_database_load_failed: 'No se pudieron cargar tus datos. Por favor, actualiza la página.',
    error_database_delete_failed: 'No se pudo eliminar. Por favor, inténtalo de nuevo.',
    error_storage_upload_failed: 'No se pudo subir el archivo. Por favor, verifica el archivo e inténtalo de nuevo.',
    error_storage_download_failed: 'No se pudo descargar el archivo. Por favor, inténtalo de nuevo.',
    error_storage_delete_failed: 'No se pudo eliminar el archivo. Por favor, inténtalo de nuevo.',
    error_network_connection: 'Conexión de red perdida. Por favor, verifica tu conexión a internet.',
    error_network_timeout: 'Tiempo de espera agotado. Por favor, inténtalo de nuevo.',
    error_quota_exceeded: 'Cuota de almacenamiento excedida. Por favor, elimina algunos archivos o actualiza tu plan.',
    error_validation_invalid_input: 'Datos inválidos proporcionados. Por favor, verifica tu entrada e inténtalo de nuevo.',
    error_validation_file_too_large: 'El archivo es demasiado grande. El tamaño máximo es {maxSize}MB.',
    error_validation_invalid_file_type: 'Tipo de archivo inválido. Tipos permitidos: {allowedTypes}.',
    error_retry_failed: 'La operación falló después de múltiples intentos. Por favor, inténtalo más tarde.',
    
    // Payment Error Messages
    error_payment_failed: 'Pago fallido. Por favor, verifica tus detalles de pago e inténtalo de nuevo.',
    error_payment_cancelled: 'El pago fue cancelado. Por favor, inténtalo de nuevo si deseas continuar.',
    error_payment_invalid_card: 'Información de tarjeta inválida. Por favor, verifica los detalles de tu tarjeta.',
    error_payment_insufficient_funds: 'Fondos insuficientes. Por favor, verifica el saldo de tu cuenta.',
    error_payment_processing: 'El procesamiento del pago falló. Por favor, inténtalo de nuevo.',
    error_payment_timeout: 'La solicitud de pago agotó el tiempo de espera. Por favor, inténtalo de nuevo.',
    error_payment_network: 'Error de red durante el pago. Por favor, verifica tu conexión e inténtalo de nuevo.',
    
    // Quota Error Messages
    error_quota_exhausted: 'Tu cuota mensual se ha agotado. Por favor, actualiza tu plan para continuar.',
    error_quota_insufficient: 'Cuota insuficiente para completar esta acción. Por favor, actualiza tu plan.',
    error_no_credits: 'No te quedan créditos. Por favor, compra créditos para continuar.',
    error_subscription_expired: 'Tu suscripción ha expirado. Por favor, renueva para continuar.',
    error_subscription_inactive: 'Tu suscripción no está activa. Por favor, activa o renueva tu suscripción.',
    error_plan_selection_required: 'Por favor, selecciona un plan para continuar usando el servicio.',
    
    // Toast Notifications
    toast_success: '¡Éxito!',
    toast_error: 'Error',
    toast_warning: 'Advertencia',
    toast_info: 'Información',

    // Pricing / Plan Selection
    pricing_title: 'Encuentra el Plan Perfecto',
    pricing_subtitle: 'Elige el plan adecuado para ti y desbloquea tu potencial creativo.',
    pricing_most_popular: 'Más Popular',
    pricing_per_month: '/mes',
    pricing_start_free: 'Comenzar Gratis',
    pricing_choose_plan: 'Elegir Plan',
    pricing_processing: 'Procesando...',
    pricing_footer_note: 'Todos los planes son por períodos de 30 días. Cancela en cualquier momento.',
    
    // Payment Checkout
    payment_checkout_title: 'Pago Seguro',
    payment_checkout_preparing: 'Preparando página de pago...',
    payment_checkout_redirecting: 'Por favor espera, redirigiendo a la página de pago seguro.',
    payment_checkout_retrying: 'Reintentando...',
    payment_checkout_failed_title: 'Pago Fallido',
    payment_checkout_retry_button: 'Reintentar',
    payment_checkout_cancel_button: 'Cancelar',
    payment_checkout_close_button: 'Cerrar',
    payment_checkout_secure_payment: 'Pago seguro - Proporcionado por İyzico',
    payment_checkout_plan_label: 'Plan',
    payment_checkout_package_label: 'Paquete',
    
    // Plan Names
    pricing_plan_free_name: 'Gratis',
    pricing_plan_starter_name: 'Inicial',
    pricing_plan_pro_name: 'Pro',
    pricing_plan_business_name: 'Empresarial',
    
    // Plan Descriptions
    pricing_plan_free_description: 'Para probar nuestras funciones principales.',
    pricing_plan_starter_description: 'Para profesionales y equipos pequeños.',
    pricing_plan_pro_description: 'Mejor opción para uso intensivo.',
    pricing_plan_business_description: 'Para equipos grandes y agencias.',
    
    // Plan Features
    pricing_feature_quota: '{quota} generaciones de mockup/mes',
    pricing_feature_watermark: 'Con marca de agua',
    pricing_feature_no_watermark: 'Sin marca de agua',
    pricing_feature_resolution: 'Resolución {resolution}',
    pricing_feature_high_resolution: 'Alta resolución (hasta 4K)',
    pricing_feature_priority_queue: 'Procesamiento prioritario',
    pricing_feature_priority_support: 'Soporte prioritario',
    pricing_feature_email_support: 'Soporte por correo',
    pricing_feature_community_support: 'Soporte comunitario',
    
    // Quota Widget
    quota_widget_active_plan: 'Plan Activo',
    quota_widget_plan_status: 'Estado del Plan',
    quota_widget_remaining_quota: 'Cuota Restante',
    quota_widget_remaining_image_quota: 'Cuota de Imagen Restante',
    quota_widget_remaining_video_quota: 'Cuota de Video Restante',
    quota_widget_used_mockups: '{used} maquetas usadas',
    quota_widget_used_videos: '{used} videos creados',
    quota_widget_renewal_date: 'Fecha de renovación',
    quota_widget_expired: 'Expirado',
    quota_widget_today: 'Hoy',
    quota_widget_tomorrow: 'Mañana',
    quota_widget_in_days: 'En {days} días',
    quota_widget_credit_balance: 'Saldo de Créditos',
    quota_widget_credits: '{credits} créditos',
    quota_widget_credits_note: 'Disponible cuando se agote la cuota',
    quota_widget_upgrade_now: 'Actualizar Ahora',
    quota_widget_renew_plan: 'Renovar Plan',
    quota_widget_low_quota_warning: '⚠️ Tu cuota se está agotando. Actualiza tu plan para generar más maquetas.',
    quota_widget_exhausted_warning: '🚫 Tu cuota se ha agotado.',
    quota_widget_exhausted_with_credits: 'Se usará tu saldo de créditos.',
    quota_widget_exhausted_upgrade: 'Actualiza para continuar.',
    quota_widget_loading_error: 'Error al cargar información de cuota',
    
    // Upgrade Modal
    upgrade_modal_title: 'Actualiza Tu Plan',
    upgrade_modal_quota_exhausted_message: 'Tu cuota mensual se ha agotado. Actualiza tu plan para generar más maquetas.',
    upgrade_modal_renewal_reminder_message: 'Tu suscripción se renovará pronto. Considera actualizar para más funciones.',
    upgrade_modal_manual_message: 'Genera más maquetas y disfruta de funciones premium.',
    upgrade_modal_current_plan: 'Tu Plan Actual',
    upgrade_modal_remaining: 'restante',
    upgrade_modal_compare_plans: 'Comparar Planes',
    upgrade_modal_prorated_today: 'A pagar hoy',
    upgrade_modal_prorated_explanation: 'Cargo prorrateado por el período restante',
    upgrade_modal_upgrade_button: 'Actualizar Ahora',
    upgrade_modal_footer_note: 'Puedes cambiar o cancelar tu plan en cualquier momento.',
    
    // Upgrade Success/Error Messages
    upgrade_success_message: '¡Tu plan ha sido actualizado exitosamente!',
    upgrade_error_message: 'No se pudo actualizar tu plan. Por favor, inténtalo de nuevo.',
    
    // Profile Page
    profile_page_title: 'Detalles del Perfil',
    profile_first_name: 'Nombre',
    profile_last_name: 'Apellido',
    profile_email: 'Correo Electrónico',
    profile_upload_avatar: 'Subir nueva imagen',
    profile_uploading_avatar: 'Subiendo...',
    profile_save_changes: 'Guardar Cambios',
    profile_cancel: 'Cancelar',
    profile_subscription_title: 'Plan de Suscripción',
    profile_current_plan: 'Plan Actual',
    profile_manage_subscription: 'Gestionar Suscripción',
    profile_sign_out: 'Cerrar Sesión',
    
    // Menu
    menu_sign_out: 'Cerrar Sesión',
    
    profile_avatar_upload_success: '¡Avatar actualizado exitosamente!',
    profile_avatar_upload_error: 'No se pudo subir el avatar. Por favor, inténtalo de nuevo.',
    profile_invalid_file_type: 'Tipo de archivo inválido. Por favor, sube una imagen JPEG, PNG, WebP o GIF.',
    profile_file_too_large: 'El tamaño del archivo excede el límite de 5MB.',
    
    // Profile Sidebar
    profile_nav_profile: 'Detalles del Perfil',
    profile_nav_settings: 'Configuración de Cuenta',
    profile_nav_security: 'Seguridad',
    profile_nav_subscription: 'Suscripción',
    profile_nav_generations: 'Mis Generaciones',
    
    // Profile Header
    profile_user_avatar: 'Avatar de usuario',
    
    // Personal Info Form
    profile_personal_info_title: 'Información Personal',
    profile_first_name_placeholder: 'Ingresa tu nombre',
    profile_last_name_placeholder: 'Ingresa tu apellido',
    profile_email_readonly_note: 'El correo electrónico no se puede cambiar',
    profile_first_name_required: 'El nombre es obligatorio',
    profile_last_name_required: 'El apellido es obligatorio',
    profile_first_name_too_long: 'El nombre debe tener 50 caracteres o menos',
    profile_last_name_too_long: 'El apellido debe tener 50 caracteres o menos',
    profile_update_success: 'Perfil actualizado exitosamente',
    profile_update_failed: 'No se pudo actualizar el perfil. Por favor, inténtalo de nuevo.',
    profile_not_found: 'Perfil no encontrado. Por favor, actualiza la página.',
    profile_saving: 'Guardando...',
    
    // Subscription Section
    subscription_section_title: 'Plan de Suscripción',
    subscription_status_active: 'Activo',
    subscription_status_cancelled: 'Cancelado',
    subscription_status_expired: 'Expirado',
    subscription_per_month: '/mes',
    subscription_renews_on: 'Se renueva el {date}',
    subscription_access_until: 'Acceso hasta el {date}',
    subscription_monthly_generations: 'Generaciones Mensuales',
    subscription_resets_on: 'Se reinicia el {date}',
    subscription_plan_features: 'Características del Plan',
    subscription_generations_per_month: '{quota} generaciones por mes',
    subscription_max_resolution: 'Hasta {resolution}px de resolución',
    subscription_no_watermark: 'Sin marca de agua',
    subscription_high_resolution: 'Descargas de alta resolución',
    subscription_priority_queue: 'Procesamiento de cola prioritaria',
    subscription_priority_support: 'Soporte prioritario',
    subscription_email_support: 'Soporte por correo',
    subscription_no_subscription: 'No se encontró suscripción',
    subscription_loading_error: 'Error al cargar datos de suscripción',
    subscription_try_again: 'Intentar de nuevo',
    subscription_low_quota_warning: 'Te estás quedando sin generaciones. Considera actualizar tu plan para continuar creando.',
    subscription_no_quota_warning: 'Has usado todas tus generaciones de este mes. Actualiza para continuar o espera hasta el {date}.',
    
    // Help Center
    help_center_title: 'Centro de Ayuda',
    help_center_subtitle: '¿Tienes una pregunta? Encuentra tu respuesta aquí.',
    help_center_search_placeholder: 'Buscar preguntas...',
    help_center_contact_title: '¿No encuentras lo que buscas?',
    help_center_contact_description: 'Nuestro equipo de soporte siempre está listo para ayudar. Contáctanos para cualquier pregunta que tengas.',
    help_center_contact_button: 'Contactar Soporte',
    help_center_no_results: 'No se encontraron resultados para "{query}". Prueba con diferentes palabras clave o navega por categorías.',
    
    // FAQ Categories
    faq_category_all: 'Todo',
    faq_category_getting_started: 'Primeros Pasos',
    faq_category_billing: 'Facturación',
    faq_category_ai_features: 'Características de IA',
    faq_category_troubleshooting: 'Solución de Problemas',
    faq_category_privacy: 'Privacidad',
    
    // FAQ Items - Getting Started
    faq_gs_1_question: '¿Qué es MockupSuite?',
    faq_gs_1_answer: 'MockupSuite es un generador de maquetas impulsado por IA que te permite subir tus imágenes de productos y diseños para crear fotos y maquetas profesionales de alta calidad automáticamente. Es perfecto para comercio electrónico, marketing y presentaciones de diseño.',
    
    faq_gs_2_question: '¿Cómo empiezo con MockupSuite?',
    faq_gs_2_answer: '¡Empezar es fácil! Simplemente regístrate para obtener una cuenta gratuita, sube tu foto de producto o diseño, describe la escena que deseas o selecciona una plantilla de producto, y haz clic en generar. Tu maqueta profesional estará lista en segundos.',
    
    faq_gs_3_question: '¿Qué tipos de maquetas puedo crear?',
    faq_gs_3_answer: 'Puedes crear dos tipos de maquetas: Generación de Escenas (transforma fotos de productos en imágenes de calidad de estudio con fondos personalizados) y Maquetas de Productos (aplica diseños a plantillas como ropa, artículos para el hogar, materiales impresos y productos tecnológicos).',
    
    faq_gs_4_question: '¿Necesito experiencia en diseño para usar MockupSuite?',
    faq_gs_4_answer: '¡No se requiere experiencia en diseño! MockupSuite está diseñado para ser fácil de usar para todos. Simplemente sube tu imagen, describe lo que quieres y nuestra IA se encarga del resto. La interfaz es intuitiva y te guía en cada paso.',
    
    faq_gs_5_question: '¿Puedo usar MockupSuite en dispositivos móviles?',
    faq_gs_5_answer: '¡Sí! MockupSuite es totalmente responsive y funciona perfectamente en teléfonos móviles, tabletas y computadoras de escritorio. Puedes crear maquetas profesionales desde cualquier dispositivo con conexión a internet.',
    
    // FAQ Items - Billing
    faq_billing_1_question: '¿Qué planes de suscripción ofrecen?',
    faq_billing_1_answer: 'Ofrecemos cuatro planes: Gratis (5 maquetas/mes), Inicial (50 maquetas/mes por 299 TRY), Pro (200 maquetas/mes por 649 TRY) y Empresarial (700 maquetas/mes por 1,199 TRY). Todos los planes de pago incluyen exportaciones de alta resolución y sin marcas de agua.',
    
    faq_billing_2_question: '¿Puedo cancelar mi suscripción en cualquier momento?',
    faq_billing_2_answer: 'Sí, puedes cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta. Tu plan permanecerá activo hasta el final del ciclo de facturación actual y no se te cobrará nuevamente.',
    
    faq_billing_3_question: '¿Qué sucede cuando se agota mi cuota mensual?',
    faq_billing_3_answer: 'Cuando tu cuota mensual se agota, puedes actualizar a un plan superior o comprar paquetes de créditos. Los créditos nunca expiran y se pueden usar en cualquier momento cuando tu cuota se agote.',
    
    faq_billing_4_question: '¿Ofrecen reembolsos?',
    faq_billing_4_answer: 'Ofrecemos una garantía de devolución de dinero de 14 días para suscriptores primerizos. Si no estás satisfecho con el servicio, contacta a nuestro equipo de soporte dentro de los 14 días de tu compra inicial para obtener un reembolso completo.',
    
    faq_billing_5_question: '¿Qué métodos de pago aceptan?',
    faq_billing_5_answer: 'Aceptamos todas las principales tarjetas de crédito (Visa, Mastercard, American Express) y tarjetas de débito a través de nuestro procesador de pagos seguro İyzico. Todas las transacciones están encriptadas y son seguras.',
    
    faq_billing_6_question: '¿Cómo funciona el sistema de créditos?',
    faq_billing_6_answer: 'Los créditos son unidades de generación adicionales que puedes comprar cuando tu cuota mensual se agota. A diferencia de las cuotas mensuales, los créditos nunca expiran y permanecen en tu cuenta hasta que se usen. Un crédito equivale a una generación de maqueta.',
    
    // FAQ Items - AI Features
    faq_ai_1_question: '¿Qué tecnología de IA impulsa MockupSuite?',
    faq_ai_1_answer: 'MockupSuite utiliza el modelo de IA Gemini 2.5 Flash de Google para la generación de imágenes. Esta IA avanzada crea maquetas fotorrealistas con iluminación, sombras y perspectiva perfectas.',
    
    faq_ai_2_question: '¿Cuánto tiempo tarda en generarse una maqueta?',
    faq_ai_2_answer: 'La mayoría de las maquetas se generan en 10-30 segundos. Los suscriptores de los planes Pro y Empresarial obtienen procesamiento prioritario para tiempos de generación aún más rápidos.',
    
    faq_ai_3_question: '¿Puedo personalizar las maquetas generadas?',
    faq_ai_3_answer: '¡Sí! Puedes personalizar las maquetas proporcionando descripciones detalladas de escenas, seleccionando diferentes plantillas de productos, eligiendo colores y aplicando preajustes de estilo. Cuanto más específica sea tu descripción, mejores serán los resultados.',
    
    faq_ai_4_question: '¿Qué formatos de archivo son compatibles para las cargas?',
    faq_ai_4_answer: 'Admitimos formatos JPEG, PNG, WEBP y GIF. Para obtener mejores resultados, recomendamos subir imágenes de alta resolución con un fondo limpio. El tamaño máximo de archivo es de 10MB.',
    
    faq_ai_5_question: '¿Puedo generar múltiples maquetas a la vez?',
    faq_ai_5_answer: '¡Sí! Puedes subir múltiples imágenes de productos y generar maquetas para todas ellas en un solo lote. Cada imagen se procesará individualmente y verás los resultados a medida que se completen.',
    
    faq_ai_6_question: '¿Qué resolución tienen las maquetas generadas?',
    faq_ai_6_answer: 'Los usuarios del plan gratuito reciben maquetas de resolución estándar con marcas de agua. Los suscriptores de planes de pago obtienen exportaciones de alta resolución de hasta calidad 4K sin marcas de agua, perfectas para uso profesional.',
    
    // FAQ Items - Troubleshooting
    faq_trouble_1_question: '¿Por qué falla la generación de mi maqueta?',
    faq_trouble_1_answer: 'Los fallos de generación pueden ocurrir por varias razones: mala calidad de imagen, formato de archivo no compatible, problemas de red o agotamiento de cuota. Verifica tu formato de archivo, asegúrate de tener cuota restante e intenta nuevamente con una conexión a internet estable.',
    
    faq_trouble_2_question: 'La maqueta generada no coincide con mi descripción. ¿Qué debo hacer?',
    faq_trouble_2_answer: 'Intenta ser más específico en tu descripción. Incluye detalles sobre iluminación, fondo, perspectiva y estilo. También puedes usar nuestras plantillas de prompts o la función de sugerencias para inspirarte.',
    
    faq_trouble_3_question: '¿Cómo mejoro la calidad de las maquetas generadas?',
    faq_trouble_3_answer: 'Sube imágenes fuente de alta resolución, proporciona descripciones detalladas y específicas, usa los preajustes de estilo y considera actualizar a los planes Pro o Empresarial para resolución máxima (hasta 4K).',
    
    faq_trouble_4_question: 'Mis imágenes no se cargan en la galería. ¿Qué debo hacer?',
    faq_trouble_4_answer: 'Esto suele ser un problema temporal. Intenta actualizar la página, limpiar la caché de tu navegador o verificar tu conexión a internet. Si el problema persiste, contacta a nuestro equipo de soporte.',
    
    faq_trouble_5_question: '¿Puedo regenerar una maqueta si no estoy satisfecho?',
    faq_trouble_5_answer: '¡Sí! Puedes regenerar maquetas tantas veces como quieras (dentro de tus límites de cuota). Cada generación usa una unidad de cuota o crédito. Intenta ajustar tu descripción o configuración para obtener resultados diferentes.',
    
    faq_trouble_6_question: '¿Por qué la IA a veces agrega elementos inesperados?',
    faq_trouble_6_answer: 'La generación de IA es creativa por naturaleza y puede interpretar los prompts de manera diferente. Para obtener resultados más predecibles, sé muy específico en tus descripciones y usa prompts negativos para excluir elementos no deseados.',
    
    // FAQ Items - Privacy
    faq_privacy_1_question: '¿Cómo se protegen mis datos y privacidad?',
    faq_privacy_1_answer: 'Nos tomamos muy en serio la privacidad de los datos. Todas las imágenes cargadas y el contenido generado se cifran y almacenan de forma segura usando Supabase. No usamos tus datos para ningún propósito que no sea proporcionarte el servicio.',
    
    faq_privacy_2_question: '¿Quién es el propietario de las maquetas generadas?',
    faq_privacy_2_answer: 'Conservas la propiedad completa y los derechos comerciales de todas las maquetas que generas usando MockupSuite. Puedes usarlas para cualquier propósito, incluidos proyectos comerciales, sin atribución.',
    
    faq_privacy_3_question: '¿Comparten mis imágenes con terceros?',
    faq_privacy_3_answer: 'No, nunca compartimos tus imágenes con terceros. Tus cargas y maquetas generadas son privadas y solo accesibles para ti a través de tu cuenta.',
    
    faq_privacy_4_question: '¿Puedo eliminar mis datos?',
    faq_privacy_4_answer: 'Sí, puedes eliminar maquetas individuales de tu galería en cualquier momento. Si deseas eliminar toda tu cuenta y todos los datos asociados, contacta a nuestro equipo de soporte y procesaremos tu solicitud dentro de 30 días.',
    
    faq_privacy_5_question: '¿Es segura mi información de pago?',
    faq_privacy_5_answer: 'Absolutamente. Usamos İyzico, un procesador de pagos compatible con PCI-DSS. Nunca almacenamos tu información de tarjeta de crédito en nuestros servidores. Todos los datos de pago están cifrados y manejados de forma segura por nuestro socio de pagos.',
    
    faq_privacy_6_question: '¿Usan mis imágenes para entrenar modelos de IA?',
    faq_privacy_6_answer: 'No, no usamos tus imágenes cargadas o maquetas generadas para entrenar modelos de IA. Tu contenido permanece privado y solo se usa para proporcionar el servicio que solicitaste.',
    
    // Landing Page
    landing_nav_features: 'Características',
    landing_nav_pricing: 'Precios',
    landing_nav_faq: 'Preguntas Frecuentes',
    landing_nav_contact: 'Contacto',
    landing_get_started_free: 'Comenzar Gratis',
    landing_hero_title: 'Crea Impresionantes Mockups de Productos en Segundos con IA.',
    landing_hero_subtitle: 'Transforma tus fotos de productos en tomas de estudio profesionales y genera mockups realistas al instante. No se requiere estudio.',
    landing_hero_generate_button: 'Generar Mockup',
    landing_hero_examples_button: 'Ver Ejemplos',
    landing_how_it_works_title: 'Cómo Funciona',
    landing_step_1_title: '1. Sube Tu Imagen',
    landing_step_1_description: 'Comienza con una foto simple de tu producto o tu archivo de diseño único.',
    landing_step_2_title: '2. Deja que la IA Haga su Magia',
    landing_step_2_description: 'Nuestra IA analiza tu imagen y genera mockups realistas de alta calidad.',
    landing_step_3_title: '3. Descarga Tu Mockup',
    landing_step_3_description: 'Obtén tus fotos de calidad de estudio listas para tu tienda o redes sociales.',
    landing_features_title: 'Eleva las Visuales de Tu Producto',
    landing_features_subtitle: 'Descubre las potentes características que hacen que la creación de mockups sea fácil y profesional.',
    landing_feature_1_title: 'Fotos de Calidad de Estudio',
    landing_feature_1_description: 'Genera imágenes fotorrealistas que parecen tomadas en un estudio profesional.',
    landing_feature_2_title: 'Mockups Instantáneos',
    landing_feature_2_description: 'Coloca instantáneamente tus diseños en una variedad de productos, desde ropa hasta impresión.',
    landing_feature_3_title: 'Iluminación y Sombras Perfectas',
    landing_feature_3_description: 'Nuestra IA ajusta automáticamente la iluminación y las sombras para un resultado perfectamente realista.',
    landing_feature_4_title: 'Fondos Infinitos',
    landing_feature_4_description: 'Elige de una vasta biblioteca de fondos o genera uno personalizado para que coincida con tu marca.',
    landing_cta_title: '¿Listo para Elevar las Visuales de Tu Producto?',
    landing_cta_subtitle: 'Únete a miles de creadores y empresas que transforman sus visuales de productos con IA. Comienza a crear mockups profesionales hoy—completamente gratis.',
    landing_cta_button: 'Comenzar Ahora',
    landing_footer_copyright: '© 2025 MockupSuite. Todos los derechos reservados.',
    landing_footer_about: 'Sobre Nosotros',
    landing_footer_contact: 'Contacto',
    landing_footer_terms: 'Términos de Servicio',
    landing_footer_privacy: 'Política de Privacidad',
    landing_faq_more_questions: '¿Tienes Más Preguntas?',
    landing_faq_view_all: 'Ver Todas las Preguntas Frecuentes',
    landing_back_to_home: 'Volver al Inicio',
    landing_sign_in: 'Iniciar Sesión',
    
    // Integrations Page
    integrations_page_title: 'Integraciones',
    integrations_page_subtitle: 'Conecta MockupSuite con tus herramientas y plataformas favoritas',
    integrations_search_placeholder: 'Buscar integraciones...',
    integrations_category_all: 'Todo',
    integrations_category_design_tools: 'Herramientas de Diseño',
    integrations_category_ecommerce: 'Comercio Electrónico',
    integrations_category_marketing: 'Marketing',
    integrations_category_storage: 'Almacenamiento en la Nube',
    integrations_coming_soon_title: 'Próximamente',
    integrations_no_results: 'No se encontraron integraciones que coincidan con "{query}"',
    integrations_loading: 'Cargando integraciones...',
    integrations_error_loading: 'Error al cargar integraciones. Por favor, inténtalo de nuevo.',
    
    // Integration Card
    integration_status_connected: 'Conectado',
    integration_status_coming_soon: 'Próximamente',
    integration_connect_button: 'Conectar',
    integration_disconnect_button: 'Desconectar',
    integration_sync_button: 'Sincronizar',
    integration_browse_button: 'Explorar Archivos',
    integration_save_button: 'Guardar en la Nube',
    integration_sync_products_button: 'Sincronizar Productos',
    
    // Connection Modal
    connection_modal_title: 'Conectar a {platform}',
    connection_modal_connecting: 'Conectando a {platform}...',
    connection_modal_instructions: 'Haz clic en el botón de abajo para autorizar a MockupSuite a acceder a tu cuenta de {platform}.',
    connection_modal_authorize_button: 'Autorizar',
    connection_modal_cancel_button: 'Cancelar',
    connection_modal_disconnect_title: '¿Desconectar de {platform}?',
    connection_modal_disconnect_message: '¿Estás seguro de que quieres desconectarte de {platform}? Perderás el acceso a los datos sincronizados.',
    connection_modal_disconnect_confirm: 'Sí, Desconectar',
    connection_modal_disconnect_cancel: 'Cancelar',
    
    // Integration Success Messages
    integration_connected_success: '¡Conectado exitosamente a {platform}!',
    integration_disconnected_success: 'Desconectado exitosamente de {platform}',
    integration_sync_success: 'Sincronizado exitosamente con {platform}',
    integration_products_imported: '{count} productos importados de {platform}',
    integrations_products_imported: '{count} productos importados',
    integration_mockup_published: 'Mockup publicado en {platform}',
    integrations_mockups_published: '{count} mockups publicados',
    integration_files_saved: '{count} archivos guardados en {platform}',
    integrations_files_uploaded: '{count} archivos subidos',
    integration_design_imported: 'Diseño importado de {platform}',
    
    // Integration Error Messages
    integration_error_connection_failed: 'Error al conectar con {platform}. Por favor, inténtalo de nuevo.',
    integration_error_oauth_failed: 'Autorización fallida. Por favor, verifica tus permisos e inténtalo de nuevo.',
    integration_error_token_expired: 'Tu conexión a {platform} ha expirado. Por favor, reconecta.',
    integration_error_api_error: 'Ocurrió un error al comunicarse con {platform}.',
    integration_error_sync_failed: 'Error al sincronizar datos con {platform}. Por favor, inténtalo más tarde.',
    integration_error_invalid_credentials: 'Credenciales inválidas para {platform}. Por favor, reconecta.',
    integration_error_rate_limit: 'Demasiadas solicitudes a {platform}. Por favor, espera e inténtalo de nuevo.',
    integration_error_network: 'Error de red. Por favor, verifica tu conexión e inténtalo de nuevo.',
    integration_error_disconnection_failed: 'Error al desconectar de {platform}. Por favor, inténtalo de nuevo.',
    integration_error_no_files_selected: 'No se seleccionaron archivos. Por favor, selecciona archivos para guardar.',
    integration_error_upload_failed: 'Error al subir archivos a {platform}. Por favor, inténtalo de nuevo.',
    
    // OAuth Callback Messages
    integration_oauth_processing: 'Procesando autorización...',
    integration_oauth_error: 'Error al completar la autorización',
    integration_oauth_invalid_callback: 'Parámetros de callback OAuth inválidos',
    integration_oauth_success_title: '¡Conexión Exitosa!',
    integration_oauth_error_title: 'Autorización Fallida',
    integration_oauth_redirecting: 'Redirigiendo...',
    integration_oauth_closing: 'Esta ventana se cerrará automáticamente...',
    integration_error_no_folder_selected: 'Por favor, seleccione primero una carpeta de Google Drive desde la página de Integraciones.',
    integration_select_folder_button: 'Seleccionar Carpeta',
    integration_select_folder_title: 'Seleccionar Carpeta de Google Drive',
    integration_root_folder: 'Carpeta Raíz (Mi unidad)',
    integration_no_folders: 'No se encontraron carpetas. Los archivos se subirán a la raíz.',
    integration_select_folder_confirm: 'Seleccionar Carpeta',
    integration_folder_selected: 'Carpeta seleccionada: {folder}',
};
