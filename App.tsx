import React, { useState, useCallback, useEffect } from 'react';
import GeneratedImageGrid from './components/GeneratedImageGrid';
import ImageModal from './components/ImageModal';
import SavedImageGrid from './components/SavedImageGrid';
import { UploadedImage, BatchResult, Project, BrandKit as BrandKitType, PromptTemplate, AppMode, ProductTemplate, PlanId } from './types';
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

const DEFAULT_BRAND_KIT: BrandKitType = {
  logo: null,
  useWatermark: false,
  colors: [],
};

function App() {
  const { t } = useTranslations();
  const { user } = useAuth();
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

  // Check URL for admin parameter
  const urlParams = new URLSearchParams(window.location.search);
  const isAdminView = urlParams.get('admin') === 'true';
  
  const [mainView, setMainView] = useState<'generator' | 'gallery' | 'admin'>(
    isAdminView ? 'admin' : 'generator'
  );
  
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
              
              // Clear URL parameters
              window.history.replaceState({}, document.title, window.location.pathname);
              
              alert('Ödeme başarısız oldu: ' + (verification.errorMessage || 'Bilinmeyen hata'));
              window.close();
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            localStorage.removeItem('pending_payment_token');
            localStorage.removeItem('pending_payment_time');
            
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
  useEffect(() => {
    if (!user) {
      setIsLoadingData(false);
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

  const handleSaveImage = async (base64Image: string) => {
    if (!currentProject || !user) return;
    
    try {
      // Upload image to storage (with offline support)
      const fileName = `mockup_${Date.now()}.png`;
      const imagePath = await offlineDataService.saveMockup(
        currentProject.id,
        user.id,
        base64Image,
        fileName
      );
      
      // Check if this path is already saved
      if (currentProject.savedImages.includes(imagePath)) return;
      
      // Update local state with storage path
      updateCurrentProject({ savedImages: [...currentProject.savedImages, imagePath] });
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
        // Paid plan - show payment checkout
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
      // Complete paid registration
      await registrationService.completePaidRegistration(user.id, transactionId);
      setShowPaymentCheckout(false);
      setSelectedPlanForPayment(null);
      
      // Reload the page to load user data
      window.location.reload();
    } catch (error) {
      console.error('Error completing paid registration:', error);
      alert('Abonelik aktivasyonu başarısız oldu. Lütfen destek ile iletişime geçin.');
    }
  };

  const handlePaymentCancel = () => {
    // Go back to plan selection
    setShowPaymentCheckout(false);
    setSelectedPlanForPayment(null);
    setShowPlanSelection(true);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Error is already shown in PaymentCheckout component
  };

  // Upgrade modal handlers
  const handleUpgrade = async (planId: PlanId) => {
    if (!user) return;

    try {
      // If upgrading from free tier, treat as new subscription
      const currentSubscription = await subscriptionService.getCurrentPlan(user.id);
      
      if (!currentSubscription || currentSubscription.planId === 'free') {
        // New subscription - show payment checkout
        setSelectedPlanForPayment(planId);
        setShowUpgradeModal(false);
        setShowPaymentCheckout(true);
      } else {
        // Upgrade existing subscription
        await subscriptionService.upgradeSubscription(user.id, planId);
        setShowUpgradeModal(false);
        
        // Show success message
        alert(t('upgrade_success_message') || 'Plan upgraded successfully!');
        
        // Reload to refresh quota
        window.location.reload();
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert(t('upgrade_error_message') || 'Failed to upgrade plan. Please try again.');
    }
  };

  // Show landing page if user is not logged in
  // Show app content if user is logged in
  const renderAppContent = () => {
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
         {mainView !== 'gallery' && mainView !== 'admin' && (
           <AppHeader 
             activeView={mainView} 
             onNavigate={setMainView}
             onUpgradeClick={() => {
               setUpgradeModalTrigger('manual');
               setShowUpgradeModal(true);
             }}
             quotaRefreshTrigger={quotaRefreshTrigger}
           />
         )}

         {mainView === 'generator' && renderGenerator()}
         {mainView === 'gallery' && <GalleryPage projects={projects} setProjects={setProjects} onNavigate={setMainView} onImageClick={setSelectedImage} />}
         {mainView === 'admin' && <AdminDashboard />}

        <ImageModal imageSrc={selectedImage} onClose={() => setSelectedImage(null)} />
      </div>
    );
  };

  const renderGenerator = () => (
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
                />
              </div>

              {/* Right Column: Results */}
              <div className="space-y-8">
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
              </div>
            </div>
        </div>
      </main>
  );

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