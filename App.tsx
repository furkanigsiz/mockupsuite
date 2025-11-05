import React, { useState, useCallback, useEffect } from 'react';
import GeneratedImageGrid from './components/GeneratedImageGrid';
import ImageModal from './components/ImageModal';
import SavedImageGrid from './components/SavedImageGrid';
import { UploadedImage, BatchResult, Project, BrandKit as BrandKitType, PromptTemplate, AppMode, ProductTemplate, PlanId, VideoResult } from './types';
import { generateMockup, suggestPromptsForImage } from './services/geminiService';
import { useTranslations } from './hooks/useTranslations';
import { applyWatermark } from './utils/imageUtils';
import { base64ToFile, processFile } from './utils/fileUtils';
import Spinner from './components/Spinner';
import LandingPage from './components/LandingPage';
import AppHeader from './components/AppHeader';
import GalleryPage from './components/GalleryPage';
import { StylePreset } from './components/StyleSelector';
import GeneratorControls from './components/GeneratorControls';
import GeneratedVideo from './components/GeneratedVideo';
import BackgroundRemoverTab from './components/BackgroundRemoverTab';
import ModeSwitcher from './components/ModeSwitcher';
import { useAuth } from './components/AuthProvider';
import * as databaseService from './services/databaseService';
import * as offlineDataService from './services/offlineDataService';
import * as storageService from './services/storageService';
import * as migrationService from './services/migrationService';
import MigrationPrompt from './components/MigrationPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PlanSelectionModal } from './components/PlanSelectionModal';
import { PaymentCheckout } from './components/PaymentCheckout';
import { registrationService } from './services/registrationService';
import * as paymentService from './services/paymentService';
import { SUBSCRIPTION_PLANS } from './types';
import * as subscriptionService from './services/subscriptionService';
import * as watermarkService from './services/watermarkService';
import * as queueManagerService from './services/queueManagerService';
import { UpgradeModal } from './components/UpgradeModal';
import AdminDashboard from './components/AdminDashboard';
import * as veo3Service from './services/veo3Service';
import StaggeredMenu from './components/StaggeredMenu';
import UnifiedHeader from './components/UnifiedHeader';
import ProfilePage from './components/ProfilePage';
import { HelpCenterPage } from './components/HelpCenterPage';
import IntegrationsPage from './components/IntegrationsPage';
import OAuthCallbackHandler from './components/OAuthCallbackHandler';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { TermsOfServicePage } from './components/TermsOfServicePage';
import { ContactPage } from './components/ContactPage';

const DEFAULT_BRAND_KIT: BrandKitType = {
  logo: null,
  useWatermark: false,
  colors: [],
};

function App() {
  const { user, signOut } = useAuth();
  const { t } = useTranslations();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKitType>(DEFAULT_BRAND_KIT);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [progressText, setProgressText] = useState<string>('');
  const [currentResults, setCurrentResults] = useState<BatchResult[]>([]);
  
  // Migration state
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  const [migrationResult, setMigrationResult] = useState<migrationService.MigrationResult | null>(null);
  
  // Registration flow state
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [showPaymentCheckout, setShowPaymentCheckout] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<PlanId | null>(null);
  const [proratedPriceForPayment, setProratedPriceForPayment] = useState<number | undefined>(undefined);
  const [isProcessingPlan, setIsProcessingPlan] = useState(false);
  
  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<'quota_exhausted' | 'manual' | 'renewal_reminder'>('manual');
  
  // Quota refresh trigger
  const [quotaRefreshTrigger, setQuotaRefreshTrigger] = useState(0);
  
  const [mode, setMode] = useState<AppMode>('scene');
  // State for Product Mockup mode
  const [selectedProduct, setSelectedProduct] = useState<ProductTemplate | null>(null);
  const [designImage, setDesignImage] = useState<UploadedImage | null>(null);
  const [productColor, setProductColor] = useState<string>('White');
  const [productStyle, setProductStyle] = useState<StylePreset>('Studio');
  const [stylePrompt, setStylePrompt] = useState('');
  
  // State for Video Generation mode
  const [videoSourceImage, setVideoSourceImage] = useState<UploadedImage | null>(null);
  const [videoPrompt, setVideoPrompt] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(7);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [currentVideoResult, setCurrentVideoResult] = useState<VideoResult | null>(null);
  const [currentVideoStoragePath, setCurrentVideoStoragePath] = useState<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [videoSuggestedPrompts, setVideoSuggestedPrompts] = useState<string[]>([]);
  const [isVideoSuggesting, setIsVideoSuggesting] = useState(false);

  // Check URL for admin parameter
  const urlParams = new URLSearchParams(window.location.search);
  const isAdminView = urlParams.get('admin') === 'true';
  
  // Initialize mainView from localStorage or default to 'generator'
  const getInitialView = (): 'generator' | 'gallery' | 'admin' | 'profile' | 'help' | 'integrations' | 'oauth-callback' | 'privacy-policy' | 'terms-of-service' | 'contact' => {
    if (isAdminView) return 'admin';
    
    // Check if this is a static page route
    if (window.location.pathname === '/privacy-policy') return 'privacy-policy';
    if (window.location.pathname === '/terms-of-service') return 'terms-of-service';
    if (window.location.pathname === '/contact') return 'contact';
    
    // Check if this is an OAuth callback route
    const urlParams = new URLSearchParams(window.location.search);
    const isOAuthCallback = (urlParams.has('success') || urlParams.has('error')) && urlParams.has('platform');
    if (isOAuthCallback) return 'oauth-callback';
    
    try {
      const savedView = localStorage.getItem('mockupsuite_current_view');
      if (savedView && ['generator', 'gallery', 'admin', 'profile', 'help', 'integrations'].includes(savedView)) {
        return savedView as 'generator' | 'gallery' | 'admin' | 'profile' | 'help' | 'integrations';
      }
    } catch (e) {
      console.error('Failed to load saved view:', e);
    }
    
    return 'generator';
  };
  
  const [mainView, setMainView] = useState<'generator' | 'gallery' | 'admin' | 'profile' | 'help' | 'integrations' | 'oauth-callback' | 'privacy-policy' | 'terms-of-service' | 'contact'>(getInitialView());
  
  // Track the source view for context-aware help navigation
  const [helpSourceView, setHelpSourceView] = useState<'generator' | 'gallery' | 'profile' | null>(null);
  
  // Save mainView to localStorage whenever it changes (except for static pages)
  useEffect(() => {
    const staticPages = ['oauth-callback', 'privacy-policy', 'terms-of-service', 'contact'];
    if (!staticPages.includes(mainView)) {
      try {
        localStorage.setItem('mockupsuite_current_view', mainView);
      } catch (e) {
        console.error('Failed to save current view:', e);
      }
    }
  }, [mainView]);
  
  // Helper function to navigate to help with context
  const navigateToHelp = useCallback((sourceView?: 'generator' | 'gallery' | 'profile') => {
    if (sourceView) {
      setHelpSourceView(sourceView);
    }
    setMainView('help');
  }, []);
  
  // Handler for OAuth callback completion
  const handleOAuthCallbackComplete = useCallback((success: boolean, message: string) => {
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Navigate to integrations page
    setMainView('integrations');
    
    // Show toast notification
    // Note: Toast notifications will be shown by the IntegrationsPage component
    // when it detects the OAuth completion via postMessage or state
  }, []);
  
  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Check if user needs to select a plan (registration flow)
  useEffect(() => {
    if (!user) {
      return;
    }

    const checkPlanSelection = async () => {
      try {
        // Check if user can access the app (has an active subscription)
        const canAccess = await registrationService.canAccessApp(user.id);
        
        if (!canAccess) {
          // User cannot access - show plan selection modal
          setShowPlanSelection(true);
        }
      } catch (error) {
        console.error('Error checking plan selection:', error);
        // On error, show plan selection to be safe
        setShowPlanSelection(true);
      }
    };

    checkPlanSelection();
  }, [user]);

  // Handle payment callback from İyzico
  useEffect(() => {
    if (!user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    // Check if this is a payment callback (has token in URL)
    if (urlToken) {
      // Check if this token matches a pending payment
      const pendingToken = localStorage.getItem('pending_payment_token');
      const pendingTime = localStorage.getItem('pending_payment_time');
      
      // Verify token matches and payment is recent (within 10 minutes)
      const isRecentPayment = pendingTime && (Date.now() - parseInt(pendingTime)) < 10 * 60 * 1000;
      
      if (pendingToken === urlToken && isRecentPayment) {
        // This is our payment callback - verify it
        const verifyPayment = async () => {
          try {
            // Get the conversation ID from the payment transaction
            const transaction = await paymentService.getPaymentTransactionByToken(urlToken);
            const conversationId = transaction?.iyzicoConversationId || `${user.id}-${Date.now()}`;
            
            const verification = await paymentService.verifyPayment(user.id, urlToken, conversationId);
            
            if (verification.success) {
              // Mark payment as completed
              localStorage.setItem('completed_payment_token', urlToken);
              
              // Payment successful - complete registration
              await registrationService.completePaidRegistration(user.id, verification.paymentId || '');
              
              // Clean up localStorage
              localStorage.removeItem('pending_payment_token');
              localStorage.removeItem('pending_payment_time');
              localStorage.removeItem('pending_payment_plan');
              localStorage.removeItem('pending_payment_credit_package');
              
              // Clear URL parameters
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Close this window (callback window)
              window.close();
              
              // If window.close() doesn't work (some browsers block it), show success message
              setTimeout(() => {
                if (!window.closed) {
                  document.body.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui; background: #f9fafb;">
                      <div style="text-align: center; background: white; padding: 3rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                        <div style="width: 4rem; height: 4rem; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                          <svg style="width: 2rem; height: 2rem; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                        <h1 style="color: #111827; font-size: 2rem; margin-bottom: 0.5rem; font-weight: 700;">Ödeme Başarılı!</h1>
                        <p style="color: #6b7280; margin-bottom: 2rem; font-size: 1.1rem;">Aboneliğiniz aktif edildi.</p>
                        <button onclick="window.close()" style="background: #4f46e5; color: white; padding: 0.875rem 2.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; font-weight: 600; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">
                          Pencereyi Kapat
                        </button>
                      </div>
                    </div>
                  `;
                }
              }, 100);
            } else {
              // Payment failed
              localStorage.removeItem('pending_payment_token');
              localStorage.removeItem('pending_payment_time');
              localStorage.removeItem('pending_payment_plan');
              localStorage.removeItem('pending_payment_credit_package');
              
              // Clear URL parameters
              window.history.replaceState({}, document.title, window.location.pathname);
              
              alert('Ödeme başarısız oldu: ' + (verification.errorMessage || 'Bilinmeyen hata'));
              window.close();
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            localStorage.removeItem('pending_payment_token');
            localStorage.removeItem('pending_payment_time');
            localStorage.removeItem('pending_payment_plan');
            localStorage.removeItem('pending_payment_credit_package');
            
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            alert('Ödeme doğrulama hatası. Lütfen destek ile iletişime geçin.');
            window.close();
          }
        };

        verifyPayment();
      } else if (urlToken) {
        // Token exists but doesn't match or is too old - clear URL
        console.warn('Invalid or expired payment token in URL');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [user]);

  // Load data from database on initial render (when user is authenticated)
  // Use a ref to track if data has been loaded to prevent reloading on every user change
  const dataLoadedRef = React.useRef(false);
  const loadedUserIdRef = React.useRef<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      setIsLoadingData(false);
      dataLoadedRef.current = false;
      loadedUserIdRef.current = null;
      return;
    }

    // Skip if data already loaded for this user
    if (dataLoadedRef.current && loadedUserIdRef.current === user.id) {
      return;
    }

    const loadData = async () => {
      setIsLoadingData(true);
      
      try {
        // First check if user can access the app
        const canAccess = await registrationService.canAccessApp(user.id);
        if (!canAccess) {
          setIsLoadingData(false);
          return;
        }
      } catch (error) {
        console.error('Error checking app access:', error);
        setIsLoadingData(false);
        return;
      }
      
      // First check if migration is needed
      const hasLocalData = migrationService.hasLocalStorageData();
      if (hasLocalData) {
        setShowMigrationPrompt(true);
        setIsLoadingData(false);
        return;
      }

      try {
        // Fetch projects from database
        const fetchedProjects = await databaseService.getProjects(user.id);
        
        // If no projects exist, create a default one
        if (fetchedProjects.length === 0) {
          const newProject: Project = {
            id: '',
            name: t('default_project_name'),
            uploadedImages: [],
            prompt: '',
            aspectRatio: '1:1',
            savedImages: [],
            suggestedPrompts: [],
          };
          const createdProject = await databaseService.createProject(user.id, newProject);
          setProjects([createdProject]);
          setCurrentProjectId(createdProject.id);
        } else {
          // Load saved mockups for each project
          const projectsWithMockups = await Promise.all(
            fetchedProjects.map(async (project) => {
              try {
                const mockupPaths = await databaseService.getSavedMockups(project.id);
                // Store the storage paths directly - we'll convert to URLs when displaying
                return { ...project, savedImages: mockupPaths };
              } catch (e) {
                console.error('Failed to load mockups for project:', project.id, e);
                return project;
              }
            })
          );
          
          setProjects(projectsWithMockups);
          // Set the first project as current
          setCurrentProjectId(projectsWithMockups[0].id);
        }

        // Fetch brand kit from database
        const fetchedBrandKit = await databaseService.getBrandKit(user.id);
        if (fetchedBrandKit) {
          // If logo path exists, get the signed URL
          if (fetchedBrandKit.logo) {
            try {
              const logoUrl = await storageService.getImageUrl(fetchedBrandKit.logo);
              setBrandKit({ ...fetchedBrandKit, logo: logoUrl });
            } catch (e) {
              console.error('Failed to load brand kit logo:', e);
              setBrandKit(fetchedBrandKit);
            }
          } else {
            setBrandKit(fetchedBrandKit);
          }
        }

        // Fetch prompt templates from database
        const fetchedTemplates = await databaseService.getPromptTemplates(user.id);
        setPromptTemplates(fetchedTemplates);
        
        // Mark data as loaded for this user
        dataLoadedRef.current = true;
        loadedUserIdRef.current = user.id;
      } catch (e) {
        console.error('Failed to load data from database:', e);
        setError(t('error_loading_data') as string || 'Failed to load data');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user, t]);

  // Projects are now saved to database via updateCurrentProject and other CRUD operations
  // No need for automatic localStorage sync

  // Brand kit is now saved to database via BrandKit component
  // No need for automatic localStorage sync

  // Prompt templates are now saved to database via PromptTemplates component
  // No need for automatic localStorage sync
  
  // Clear results when project changes to avoid showing stale data
  useEffect(() => {
    setCurrentResults([]);
    setError(null);
  }, [currentProjectId]);


  const currentProject = projects.find(p => p.id === currentProjectId);

  const updateCurrentProject = useCallback(async (updates: Partial<Project>) => {
    if (!currentProjectId || !user) return;
    
    // Update local state immediately for responsive UI
    setProjects(prevProjects => prevProjects.map(p => p.id === currentProjectId ? { ...p, ...updates } : p));
    
    // Save to database in the background (with offline support)
    try {
      await offlineDataService.updateProject(currentProjectId, updates, user.id);
    } catch (e) {
      console.error('Failed to update project in database:', e);
      // Optionally show error to user
    }
  }, [currentProjectId, user]);

  // Check for pending uploaded image when navigating to generator
  useEffect(() => {
    if (mainView === 'generator' && currentProject) {
      try {
        const pendingImageStr = localStorage.getItem('pendingUploadedImage');
        if (pendingImageStr) {
          const pendingImage = JSON.parse(pendingImageStr) as UploadedImage;
          
          // Add to current project's uploaded images
          updateCurrentProject({
            uploadedImages: [...currentProject.uploadedImages, pendingImage],
          });
          
          // Clear the pending image
          localStorage.removeItem('pendingUploadedImage');
        }
      } catch (error) {
        console.error('Failed to load pending image:', error);
        localStorage.removeItem('pendingUploadedImage');
      }
    }
  }, [mainView, currentProject, updateCurrentProject]);

  const handleSceneGenerate = useCallback(async () => {
    if (!currentProject || currentProject.uploadedImages.length === 0 || !currentProject.prompt.trim()) {
      setError(t('error_no_image_or_prompt'));
      return;
    }

    if (!user) {
      setError(t('error_not_authenticated'));
      return;
    }

    // Check if user can generate images (has quota or credits)
    const canGenerate = await subscriptionService.canGenerateImage(user.id);
    if (!canGenerate) {
      // Show upgrade modal
      setUpgradeModalTrigger('quota_exhausted');
      setShowUpgradeModal(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentResults([]);
    updateCurrentProject({ suggestedPrompts: [] });

    const newResults: BatchResult[] = [];
    const fullPrompt = `${currentProject.prompt.trim()} (Image aspect ratio: ${currentProject.aspectRatio})`;

    // Validate prompt is not empty after trimming
    if (!fullPrompt.trim() || fullPrompt.trim() === `(Image aspect ratio: ${currentProject.aspectRatio})`) {
      setError(t('error_no_image_or_prompt'));
      setIsLoading(false);
      return;
    }

    // Get user priority for queue
    const priority = await queueManagerService.getUserPriority(user.id);

    for (let i = 0; i < currentProject.uploadedImages.length; i++) {
        const image = currentProject.uploadedImages[i];
        setProgressText(t('progress_text_generating', { current: i + 1, total: currentProject.uploadedImages.length, fileName: image.name }) as string);
        try {
            // Debug log
            console.log('Scene Generation - About to add to queue:', {
              userId: user.id,
              projectId: currentProject.id,
              prompt: fullPrompt,
              promptLength: fullPrompt.length,
              aspectRatio: currentProject.aspectRatio,
            });

            // Add to queue
            const queueItem = await queueManagerService.addToQueue({
              userId: user.id,
              projectId: currentProject.id,
              prompt: fullPrompt,
              images: [image.base64],
              aspectRatio: currentProject.aspectRatio,
            });

            // Generate mockup
            let generated = await generateMockup(fullPrompt, image.base64, image.type);

            // Update queue item as completed
            await queueManagerService.updateQueueItemStatus(
              queueItem.id,
              'completed',
              { generatedImages: generated }
            );

            // Apply watermark and resize for free tier users
            generated = await Promise.all(
              generated.map(async (g) => {
                const processed = await watermarkService.processImageForUser(g, user.id);
                return processed;
              })
            );

            // Apply brand kit watermark if enabled
            if (brandKit.useWatermark && brandKit.logo) {
                generated = await Promise.all(
                    generated.map(g => applyWatermark(g, brandKit.logo!))
                );
            }

            newResults.push({ source: image, generated });

            // Decrement quota after successful generation
            try {
              await subscriptionService.decrementQuota(user.id, 1);
              // Trigger quota widget refresh
              setQuotaRefreshTrigger(prev => prev + 1);
            } catch (quotaError) {
              console.error('Error decrementing quota:', quotaError);
              // Continue even if quota decrement fails - we already generated the image
            }
        } catch (e: any) {
            setError(e.message || t('error_unknown'));
            setIsLoading(false);
            return;
        }
    }
    
    setCurrentResults(newResults);
    setIsLoading(false);
    setProgressText('');
  }, [currentProject, brandKit, t, updateCurrentProject, user]);

  const handleProductGenerate = useCallback(async () => {
    if (!selectedProduct || !designImage) {
      setError(t('error_no_product_or_design'));
      return;
    }

    if (!user) {
      setError(t('error_not_authenticated'));
      return;
    }

    // Check if user can generate images (has quota or credits)
    const canGenerate = await subscriptionService.canGenerateImage(user.id);
    if (!canGenerate) {
      // Show upgrade modal
      setUpgradeModalTrigger('quota_exhausted');
      setShowUpgradeModal(true);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setCurrentResults([]);
    setProgressText(t('progress_text_generating', { current: 1, total: 1, fileName: designImage.name }) as string);

    let prompt = `Place the uploaded design onto a high-quality, photorealistic mockup of a ${productColor} ${selectedProduct.name}. The style should be: a "${productStyle}" product shot.`;
    if (stylePrompt.trim()) {
      prompt += ` Additional style notes: ${stylePrompt.trim()}.`;
    }
    prompt += ` Ensure the design is clearly visible and naturally integrated onto the product. The background should be clean and relevant to the style.`;

    // Validate prompt is not empty
    if (!prompt.trim()) {
      setError(t('error_no_image_or_prompt'));
      setIsLoading(false);
      return;
    }

    try {
      // Add to queue
      const queueItem = await queueManagerService.addToQueue({
        userId: user.id,
        projectId: currentProject?.id,
        prompt: prompt.trim(),
        images: [designImage.base64],
        aspectRatio: '1:1', // Default aspect ratio for product mockups
      });

      // Generate mockup
      let generated = await generateMockup(prompt, designImage.base64, designImage.type);

      // Update queue item as completed
      await queueManagerService.updateQueueItemStatus(
        queueItem.id,
        'completed',
        { generatedImages: generated }
      );

      // Apply watermark and resize for free tier users
      generated = await Promise.all(
        generated.map(async (g) => {
          const processed = await watermarkService.processImageForUser(g, user.id);
          return processed;
        })
      );

      // Apply brand kit watermark if enabled
      if (brandKit.useWatermark && brandKit.logo) {
          generated = await Promise.all(
              generated.map(g => applyWatermark(g, brandKit.logo!))
          );
      }

      const newResult: BatchResult = { source: designImage, generated };
      setCurrentResults([newResult]);

      // Decrement quota after successful generation
      try {
        await subscriptionService.decrementQuota(user.id, 1);
        // Trigger quota widget refresh
        setQuotaRefreshTrigger(prev => prev + 1);
      } catch (quotaError) {
        console.error('Error decrementing quota:', quotaError);
        // Continue even if quota decrement fails - we already generated the image
      }
    } catch (e: any) {
        setError(e.message || t('error_unknown'));
    } finally {
        setIsLoading(false);
        setProgressText('');
    }
  }, [selectedProduct, designImage, productColor, productStyle, stylePrompt, brandKit, t, user, currentProject]);

  const handleVideoGenerate = useCallback(async () => {
    if (!videoSourceImage || !videoPrompt.trim()) {
      setError(t('error_no_image_or_prompt'));
      return;
    }

    if (!user) {
      setError(t('error_not_authenticated'));
      return;
    }

    // Check if user can generate videos (has quota or credits)
    const canGenerate = await subscriptionService.canGenerateVideo(user.id);
    if (!canGenerate) {
      // Show upgrade modal
      setUpgradeModalTrigger('quota_exhausted');
      setShowUpgradeModal(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentVideoResult(null);
    setProgressText('Generating video...');

    let queueItem: any = null;

    try {
      // Enhance prompt with brand colors if available
      let enhancedPrompt = videoPrompt.trim();
      if (brandKit.colors && brandKit.colors.length > 0) {
        const colorDescriptions = brandKit.colors.map(color => color).join(', ');
        enhancedPrompt = `${enhancedPrompt}. Brand colors to incorporate: ${colorDescriptions}`;
      }

      // Add to queue (note: duration and videoGeneration are not supported by current queue system)
      queueItem = await queueManagerService.addToQueue({
        userId: user.id,
        projectId: currentProject?.id,
        prompt: `[VIDEO] ${enhancedPrompt} (Duration: ${videoDuration}s, Aspect Ratio: ${videoAspectRatio})`,
        images: [videoSourceImage.base64],
        aspectRatio: videoAspectRatio,
      });

      // Generate video
      const videoBase64 = await veo3Service.generateVideo({
        prompt: enhancedPrompt,
        sourceImage: videoSourceImage.base64,
        duration: videoDuration,
        aspectRatio: videoAspectRatio,
      });

      setProgressText('Uploading video...');

      // Apply brand kit watermark if enabled
      let processedVideoBase64 = videoBase64;
      if (brandKit.useWatermark && brandKit.logo) {
        try {
          processedVideoBase64 = await watermarkService.applyWatermarkToVideo(
            videoBase64,
            brandKit.logo
          );
        } catch (watermarkError) {
          console.error('Failed to apply watermark to video:', watermarkError);
          // Continue with original video if watermarking fails
        }
      }

      // Convert base64 to file and upload to storage
      const videoFile = base64ToFile(processedVideoBase64, `video_${Date.now()}.mp4`, 'video/mp4');
      const videoPath = await storageService.uploadVideo(
        user.id,
        videoFile,
        'videos'
      );

      // Get signed URL for video
      const videoUrl = await storageService.getVideoUrl(videoPath);

      // Update queue item as completed (note: queue system expects generatedImages, not videoUrl)
      await queueManagerService.updateQueueItemStatus(
        queueItem.id,
        'completed',
        { generatedImages: [videoUrl] }
      );

      // Save video to database with brand kit reference
      let savedVideoId: string | null = null;
      try {
        // Get brand kit ID if available
        let brandKitId: string | undefined;
        if (brandKit.colors.length > 0 || brandKit.logo || brandKit.useWatermark) {
          const userBrandKit = await databaseService.getBrandKit(user.id);
          if (userBrandKit) {
            // Brand kit exists in database, get its ID using supabase client
            const { supabase } = await import('./services/supabaseClient');
            const { data: brandKitData } = await supabase
              .from('brand_kits')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (brandKitData) {
              brandKitId = brandKitData.id;
            }
          }
        }

        const savedVideo = await databaseService.saveVideo(user.id, {
          projectId: currentProject?.id,
          storagePath: videoPath,
          sourceImagePath: videoSourceImage.previewUrl,
          prompt: enhancedPrompt,
          duration: videoDuration,
          aspectRatio: videoAspectRatio,
          brandKitId,
        });
        
        savedVideoId = savedVideo.id;
      } catch (dbError) {
        console.error('Failed to save video to database:', dbError);
        // Continue even if database save fails
      }

      // Store video path and ID for save/remove operations
      setCurrentVideoStoragePath(videoPath);
      setCurrentVideoId(savedVideoId);

      // Set result
      setCurrentVideoResult({
        source: videoSourceImage,
        generatedUrl: videoUrl,
        duration: videoDuration,
        createdAt: new Date().toISOString(),
      });

      // Decrement video quota after successful generation
      try {
        await subscriptionService.decrementVideoQuota(user.id, 1);
        // Trigger quota widget refresh
        setQuotaRefreshTrigger(prev => prev + 1);
      } catch (quotaError) {
        console.error('Error decrementing video quota:', quotaError);
        // Continue even if quota decrement fails - we already generated the video
      }
    } catch (e: any) {
      // Categorize video-specific errors
      let errorMessage = e.message || t('error_unknown');
      
      // Check for specific video error types
      if (e.message?.includes('timeout') || e.message?.includes('timed out')) {
        errorMessage = t('error_video_timeout');
      } else if (e.message?.includes('upload') || e.message?.includes('storage')) {
        errorMessage = t('error_video_upload_failed');
      } else if (e.message?.includes('invalid') || e.message?.includes('source')) {
        errorMessage = t('error_invalid_video_source');
      } else if (e.message?.includes('quota') || e.message?.includes('limit')) {
        errorMessage = t('error_video_quota_exceeded');
      } else if (e.message?.includes('generate') || e.message?.includes('generation')) {
        errorMessage = t('error_video_generation_failed');
      }
      
      setError(errorMessage);
      
      // Update queue item as failed if it was created
      if (queueItem) {
        await queueManagerService.updateQueueItemStatus(
          queueItem.id,
          'failed',
          undefined,
          errorMessage
        );
      }
    } finally {
      setIsLoading(false);
      setProgressText('');
    }
  }, [videoSourceImage, videoPrompt, videoDuration, videoAspectRatio, user, currentProject, t]);

  const handleSuggestPrompts = useCallback(async () => {
    if (!currentProject || currentProject.uploadedImages.length === 0) {
        setError(t('error_no_image_for_suggestions'));
        return;
    }
    setIsSuggesting(true);
    setError(null);
    updateCurrentProject({ suggestedPrompts: [] });
    try {
        const firstImage = currentProject.uploadedImages[0];
        const suggestions = await suggestPromptsForImage(firstImage.base64, firstImage.type, t('prompt_suggestion_base') as string);
        updateCurrentProject({ suggestedPrompts: suggestions });
    } catch(e: any) {
        setError(e.message || t('error_suggestions_failed'));
    } finally {
        setIsSuggesting(false);
    }
  }, [currentProject, t, updateCurrentProject]);

  const handleVideoSuggestPrompts = useCallback(async () => {
    if (!videoSourceImage) {
        setError(t('error_no_image_for_suggestions'));
        return;
    }
    setIsVideoSuggesting(true);
    setError(null);
    setVideoSuggestedPrompts([]);
    try {
        const suggestions = await suggestPromptsForImage(
          videoSourceImage.base64, 
          videoSourceImage.type, 
          t('video_prompt_suggestion_base') as string || 'Suggest creative video animation ideas for this image'
        );
        setVideoSuggestedPrompts(suggestions);
    } catch(e: any) {
        setError(e.message || t('error_suggestions_failed'));
    } finally {
        setIsVideoSuggesting(false);
    }
  }, [videoSourceImage, t]);

  const handleSaveImage = async (base64Image: string) => {
    if (!currentProject || !user) return;
    
    try {
      const fileName = `mockup_${Date.now()}.png`;
      
      // Generate temporary path for optimistic UI update
      const tempPath = `temp/${user.id}/mockups/${fileName}`;
      
      // Optimistic update - show saved immediately
      const newSavedImages = [...currentProject.savedImages, tempPath];
      updateCurrentProject({ savedImages: newSavedImages });
      
      // Upload in background (don't await)
      offlineDataService.saveMockup(
        currentProject.id,
        user.id,
        base64Image,
        fileName
      ).then((imagePath) => {
        // Replace temp path with real path using setProjects to get latest state
        setProjects(prevProjects => 
          prevProjects.map(p => {
            if (p.id === currentProject.id) {
              return {
                ...p,
                savedImages: p.savedImages.map(path => 
                  path === tempPath ? imagePath : path
                )
              };
            }
            return p;
          })
        );
      }).catch((e) => {
        console.error('Failed to save image:', e);
        // Remove temp path on error using setProjects to get latest state
        setProjects(prevProjects => 
          prevProjects.map(p => {
            if (p.id === currentProject.id) {
              return {
                ...p,
                savedImages: p.savedImages.filter(path => path !== tempPath)
              };
            }
            return p;
          })
        );
        alert('Failed to save image. Please try again.');
      });
    } catch (e) {
      console.error('Failed to save image:', e);
      alert('Failed to save image. Please try again.');
    }
  };

  const handleRemoveSavedImage = async (imagePath: string) => {
    if (!currentProject || !user) return;
    
    try {
      // Delete from database and storage (with offline support)
      await offlineDataService.deleteMockup(imagePath, user.id);
      
      // Update local state
      updateCurrentProject({ savedImages: currentProject.savedImages.filter(img => img !== imagePath) });
    } catch (e) {
      console.error('Failed to remove image:', e);
      alert('Failed to remove image. Please try again.');
    }
  };

  const handleSaveVideo = async () => {
    if (!currentVideoResult || !currentVideoStoragePath || !currentProject || !user) {
      alert(t('video_save_error') || 'No video to save.');
      return;
    }
    
    // Video is already saved to database during generation
    // This function is kept for potential future use or re-saving
    alert(t('video_saved_success') || 'Video is already saved to your project!');
  };

  const handleDownloadVideo = async () => {
    if (!currentVideoResult) {
      alert(t('video_download_error') || 'No video to download.');
      return;
    }
    
    try {
      setProgressText(t('progress_text_downloading_video') || 'Downloading video...');
      
      // Use downloadVideo utility from fileUtils
      const { downloadVideo } = await import('./utils/fileUtils');
      const fileName = `video_${Date.now()}.mp4`;
      downloadVideo(currentVideoResult.generatedUrl, fileName);
      
      setProgressText('');
    } catch (e) {
      console.error('Failed to download video:', e);
      alert(t('video_download_error') || 'Failed to download video. Please try again.');
      setProgressText('');
    }
  };

  const handleRemoveVideo = async () => {
    if (!user || !currentVideoId) {
      alert(t('video_remove_error') || 'No video to remove.');
      return;
    }
    
    try {
      // Delete video from database and storage
      await databaseService.deleteVideo(currentVideoId, user.id);
      
      // Clear current video result and related state
      setCurrentVideoResult(null);
      setCurrentVideoStoragePath(null);
      setCurrentVideoId(null);
      
      // Show success message
      alert(t('video_removed_success') || 'Video removed successfully!');
    } catch (e) {
      console.error('Failed to remove video:', e);
      alert(t('video_remove_error') || 'Failed to remove video. Please try again.');
    }
  };
  
  const handleSavePrompt = async () => {
    if (!user || !currentProject || !currentProject.prompt.trim()) return;
    
    // Check if template already exists
    if (promptTemplates.some(p => p.text === currentProject.prompt)) return;
    
    try {
      const newTemplate = { id: '', text: currentProject.prompt };
      const savedTemplate = await offlineDataService.savePromptTemplate(user.id, newTemplate);
      setPromptTemplates([...promptTemplates, savedTemplate]);
    } catch (e) {
      console.error('Failed to save prompt template:', e);
      alert('Failed to save prompt template. Please try again.');
    }
  };

  const handleUseInScene = async (base64Image: string) => {
    if (!currentProject) return;

    const fileName = `mockup_${Date.now()}.png`;
    const imageFile = base64ToFile(base64Image, fileName, 'image/png');
    const uploadedImage = await processFile(imageFile);

    updateCurrentProject({
        uploadedImages: [...currentProject.uploadedImages, uploadedImage]
    });

    setMode('scene');
  };

  // Migration handlers
  const handleMigrate = async (): Promise<migrationService.MigrationResult> => {
    if (!user) {
      return {
        success: false,
        projectsMigrated: 0,
        mockupsMigrated: 0,
        brandKitMigrated: false,
        templatesMigrated: 0,
        errors: ['No user authenticated'],
      };
    }

    try {
      const result = await migrationService.migrateToSupabase(user.id);
      setMigrationResult(result);

      if (result.success) {
        // Clear localStorage after successful migration
        migrationService.clearLocalStorage();
        
        // Close migration prompt after a short delay to show success message
        setTimeout(() => {
          setShowMigrationPrompt(false);
          // Trigger data reload
          window.location.reload();
        }, 2000);
      }

      return result;
    } catch (error) {
      console.error('Migration failed:', error);
      const errorResult: migrationService.MigrationResult = {
        success: false,
        projectsMigrated: 0,
        mockupsMigrated: 0,
        brandKitMigrated: false,
        templatesMigrated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
      setMigrationResult(errorResult);
      return errorResult;
    }
  };

  const handleSkipMigration = () => {
    setShowMigrationPrompt(false);
    // Optionally clear localStorage to prevent prompt from showing again
    migrationService.clearLocalStorage();
  };

  const handleCloseMigration = () => {
    setShowMigrationPrompt(false);
    setMigrationResult(null);
  };

  // Registration flow handlers
  const handleSelectPlan = async (planId: PlanId) => {
    if (!user) return;

    setIsProcessingPlan(true);

    try {
      // Save plan selection
      const result = await registrationService.selectPlan(user.id, planId);

      if (planId === 'free') {
        // Free tier - activate immediately
        await registrationService.completeFreeRegistration(user.id);
        setShowPlanSelection(false);
        setIsProcessingPlan(false);
        
        // Reload the page to load user data
        window.location.reload();
      } else {
        // Paid plan - store in localStorage for payment callback and show payment checkout
        console.log('handleSelectPlan: Storing plan in localStorage:', planId);
        localStorage.setItem('pending_payment_plan', planId);
        console.log('handleSelectPlan: Verified localStorage:', localStorage.getItem('pending_payment_plan'));
        setSelectedPlanForPayment(planId);
        setShowPlanSelection(false);
        setShowPaymentCheckout(true);
        setIsProcessingPlan(false);
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      alert('Plan seçimi başarısız oldu. Lütfen tekrar deneyin.');
      setIsProcessingPlan(false);
    }
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    if (!user) return;

    try {
      console.log('handlePaymentSuccess: Starting with transactionId:', transactionId);
      console.log('handlePaymentSuccess: localStorage pending_payment_plan:', localStorage.getItem('pending_payment_plan'));
      
      // Complete paid registration
      await registrationService.completePaidRegistration(user.id, transactionId);
      
      // Clean up state and localStorage
      setShowPaymentCheckout(false);
      setSelectedPlanForPayment(null);
      localStorage.removeItem('pending_payment_plan');
      localStorage.removeItem('pending_payment_credit_package');
      
      // Reload the page to load user data
      window.location.reload();
    } catch (error) {
      console.error('Error completing paid registration:', error);
      alert('Abonelik aktivasyonu başarısız oldu. Lütfen destek ile iletişime geçin.');
    }
  };

  const handlePaymentCancel = () => {
    // Close payment checkout and clear all payment-related state
    setShowPaymentCheckout(false);
    setSelectedPlanForPayment(null);
    setProratedPriceForPayment(undefined);
    
    // Clean up localStorage
    localStorage.removeItem('pending_payment_plan');
    localStorage.removeItem('pending_payment_credit_package');
    localStorage.removeItem('pending_payment_token');
    localStorage.removeItem('pending_payment_time');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Error is already shown in PaymentCheckout component
  };

  // Upgrade modal handlers
  const handleUpgrade = async (planId: PlanId) => {
    if (!user) return;

    try {
      // Get current subscription to calculate prorated price
      const currentSubscription = await subscriptionService.getCurrentPlan(user.id);
      
      // Calculate prorated price if upgrading from a paid plan
      let proratedPrice: number | undefined;
      if (currentSubscription && currentSubscription.planId !== 'free') {
        const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === currentSubscription.planId);
        const newPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
        
        if (currentPlan && newPlan) {
          // Calculate remaining days in current period
          const now = new Date();
          const periodEnd = new Date(currentSubscription.currentPeriodEnd);
          const periodStart = new Date(currentSubscription.currentPeriodStart);
          
          const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
          const remainingDays = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          // Calculate prorated charge
          const dailyRateOld = currentPlan.price / totalDays;
          const dailyRateNew = newPlan.price / totalDays;
          proratedPrice = Math.max(0, (dailyRateNew - dailyRateOld) * remainingDays);
        }
      }
      
      // Store prorated price in state
      setProratedPriceForPayment(proratedPrice);
      
      // Always show payment checkout for plan upgrades
      // This ensures proper payment flow and confirmation
      setSelectedPlanForPayment(planId);
      setShowUpgradeModal(false);
      setShowPaymentCheckout(true);
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert(t('upgrade_error_message') || 'Failed to upgrade plan. Please try again.');
    }
  };

  // Show landing page if user is not logged in
  // Show app content if user is logged in
  const renderAppContent = () => {
    // Handle static pages (can be accessed without authentication)
    if (mainView === 'privacy-policy') {
      return <PrivacyPolicyPage />;
    }
    if (mainView === 'terms-of-service') {
      return <TermsOfServicePage />;
    }
    if (mainView === 'contact') {
      return <ContactPage />;
    }
    
    // Handle OAuth callback route (can be accessed without full authentication)
    if (mainView === 'oauth-callback') {
      return <OAuthCallbackHandler onComplete={handleOAuthCallbackComplete} />;
    }
    
    // If user is not logged in, show landing page
    if (!user) {
      return <LandingPage onGetStarted={() => {}} />;
    }
    
    // Show loading spinner while fetching data
    if (isLoadingData) {
      return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
          <Spinner progressText={t('loading_project')} />
        </div>
      );
    }
      
    if (!currentProject) {
      return (
          <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
              <Spinner progressText={t('loading_project')} />
          </div>
      );
    }

    return (
      <div className="relative flex h-auto min-h-screen w-full flex-col">
         {/* Unified Header for all pages */}
         {mainView !== 'admin' && (
           <UnifiedHeader
             onMenuClick={() => setIsMenuOpen(true)}
             onUpgradeClick={() => {
               setUpgradeModalTrigger('manual');
               setShowUpgradeModal(true);
             }}
             quotaRefreshTrigger={quotaRefreshTrigger}
             onProfileClick={() => setMainView('profile')}
           />
         )}

         {/* Staggered Menu - shown on all pages */}
         {mainView !== 'admin' && (
           <StaggeredMenu
             position="left"
             colors={['#E8E3FF', '#5227FF']}
             items={[
               {
                 label: t('nav_create_new') || 'Create',
                 ariaLabel: 'Navigate to generator',
                 link: '#',
                 onClick: () => setMainView('generator')
               },
               {
                 label: t('nav_gallery') || 'Gallery',
                 ariaLabel: 'Navigate to gallery',
                 link: '#',
                 onClick: () => setMainView('gallery')
               },
               {
                 label: t('nav_integrations') || 'Integrations',
                 ariaLabel: 'Navigate to integrations',
                 link: '#',
                 onClick: () => setMainView('integrations')
               },
               {
                 label: t('dashboard_nav_profile') || 'Profile',
                 ariaLabel: 'Navigate to profile',
                 link: '#',
                 onClick: () => setMainView('profile')
               },
               {
                 label: t('nav_help') || 'Help',
                 ariaLabel: 'Navigate to help center',
                 link: '#',
                 onClick: () => navigateToHelp()
               },
               {
                 label: t('dashboard_nav_settings') || 'Settings',
                 ariaLabel: 'Navigate to settings',
                 link: '#',
                 onClick: () => {}
               }
             ]}
             displaySocials={false}
             displayItemNumbering={false}
             logoUrl="data:image/svg+xml,%3Csvg fill='none' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath clipRule='evenodd' d='M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z' fill='%235227FF' fillRule='evenodd'%3E%3C/path%3E%3C/svg%3E"
             menuButtonColor="currentColor"
             openMenuButtonColor="currentColor"
             accentColor="#5227FF"
             changeMenuColorOnOpen={false}
             isFixed={true}
             onLogout={async () => {
               try {
                 await signOut();
               } catch (error) {
                 console.error('Error signing out:', error);
               }
             }}
           />
         )}

         {/* Main content with top padding for fixed header */}
         <div className="pt-20">
           {mainView === 'generator' && renderGenerator()}
           {mainView === 'gallery' && <GalleryPage projects={projects} setProjects={setProjects} onNavigate={setMainView} onImageClick={setSelectedImage} />}
           {mainView === 'admin' && <AdminDashboard />}
           {mainView === 'profile' && <ProfilePage onNavigateToGallery={() => setMainView('gallery')} onUpgrade={handleUpgrade} />}
           {mainView === 'integrations' && <IntegrationsPage />}
           {mainView === 'help' && (
             <HelpCenterPage
               initialCategory={
                 helpSourceView === 'profile' ? 'billing' :
                 helpSourceView === 'generator' ? 'ai-features' :
                 undefined
               }
             />
           )}
         </div>

        <ImageModal imageSrc={selectedImage} onClose={() => setSelectedImage(null)} />
      </div>
    );
  };

  const renderGenerator = () => {
    // If background-remover mode, show only the BackgroundRemoverTab (full width)
    if (mode === 'background-remover') {
      return (
        <main className="flex-1 justify-center py-5 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-4 p-4">
              <p className="text-neutral-dark dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
                {t('background_remover_title')}
              </p>
            </div>
            <div className="mt-6">
              <div className="flex flex-col gap-6 mb-6">
                <ModeSwitcher currentMode={mode} onModeChange={setMode} />
              </div>
              <BackgroundRemoverTab 
                onUpgradeClick={() => {
                  setUpgradeModalTrigger('quota_exhausted');
                  setShowUpgradeModal(true);
                }}
                onQuotaRefresh={() => setQuotaRefreshTrigger(prev => prev + 1)}
                projectId={currentProjectId || undefined}
                onSaveToGallery={handleSaveImage}
                onUseInScene={handleUseInScene}
              />
            </div>
          </div>
        </main>
      );
    }

    // Normal generator layout for other modes
    return (
      <main className="flex-1 justify-center py-5 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-4 p-4">
            <p className="text-neutral-dark dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">{t('create_mockup_title')}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            {/* Left Column: Controls */}
            <div className="flex flex-col gap-6">
              <GeneratorControls
                mode={mode}
                setMode={setMode}
                projects={projects}
                setProjects={setProjects}
                currentProjectId={currentProjectId}
                setCurrentProjectId={setCurrentProjectId}
                currentProject={currentProject}
                updateCurrentProject={updateCurrentProject}
                promptTemplates={promptTemplates}
                setPromptTemplates={setPromptTemplates}
                handleSuggestPrompts={handleSuggestPrompts}
                isSuggesting={isSuggesting}
                handleSavePrompt={handleSavePrompt}
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
                designImage={designImage}
                setDesignImage={setDesignImage}
                productColor={productColor}
                setProductColor={setProductColor}
                productStyle={productStyle}
                setProductStyle={setProductStyle}
                stylePrompt={stylePrompt}
                setStylePrompt={setStylePrompt}
                brandKit={brandKit}
                setBrandKit={setBrandKit}
                isLoading={isLoading}
                handleSceneGenerate={handleSceneGenerate}
                handleProductGenerate={handleProductGenerate}
                videoSourceImage={videoSourceImage}
                onVideoSourceImageChange={setVideoSourceImage}
                videoPrompt={videoPrompt}
                onVideoPromptChange={setVideoPrompt}
                videoDuration={videoDuration}
                onVideoDurationChange={setVideoDuration}
                videoAspectRatio={videoAspectRatio}
                onVideoAspectRatioChange={setVideoAspectRatio}
                handleVideoGenerate={handleVideoGenerate}
                videoSuggestedPrompts={videoSuggestedPrompts}
                handleVideoSuggestPrompts={handleVideoSuggestPrompts}
                isVideoSuggesting={isVideoSuggesting}
              />
            </div>

            {/* Right Column: Results */}
            <div className="space-y-8">
              {mode === 'video' ? (
                <GeneratedVideo
                  result={currentVideoResult}
                  isLoading={isLoading}
                  error={error}
                  progressText={progressText}
                  onSaveVideo={handleSaveVideo}
                  onDownloadVideo={handleDownloadVideo}
                  onRemoveVideo={handleRemoveVideo}
                  isSaved={!!currentVideoId}
                />
              ) : (
                <>
                  <GeneratedImageGrid 
                    results={currentResults}
                    isLoading={isLoading}
                    error={error}
                    onImageClick={setSelectedImage}
                    savedImages={currentProject.savedImages}
                    onSaveImage={handleSaveImage}
                    progressText={progressText}
                    onUseInScene={handleUseInScene}
                    showUseInSceneButton={mode === 'product'}
                  />
                  {currentProject.savedImages.length > 0 && (
                    <SavedImageGrid
                      images={currentProject.savedImages}
                      onRemoveImage={handleRemoveSavedImage}
                      onImageClick={setSelectedImage}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  };

  return (
    <>
      {renderAppContent()}
      {showMigrationPrompt && (
        <MigrationPrompt
          onMigrate={handleMigrate}
          onSkip={handleSkipMigration}
          onClose={handleCloseMigration}
        />
      )}
      {showPlanSelection && user && (
        <PlanSelectionModal
          onSelectPlan={handleSelectPlan}
          isProcessing={isProcessingPlan}
        />
      )}
      {showPaymentCheckout && user && selectedPlanForPayment && (
        <PaymentCheckout
          userId={user.id}
          plan={SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanForPayment)}
          proratedPrice={proratedPriceForPayment}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
          onError={handlePaymentError}
        />
      )}
      {user && <OfflineIndicator />}
      {showUpgradeModal && user && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgrade}
          trigger={upgradeModalTrigger}
        />
      )}
    </>
  );
}

export default App;