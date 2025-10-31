import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import {
  isOnline,
  onConnectionChange,
  syncPendingChanges,
  getPendingChangesCount,
  SyncResult,
} from '../services/syncService';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export const OfflineIndicator: React.FC = () => {
  const { t } = useTranslations();
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  // Update pending changes count
  const updatePendingCount = async () => {
    const count = await getPendingChangesCount();
    setPendingCount(count);
  };

  // Handle sync
  const handleSync = async () => {
    if (!online || syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const result: SyncResult = await syncPendingChanges();
      
      if (result.success) {
        setSyncStatus('success');
        await updatePendingCount();
        
        // Reset to idle after 2 seconds
        setTimeout(() => {
          setSyncStatus('idle');
        }, 2000);
      } else {
        setSyncStatus('error');
        setSyncError(result.errors.join(', '));
      }
    } catch (error) {
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Set up connection change listener
  useEffect(() => {
    const unsubscribe = onConnectionChange(async (isOnline) => {
      setOnline(isOnline);
      
      // Auto-sync when coming back online
      if (isOnline && pendingCount > 0) {
        await handleSync();
      }
    });

    return unsubscribe;
  }, [pendingCount]);

  // Update pending count on mount and periodically
  useEffect(() => {
    updatePendingCount();
    
    // Check for pending changes every 30 seconds
    const interval = setInterval(updatePendingCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Don't show indicator if online and no pending changes
  if (online && pendingCount === 0 && syncStatus === 'idle') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg
          transition-all duration-300
          ${
            !online
              ? 'bg-gray-800 dark:bg-gray-700 text-white'
              : syncStatus === 'syncing'
              ? 'bg-blue-600 text-white'
              : syncStatus === 'success'
              ? 'bg-green-600 text-white'
              : syncStatus === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 dark:bg-gray-700 text-white'
          }
        `}
      >
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {!online ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          ) : syncStatus === 'syncing' ? (
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ) : syncStatus === 'success' ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : syncStatus === 'error' ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        {/* Status Text */}
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {!online
              ? t('offline_status')
              : syncStatus === 'syncing'
              ? t('syncing_status')
              : syncStatus === 'success'
              ? t('sync_complete')
              : syncStatus === 'error'
              ? t('sync_failed')
              : t('online_status')}
          </span>
          
          {pendingCount > 0 && syncStatus !== 'syncing' && (
            <span className="text-xs opacity-80">
              {t('pending_changes', { count: pendingCount.toString() })}
            </span>
          )}
          
          {syncError && syncStatus === 'error' && (
            <span className="text-xs opacity-80 max-w-xs truncate">
              {syncError}
            </span>
          )}
        </div>

        {/* Retry Button */}
        {syncStatus === 'error' && online && (
          <button
            onClick={handleSync}
            className="ml-2 px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
          >
            {t('retry_sync')}
          </button>
        )}
      </div>
    </div>
  );
};
