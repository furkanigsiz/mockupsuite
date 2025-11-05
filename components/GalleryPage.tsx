import React, { useState, useMemo, useEffect } from 'react';
import { Project } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { downloadImage } from '../utils/fileUtils';
import * as storageService from '../services/storageService';
import LazyImage from './LazyImage';
import SearchIcon from './icons/SearchIcon';
import DownloadIcon from './icons/DownloadIcon';
import TrashIcon from './icons/TrashIcon';
import ExpandMoreIcon from './icons/ExpandMoreIcon';
import VisibilityIcon from './icons/VisibilityIcon';
import AddPhotoAlternateIcon from './icons/AddPhotoAlternateIcon';
import CopyIcon from './icons/CopyIcon';
import { copyImageToClipboard } from '../utils/imageProcessing';
import { integrationService } from '../services/integrationService';
import { authService } from '../services/authService';
import { useToast, ToastContainer } from './Toast';

type AppView = 'generator' | 'gallery';
interface GalleryPageProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onNavigate: (view: AppView) => void;
  onImageClick: (base64Image: string) => void;
}

type GalleryImage = {
    base64: string; // Storage path
    url?: string; // Signed URL for display
    projectId: string;
    projectName: string;
    date: number; // For sorting
};

type GalleryTab = 'mockups' | 'products';

const GalleryPage: React.FC<GalleryPageProps> = ({ projects, setProjects, onNavigate, onImageClick }) => {
    const { t } = useTranslations();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<GalleryTab>('mockups');
    const [searchTerm, setSearchTerm] = useState('');
    const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
    const [isLoadingUrls, setIsLoadingUrls] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
    const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    
    // Shopify products state
    const [shopifyProducts, setShopifyProducts] = useState<any[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [hasMoreProducts, setHasMoreProducts] = useState(false);
    const [productsNextCursor, setProductsNextCursor] = useState<string | null>(null);

    const handleCopyImage = async (url: string, index: number) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                await copyImageToClipboard(base64);
                setCopiedIndex(index);
                
                // Show success notification
                const notification = document.createElement('div');
                notification.textContent = '✓ Image copied to clipboard!';
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #10b981;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    z-index: 9999;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    animation: slideIn 0.3s ease-out;
                `;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.style.animation = 'slideOut 0.3s ease-out';
                    setTimeout(() => document.body.removeChild(notification), 300);
                }, 2000);
                
                setTimeout(() => setCopiedIndex(null), 2000);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Failed to copy image:', error);
            alert('Failed to copy image to clipboard');
        }
    };

    const [allMockups, setAllMockups] = useState<Array<{
        id: string;
        image_path: string;
        thumbnail_path: string | null;
        project_id: string;
        created_at: string;
    }>>([]);

    const allSavedImages: GalleryImage[] = useMemo(() => {
        return allMockups.map(mockup => {
            const project = projects.find(p => p.id === mockup.project_id);
            // Use full image for gallery display (high quality)
            return {
                base64: mockup.image_path, // Storage path (full image)
                url: imageUrls.get(mockup.image_path), // Signed URL (full image)
                projectId: mockup.project_id,
                projectName: project?.name || 'Unknown Project',
                date: new Date(mockup.created_at).getTime(),
            };
        });
    }, [allMockups, imageUrls, projects]);

    // Check if Google Drive is connected
    useEffect(() => {
        const checkGoogleDriveConnection = async () => {
            try {
                const user = await authService.getCurrentUser();
                if (!user) return;

                const integrations = await integrationService.getIntegrations(user.id);
                const googleDrive = integrations.find(i => i.name === 'Google Drive');
                setIsGoogleDriveConnected(googleDrive?.isConnected || false);
            } catch (error) {
                console.error('Failed to check Google Drive connection:', error);
            }
        };

        checkGoogleDriveConnection();
    }, []);

    // Load Shopify products when Products tab is active
    useEffect(() => {
        if (activeTab !== 'products') return;

        const loadShopifyProducts = async () => {
            setIsLoadingProducts(true);
            try {
                const { getShopifyProducts } = await import('../services/databaseService');
                const user = await authService.getCurrentUser();
                if (!user) {
                    setIsLoadingProducts(false);
                    return;
                }

                const result = await getShopifyProducts(user.id, 20);
                setShopifyProducts(result.products);
                setHasMoreProducts(result.hasMore);
                setProductsNextCursor(result.nextCursor);
            } catch (error) {
                console.error('Failed to load Shopify products:', error);
                toast.error('Failed to load products');
            } finally {
                setIsLoadingProducts(false);
            }
        };

        loadShopifyProducts();
    }, [activeTab]);

    // Load initial paginated mockups
    useEffect(() => {
        const loadInitialMockups = async () => {
            setIsLoadingUrls(true);
            try {
                const { getSavedMockupsPaginated } = await import('../services/databaseService');
                const { authService } = await import('../services/authService');
                
                const user = await authService.getCurrentUser();
                if (!user) {
                    setIsLoadingUrls(false);
                    return;
                }

                const result = await getSavedMockupsPaginated(user.id, 20);
                setAllMockups(result.mockups);
                setHasMore(result.hasMore);
                setNextCursor(result.nextCursor);

                // Load signed URLs for the fetched mockups (full images for quality)
                const urlMap = new Map<string, string>();
                for (const mockup of result.mockups) {
                    try {
                        // Load full image URL for high quality display
                        const url = await storageService.getImageUrl(mockup.image_path);
                        urlMap.set(mockup.image_path, url);
                    } catch (e) {
                        console.error('Failed to load image URL:', e);
                    }
                }
                setImageUrls(urlMap);
            } catch (e) {
                console.error('Failed to load mockups:', e);
            } finally {
                setIsLoadingUrls(false);
            }
        };

        loadInitialMockups();
    }, []);

    // Load more mockups
    const loadMoreMockups = async () => {
        if (!nextCursor || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const { getSavedMockupsPaginated } = await import('../services/databaseService');
            const { authService } = await import('../services/authService');
            
            const user = await authService.getCurrentUser();
            if (!user) return;

            const result = await getSavedMockupsPaginated(user.id, 20, nextCursor);
            setAllMockups(prev => [...prev, ...result.mockups]);
            setHasMore(result.hasMore);
            setNextCursor(result.nextCursor);

            // Load signed URLs for the new mockups (full images for quality)
            const urlMap = new Map(imageUrls);
            for (const mockup of result.mockups) {
                try {
                    // Load full image URL for high quality display
                    const url = await storageService.getImageUrl(mockup.image_path);
                    urlMap.set(mockup.image_path, url);
                } catch (e) {
                    console.error('Failed to load image URL:', e);
                }
            }
            setImageUrls(urlMap);
        } catch (e) {
            console.error('Failed to load more mockups:', e);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Preload next page when user scrolls near the bottom
    useEffect(() => {
        if (!hasMore || isLoadingMore || !nextCursor) return;

        const handleScroll = () => {
            const scrollPosition = window.innerHeight + window.scrollY;
            const pageHeight = document.documentElement.scrollHeight;
            
            // Preload when user is 80% down the page
            if (scrollPosition >= pageHeight * 0.8) {
                loadMoreMockups();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore, isLoadingMore, nextCursor]);
    
    const filteredImages = useMemo(() => {
        return allSavedImages.filter(image => {
            const tempName = `${image.projectName} Mockup`; // Create a name for searching
            const searchMatch = searchTerm === '' || tempName.toLowerCase().includes(searchTerm.toLowerCase());
            return searchMatch;
        });
    }, [allSavedImages, searchTerm]);

    const toggleImageSelection = (imagePath: string) => {
        const newSelection = new Set(selectedImages);
        if (newSelection.has(imagePath)) {
            newSelection.delete(imagePath);
        } else {
            newSelection.add(imagePath);
        }
        setSelectedImages(newSelection);
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedImages(new Set());
    };

    const selectAll = () => {
        setSelectedImages(new Set(filteredImages.map(img => img.base64)));
    };

    const deselectAll = () => {
        setSelectedImages(new Set());
    };

    const handleSaveToGoogleDrive = async (imagePaths?: string[]) => {
        const pathsToUpload = imagePaths || (isSelectionMode ? Array.from(selectedImages) : filteredImages.map(img => img.base64));
        
        if (pathsToUpload.length === 0) {
            toast.error(t('integration_error_no_files_selected'));
            return;
        }

        if (!isGoogleDriveConnected) {
            toast.error(t('integration_error_connection_failed').replace('{platform}', 'Google Drive'));
            return;
        }

        // Check if folder is selected
        const folderDataStr = localStorage.getItem('googleDriveFolder');
        if (!folderDataStr) {
            toast.error(t('integration_error_no_folder_selected') || 'Please select a Google Drive folder first from the Integrations page.');
            return;
        }

        const folderData = JSON.parse(folderDataStr);

        setIsUploadingToDrive(true);

        try {
            const user = await authService.getCurrentUser();
            if (!user) {
                toast.error(t('error_not_authenticated'));
                setIsUploadingToDrive(false);
                return;
            }

            // Get the Google Drive integration ID
            const integrations = await integrationService.getIntegrations(user.id);
            const googleDrive = integrations.find(i => i.name === 'Google Drive');
            
            if (!googleDrive) {
                toast.error(t('integration_error_connection_failed').replace('{platform}', 'Google Drive'));
                setIsUploadingToDrive(false);
                return;
            }

            // Get URLs for selected images
            const mockupUrls = pathsToUpload.map(path => imageUrls.get(path)).filter(url => url) as string[];

            // Call the sync operation to upload mockups
            const result = await integrationService.syncIntegration(
                user.id,
                googleDrive.id,
                'upload_mockups',
                {
                    mockupUrls,
                    folderId: folderData.folderId,
                }
            );

            if (result.success) {
                const message = t('integration_files_saved')
                    .replace('{count}', result.filesUploaded.toString())
                    .replace('{platform}', folderData.folderName);
                toast.success(message);
                
                // Clear selection after successful upload
                if (isSelectionMode) {
                    setSelectedImages(new Set());
                }
            } else {
                toast.error(t('integration_error_upload_failed').replace('{platform}', 'Google Drive'));
            }
        } catch (error: any) {
            console.error('Failed to upload to Google Drive:', error);
            const errorMessage = error.userMessage || t('integration_error_upload_failed').replace('{platform}', 'Google Drive');
            toast.error(errorMessage);
        } finally {
            setIsUploadingToDrive(false);
        }
    };

    const handleDelete = async (imageToDelete: GalleryImage) => {
        // Import the database and storage services
        const { deleteMockupByImagePath } = await import('../services/databaseService');
        const { deleteImage } = await import('../services/storageService');
        
        try {
            // Delete from database and storage
            await deleteMockupByImagePath(imageToDelete.base64); // base64 field now contains the storage path
            await deleteImage(imageToDelete.base64);
            
            // Update local state - remove from allMockups
            setAllMockups(prev => prev.filter(m => m.image_path !== imageToDelete.base64));
            
            // Also update projects state for consistency
            setProjects(prevProjects => 
                prevProjects.map(p => {
                    if (p.id === imageToDelete.projectId) {
                        return { ...p, savedImages: p.savedImages.filter(img => img !== imageToDelete.base64) };
                    }
                    return p;
                })
            );
        } catch (e) {
            console.error('Failed to delete image:', e);
            alert('Failed to delete image. Please try again.');
        }
    };

    return (
        <div className="w-full min-h-screen bg-background-light dark:bg-background-dark">
            {/* CSS Animations for notifications */}
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `}</style>
            {/* Page Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {/* New Create Button and Google Drive Controls */}
                    <div className="mb-6 flex items-center gap-3 flex-wrap">
                        <button 
                            onClick={() => onNavigate('generator')} 
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors"
                        >
                            <AddPhotoAlternateIcon />
                            <span>{t('dashboard_generate_new_button')}</span>
                        </button>
                        
                        {isGoogleDriveConnected && filteredImages.length > 0 && (
                            <>
                                <button
                                    onClick={toggleSelectionMode}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                    {isSelectionMode ? (t as any)('cancel_selection') || 'Cancel' : (t as any)('select_images') || 'Select'}
                                </button>
                                {isSelectionMode && (
                                    <>
                                        <button
                                            onClick={selectAll}
                                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors"
                                        >
                                            {(t as any)('select_all') || 'Select All'}
                                        </button>
                                        <button
                                            onClick={deselectAll}
                                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors"
                                        >
                                            {(t as any)('deselect_all') || 'Deselect All'}
                                        </button>
                                        <button
                                            onClick={() => handleSaveToGoogleDrive()}
                                            disabled={selectedImages.size === 0 || isUploadingToDrive}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            {isUploadingToDrive ? t('profile_uploading_avatar') : `${(t as any)('upload_selected') || 'Upload'} (${selectedImages.size})`}
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap justify-between gap-3 mb-6">
                        <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">{t('dashboard_title')}</h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('mockups')}
                            className={`px-6 py-3 font-semibold transition-colors relative ${
                                activeTab === 'mockups'
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            {(t as any)('gallery_tab_mockups') || 'Mockups'}
                        </button>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-6 py-3 font-semibold transition-colors relative ${
                                activeTab === 'products'
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            {(t as any)('gallery_tab_products') || 'Ürünlerim'}
                        </button>
                    </div>
                        {/* Mockups Tab Content */}
                        {activeTab === 'mockups' && (
                            <>
                        {/* Search and Filters */}
                        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                            <div className="relative flex-1 w-full">
                                 <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 dark:text-gray-500">
                                    <SearchIcon className="h-5 w-5"/>
                                 </div>
                                <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-gray-100 dark:bg-gray-800/50 h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 px-12 text-base font-normal leading-normal" placeholder={t('dashboard_search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                            </div>
                            <div className="flex gap-2 self-start md:self-center">
                                <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 px-4">
                                    <p className="text-gray-800 dark:text-gray-300 text-sm font-medium leading-normal">{t('dashboard_filter_all')}</p>
                                    <ExpandMoreIcon className="text-gray-500 dark:text-gray-400 w-5 h-5" />
                                </button>
                                <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 px-4">
                                    <p className="text-gray-800 dark:text-gray-300 text-sm font-medium leading-normal">{t('dashboard_filter_by_product')}</p>
                                     <ExpandMoreIcon className="text-gray-500 dark:text-gray-400 w-5 h-5" />
                                </button>
                                <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 px-4">
                                    <p className="text-gray-800 dark:text-gray-300 text-sm font-medium leading-normal">{t('dashboard_filter_by_date')}</p>
                                     <ExpandMoreIcon className="text-gray-500 dark:text-gray-400 w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    {/* Content Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {isLoadingUrls ? (
                            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 flex items-center justify-center p-12">
                                <p className="text-gray-500 dark:text-gray-400">Loading images...</p>
                            </div>
                        ) : (
                            filteredImages.map((image, index) => {
                                if (!image.url) return null;
                                
                                return (
                                    <div key={`${image.projectId}-${index}`} className="flex flex-col bg-background-light dark:bg-[#101F22] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative">
                                        <div 
                                            className="relative aspect-square w-full cursor-pointer"
                                            onClick={() => {
                                                if (isSelectionMode) {
                                                    toggleImageSelection(image.base64);
                                                } else {
                                                    console.log('Image clicked:', image.url);
                                                    if (image.url) {
                                                        onImageClick(image.url);
                                                    }
                                                }
                                            }}
                                        >
                                            <LazyImage
                                                src={image.url}
                                                alt={`${image.projectName} Mockup`}
                                                className="w-full h-full pointer-events-none select-none"
                                            />
                                            
                                            {/* Selection checkbox */}
                                            {isSelectionMode && (
                                                <div 
                                                    className="absolute top-2 left-2 z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleImageSelection(image.base64);
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedImages.has(image.base64)}
                                                        onChange={() => {}}
                                                        className="w-5 h-5 cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                            
                                            <div 
                                                className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 flex-wrap p-2"
                                            >
                                                {!isSelectionMode && (
                                                    <>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (image.url) {
                                                                    onImageClick(image.url);
                                                                }
                                                            }} 
                                                            title={t('dashboard_view_button')} 
                                                            className="bg-white/20 backdrop-blur-sm text-white rounded-full size-10 flex items-center justify-center hover:bg-white/30 transition-colors relative z-10"
                                                        >
                                                            <VisibilityIcon />
                                                        </button>
                                                        {isGoogleDriveConnected && (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSaveToGoogleDrive([image.base64]);
                                                                }} 
                                                                disabled={isUploadingToDrive}
                                                                title="Upload to Google Drive" 
                                                                className="bg-green-600/80 backdrop-blur-sm text-white rounded-full size-10 flex items-center justify-center hover:bg-green-500 transition-colors relative z-10 disabled:opacity-50"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {!isSelectionMode && (
                                                    <>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyImage(image.url!, index);
                                                            }} 
                                                            title={copiedIndex === index ? 'Copied!' : 'Copy to clipboard'} 
                                                            className={`backdrop-blur-sm rounded-full size-10 flex items-center justify-center transition-colors relative z-10 ${
                                                                copiedIndex === index 
                                                                    ? 'bg-green-600/80 text-white' 
                                                                    : 'bg-white/20 text-white hover:bg-white/30'
                                                            }`}
                                                        >
                                                            <CopyIcon />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Fetch and download
                                                                fetch(image.url!)
                                                                    .then(res => res.blob())
                                                                    .then(blob => {
                                                                        const reader = new FileReader();
                                                                        reader.onloadend = () => {
                                                                            const base64 = reader.result as string;
                                                                            downloadImage(base64.split(',')[1], `${image.projectName}_mockup.png`);
                                                                        };
                                                                        reader.readAsDataURL(blob);
                                                                    })
                                                                    .catch(e => console.error('Failed to download image:', e));
                                                            }} 
                                                            title={t('download_button')} 
                                                            className="bg-white/20 backdrop-blur-sm text-white rounded-full size-10 flex items-center justify-center hover:bg-white/30 transition-colors relative z-10"
                                                        >
                                                            <DownloadIcon />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(image);
                                                            }} 
                                                            title={t('delete_button')} 
                                                            className="bg-white/20 backdrop-blur-sm text-red-400 rounded-full size-10 flex items-center justify-center hover:bg-white/30 transition-colors relative z-10"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-gray-900 dark:text-white font-bold truncate">{image.projectName} Mockup</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard_card_created')}: {new Date(image.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {filteredImages.length === 0 && !isLoadingUrls && (
                            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center flex flex-col items-center justify-center">
                                <div className="bg-primary/10 text-primary rounded-full p-4 mb-4">
                                    <AddPhotoAlternateIcon className="!text-4xl h-10 w-10"/>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('dashboard_empty_title')}</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">{t('dashboard_empty_subtitle')}</p>
                                <button onClick={() => onNavigate('generator')} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-[#111718] text-sm font-bold leading-normal tracking-[0.015em]">
                                    <span>{t('dashboard_empty_button')}</span>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Load More Button */}
                    {hasMore && filteredImages.length > 0 && (
                        <div className="flex justify-center mt-8">
                            <button
                                onClick={loadMoreMockups}
                                disabled={isLoadingMore}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-[#111718] rounded-lg font-bold hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoadingMore ? (
                                    <>
                                        <div className="animate-spin h-5 w-5 border-2 border-[#111718] border-t-transparent rounded-full"></div>
                                        <span>Loading...</span>
                                    </>
                                ) : (
                                    <span>Load More</span>
                                )}
                            </button>
                        </div>
                    )}
                    </>
                        )}

                        {/* Products Tab Content */}
                        {activeTab === 'products' && (
                            <>
                                {/* Products Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {isLoadingProducts ? (
                                        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 flex items-center justify-center p-12">
                                            <p className="text-gray-500 dark:text-gray-400">Loading products...</p>
                                        </div>
                                    ) : shopifyProducts.length === 0 ? (
                                        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center flex flex-col items-center justify-center">
                                            <div className="bg-primary/10 text-primary rounded-full p-4 mb-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                                {(t as any)('products_empty_title') || 'No Products Yet'}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
                                                {(t as any)('products_empty_subtitle') || 'Connect your Shopify store and sync products to see them here.'}
                                            </p>
                                            <button 
                                                onClick={() => window.location.href = '/integrations'} 
                                                className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-[#111718] text-sm font-bold leading-normal tracking-[0.015em]"
                                            >
                                                <span>{(t as any)('products_empty_button') || 'Go to Integrations'}</span>
                                            </button>
                                        </div>
                                    ) : (
                                        shopifyProducts.map((product) => (
                                            <div key={product.id} className="flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                                                <div className="relative aspect-square w-full">
                                                    {product.images && product.images.length > 0 ? (
                                                        <img
                                                            src={product.images[0].src}
                                                            alt={product.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Hover Actions */}
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                                        {product.images && product.images.length > 0 && (
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        // Convert Shopify image to base64
                                                                        const imageUrl = product.images[0].src;
                                                                        const response = await fetch(imageUrl);
                                                                        const blob = await response.blob();
                                                                        
                                                                        const reader = new FileReader();
                                                                        reader.onloadend = () => {
                                                                            const base64WithPrefix = reader.result as string;
                                                                            // Remove data URL prefix to get pure base64
                                                                            const base64 = base64WithPrefix.split(',')[1];
                                                                            
                                                                            // Create uploaded image object with pure base64
                                                                            const uploadedImage = {
                                                                                base64,
                                                                                name: product.title,
                                                                                type: blob.type,
                                                                                previewUrl: imageUrl,
                                                                            };
                                                                            
                                                                            // Store in localStorage for generator to pick up
                                                                            localStorage.setItem('pendingUploadedImage', JSON.stringify(uploadedImage));
                                                                            
                                                                            // Navigate to generator
                                                                            onNavigate('generator');
                                                                        };
                                                                        reader.readAsDataURL(blob);
                                                                    } catch (error) {
                                                                        console.error('Failed to load product image:', error);
                                                                        toast.error('Failed to load product image');
                                                                    }
                                                                }}
                                                                title="Use for mockup"
                                                                className="bg-primary/80 backdrop-blur-sm text-[#111718] rounded-full size-10 flex items-center justify-center hover:bg-primary transition-colors"
                                                            >
                                                                <AddPhotoAlternateIcon />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const { deleteShopifyProduct } = await import('../services/databaseService');
                                                                    const user = await authService.getCurrentUser();
                                                                    if (!user) return;
                                                                    
                                                                    await deleteShopifyProduct(product.id, user.id);
                                                                    setShopifyProducts(prev => prev.filter(p => p.id !== product.id));
                                                                    toast.success('Product deleted');
                                                                } catch (error) {
                                                                    console.error('Failed to delete product:', error);
                                                                    toast.error('Failed to delete product');
                                                                }
                                                            }}
                                                            title="Delete product"
                                                            className="bg-white/20 backdrop-blur-sm text-red-400 rounded-full size-10 flex items-center justify-center hover:bg-white/30 transition-colors"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="text-gray-900 dark:text-white font-bold truncate mb-1">{product.title}</h3>
                                                    {product.vendor && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{product.vendor}</p>
                                                    )}
                                                    {product.variants && product.variants.length > 0 && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                            {product.variants[0].price} {product.variants.length > 1 && `(+${product.variants.length - 1} variants)`}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Load More Products Button */}
                                {hasMoreProducts && shopifyProducts.length > 0 && (
                                    <div className="flex justify-center mt-8">
                                        <button
                                            onClick={async () => {
                                                if (!productsNextCursor || isLoadingProducts) return;
                                                
                                                setIsLoadingProducts(true);
                                                try {
                                                    const { getShopifyProducts } = await import('../services/databaseService');
                                                    const user = await authService.getCurrentUser();
                                                    if (!user) return;

                                                    const result = await getShopifyProducts(user.id, 20, productsNextCursor);
                                                    setShopifyProducts(prev => [...prev, ...result.products]);
                                                    setHasMoreProducts(result.hasMore);
                                                    setProductsNextCursor(result.nextCursor);
                                                } catch (error) {
                                                    console.error('Failed to load more products:', error);
                                                } finally {
                                                    setIsLoadingProducts(false);
                                                }
                                            }}
                                            disabled={isLoadingProducts}
                                            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-[#111718] rounded-lg font-bold hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoadingProducts ? (
                                                <>
                                                    <div className="animate-spin h-5 w-5 border-2 border-[#111718] border-t-transparent rounded-full"></div>
                                                    <span>Loading...</span>
                                                </>
                                            ) : (
                                                <span>Load More</span>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                </div>
            </main>
            
            {/* Toast Notifications */}
            <ToastContainer messages={toast.messages} onClose={toast.closeToast} />
        </div>
    );
};

export default GalleryPage;