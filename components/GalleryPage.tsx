import React, { useState, useMemo, useEffect } from 'react';
import { Project } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { downloadImage } from '../utils/fileUtils';
import * as storageService from '../services/storageService';
import LazyImage from './LazyImage';
import SearchIcon from './icons/SearchIcon';
import DownloadIcon from './icons/DownloadIcon';
import TrashIcon from './icons/TrashIcon';
import GridViewIcon from './icons/GridViewIcon';
import PersonIcon from './icons/PersonIcon';
import SettingsIcon from './icons/SettingsIcon';
import LogoutIcon from './icons/LogoutIcon';
import ChatBubbleIcon from './icons/ChatBubbleIcon';
import NotificationsIcon from './icons/NotificationsIcon';
import ExpandMoreIcon from './icons/ExpandMoreIcon';
import VisibilityIcon from './icons/VisibilityIcon';
import AddPhotoAlternateIcon from './icons/AddPhotoAlternateIcon';

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

const GalleryPage: React.FC<GalleryPageProps> = ({ projects, setProjects, onNavigate, onImageClick }) => {
    const { t } = useTranslations();
    const [searchTerm, setSearchTerm] = useState('');
    const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
    const [isLoadingUrls, setIsLoadingUrls] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

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
        <div className="flex min-h-screen w-full">
            {/* SideNavBar */}
            <aside className="flex flex-col w-64 bg-background-light dark:bg-[#101F22] border-r border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2.5 p-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="size-6 text-primary">
                        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd"></path>
                        </svg>
                    </div>
                    <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">MockupSuite</h2>
                </div>
                <div className="flex flex-col justify-between flex-1 p-4">
                    <div className="flex flex-col gap-2">
                        <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/20 text-primary" href="#">
                            <GridViewIcon className="fill-primary" fill="currentColor" />
                            <p className="text-sm font-medium leading-normal">{t('dashboard_nav_creations')}</p>
                        </a>
                        <a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200" href="#">
                            <PersonIcon />
                            <p className="text-sm font-medium leading-normal">{t('dashboard_nav_profile')}</p>
                        </a>
                        <a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200" href="#">
                            <SettingsIcon />
                            <p className="text-sm font-medium leading-normal">{t('dashboard_nav_settings')}</p>
                        </a>
                    </div>
                    <div className="flex flex-col gap-1">
                        <a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200" href="#">
                            <LogoutIcon />
                            <p className="text-sm font-medium leading-normal">{t('dashboard_nav_logout')}</p>
                        </a>
                    </div>
                </div>
            </aside>
             {/* Main Content */}
            <div className="flex flex-col flex-1">
                {/* TopNavBar */}
                <header className="flex items-center justify-end whitespace-nowrap border-b border-gray-200 dark:border-gray-800 px-8 py-4 bg-background-light dark:bg-[#101F22]">
                    <div className="flex items-center gap-4">
                        <button onClick={() => onNavigate('generator')} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-[#111718] text-sm font-bold leading-normal tracking-[0.015em]">
                            <span className="truncate">{t('dashboard_generate_new_button')}</span>
                        </button>
                        <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
                            <ChatBubbleIcon />
                        </button>
                        <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
                            <NotificationsIcon />
                        </button>
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCMwZi-pG1PZZYH83MPiRHO9dZEPc2IiF2WaiprfN-d9Oid9-LB-TWFIkn8FWyJZSGY5-BdqGsQARICF-0yjuy2WXB5O88gHnDY2zsyKgqEn7bOVVfb-0Gv84TIXuyRg6wMSAB-hvLP462c7leIeIwD4LDBW-NIwq9Ep92uea5u_MhMZ10vM4NMLH3ZA2-v-nHIJibRUcgoCD9xsCt1Kr6Q2CUai7ujRyocmFEmIc5taClReiba0bNNZ7ILNeZId6t0DMDZlV7vx3Q")'}}></div>
                    </div>
                </header>
                {/* Page Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap justify-between gap-3 mb-6">
                            <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">{t('dashboard_title')}</h1>
                        </div>
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
                                        <div key={`${image.projectId}-${index}`} className="flex flex-col bg-background-light dark:bg-[#101F22] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                                            <div className="relative aspect-square w-full">
                                                <LazyImage
                                                    src={image.url}
                                                    alt={`${image.projectName} Mockup`}
                                                    className="w-full h-full"
                                                />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                                    <button onClick={() => onImageClick(image.url!)} title={t('dashboard_view_button')} className="bg-white/20 backdrop-blur-sm text-white rounded-full size-10 flex items-center justify-center hover:bg-white/30"><VisibilityIcon /></button>
                                                    <button onClick={() => {
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
                                                    }} title={t('download_button')} className="bg-white/20 backdrop-blur-sm text-white rounded-full size-10 flex items-center justify-center hover:bg-white/30"><DownloadIcon /></button>
                                                    <button onClick={() => handleDelete(image)} title={t('delete_button')} className="bg-white/20 backdrop-blur-sm text-red-400 rounded-full size-10 flex items-center justify-center hover:bg-white/30"><TrashIcon /></button>
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
                    </div>
                </main>
            </div>
        </div>
    );
};

export default GalleryPage;