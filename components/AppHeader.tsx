import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { useAuth } from './AuthProvider';
import MenuIcon from './icons/MenuIcon';
import QuotaWidget from './QuotaWidget';

type AppView = 'generator' | 'gallery';

interface AppHeaderProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onUpgradeClick?: () => void;
  quotaRefreshTrigger?: number;
}

const AppHeader: React.FC<AppHeaderProps> = ({ activeView, onNavigate, onUpgradeClick, quotaRefreshTrigger }) => {
    const { t } = useTranslations();
    const { signOut, user } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showQuotaDetails, setShowQuotaDetails] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const quotaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (quotaRef.current && !quotaRef.current.contains(event.target as Node)) {
                setShowQuotaDetails(false);
            }
        };

        if (showUserMenu || showQuotaDetails) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu, showQuotaDetails]);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };
    
    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 dark:border-white/10 px-4 sm:px-6 py-3 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center gap-4 text-neutral-dark dark:text-white">
                <div className="size-6 text-primary">
                     <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd"></path>
                    </svg>
                </div>
                <h2 className="text-neutral-dark dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">MockupSuite</h2>
            </div>
             <div className="hidden md:flex flex-1 justify-end items-center gap-8">
                <nav className="flex items-center gap-6">
                     <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); onNavigate('generator'); }} 
                        className={`text-sm font-medium leading-normal ${activeView === 'generator' ? 'text-primary' : 'text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary'}`}
                    >
                        {t('nav_create_new')}
                    </a>
                    <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); onNavigate('gallery'); }} 
                         className={`text-sm font-medium leading-normal ${activeView === 'gallery' ? 'text-primary' : 'text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary'}`}
                    >
                        {t('nav_gallery')}
                    </a>
                </nav>
                <div className="flex items-center gap-4">
                    {/* Quota Widget - Compact View */}
                    <div className="relative" ref={quotaRef}>
                        <button
                            onClick={() => setShowQuotaDetails(!showQuotaDetails)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#3b4f54] bg-white dark:bg-[#1c2527] hover:border-primary dark:hover:border-primary transition-colors"
                            title="Click to view details"
                        >
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                Quota
                            </span>
                        </button>
                        
                        {/* Expanded Quota Details */}
                        {showQuotaDetails && (
                            <div className="absolute right-0 mt-2 w-80 z-50">
                                <QuotaWidget 
                                    onUpgradeClick={onUpgradeClick}
                                    refreshTrigger={quotaRefreshTrigger}
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 hover:ring-2 hover:ring-primary transition-all"
                            data-alt="User avatar"
                            style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCMwZi-pG1PZZYH83MPiRHO9dZEPc2IiF2WaiprfN-d9Oid9-LB-TWFIkn8FWyJZSGY5-BdqGsQARICF-0yjuy2WXB5O88gHnDY2zsyKgqEn7bOVVfb-0Gv84TIXuyRg6wMSAB-hvLP462c7leIeIwD4LDBW-NIwq9Ep92uea5u_MhMZ10vM4NMLH3ZA2-v-nHIJibRUcgoCD9xsCt1Kr6Q2CUai7ujRyocmFEmIc5taClReiba0bNNZ7ILNeZId6t0DMDZlV7vx3Q")'}}
                        />
                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1c2527] rounded-lg shadow-lg border border-gray-200 dark:border-[#3b4f54] py-1 z-50">
                                <div className="px-4 py-2 border-b border-gray-200 dark:border-[#3b4f54]">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {user?.email}
                                    </p>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#283639]"
                                >
                                    {t('auth_sign_out')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
             <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                <MenuIcon className="text-gray-800 dark:text-white" />
            </button>
        </header>
    );
};

export default AppHeader;