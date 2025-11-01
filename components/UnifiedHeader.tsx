import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import QuotaWidget from './QuotaWidget';

interface UnifiedHeaderProps {
  onMenuClick: () => void;
  onUpgradeClick?: () => void;
  quotaRefreshTrigger?: number;
  onProfileClick?: () => void;
}

const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({ 
  onMenuClick, 
  onUpgradeClick,
  quotaRefreshTrigger,
  onProfileClick 
}) => {
  const { user } = useAuth();
  const [showQuotaDetails, setShowQuotaDetails] = useState(false);
  const quotaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quotaRef.current && !quotaRef.current.contains(event.target as Node)) {
        setShowQuotaDetails(false);
      }
    };

    if (showQuotaDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQuotaDetails]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-end px-6 py-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-gray-200 dark:border-white/10">
      {/* Right: Quota Widget and Profile */}
      <div className="flex items-center gap-4">
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

        {/* Profile Photo */}
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-primary transition-all cursor-pointer"
          style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCMwZi-pG1PZZYH83MPiRHO9dZEPc2IiF2WaiprfN-d9Oid9-LB-TWFIkn8FWyJZSGY5-BdqGsQARICF-0yjuy2WXB5O88gHnDY2zsyKgqEn7bOVVfb-0Gv84TIXuyRg6wMSAB-hvLP462c7leIeIwD4LDBW-NIwq9Ep92uea5u_MhMZ10vM4NMLH3ZA2-v-nHIJibRUcgoCD9xsCt1Kr6Q2CUai7ujRyocmFEmIc5taClReiba0bNNZ7ILNeZId6t0DMDZlV7vx3Q")'}}
          title={user?.email || 'User profile'}
          onClick={onProfileClick}
          role="button"
          aria-label="View profile"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onProfileClick?.();
            }
          }}
        />
      </div>
    </header>
  );
};

export default UnifiedHeader;
