import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { useAuth } from './AuthProvider';
import { Integration, IntegrationCategory } from '../types';
import { integrationService } from '../services/integrationService';
import Spinner from './Spinner';
import IntegrationCard from './IntegrationCard';
import ConnectionModal from './ConnectionModal';
import ApiTokenModal from './ApiTokenModal';
import ShopifyConnectModal from './ShopifyConnectModal';
import { useToast, ToastContainer } from './Toast';
import FolderPickerModal from './FolderPickerModal';

const IntegrationsPage: React.FC = () => {
  const { t } = useTranslations();
  const { user } = useAuth();
  const toast = useToast();
  
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | 'all'>('all');
  const [syncingIntegrations, setSyncingIntegrations] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    integration: Integration | null;
    mode: 'connect' | 'disconnect' | null;
  }>({
    isOpen: false,
    integration: null,
    mode: null,
  });
  const [folderPickerState, setFolderPickerState] = useState<{
    isOpen: boolean;
    folders: Array<{ id: string; name: string }>;
    isLoading: boolean;
    integrationId: string | null;
  }>({
    isOpen: false,
    folders: [],
    isLoading: false,
    integrationId: null,
  });
  const [shopifyModalState, setShopifyModalState] = useState<{
    isOpen: boolean;
    integrationId: string | null;
  }>({
    isOpen: false,
    integrationId: null,
  });

  // Load integrations on mount
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadIntegrations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await integrationService.getIntegrations(user.id);
        setIntegrations(data);
      } catch (err: any) {
        console.error('Failed to load integrations:', err);
        setError(err.userMessage || 'Failed to load integrations');
      } finally {
        setIsLoading(false);
      }
    };

    loadIntegrations();
  }, [user]);

  // Listen for OAuth popup success messages
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      // Handle OAuth success from popup
      if (event.data?.type === 'oauth_success') {
        const platformName = event.data.platform || 'platform';
        const successMessage = (t as any)('integration_connected_success')?.replace('{platform}', platformName) 
          || `Successfully connected to ${platformName}`;
        
        toast.success(successMessage);
        
        // Reload integrations to update connection status
        if (user) {
          try {
            const data = await integrationService.getIntegrations(user.id);
            setIntegrations(data);
          } catch (err: any) {
            console.error('Failed to reload integrations:', err);
          }
        }
      }

      // Handle OAuth error from popup
      if (event.data?.type === 'oauth_error') {
        const errorMessage = event.data.error || (t as any)('integration_oauth_error') || 'Authorization failed';
        toast.error(errorMessage);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user, t, toast]);

  // Filter integrations based on search and category
  const filteredIntegrations = integrations.filter((integration) => {
    // Filter by search query
    const matchesSearch = !searchQuery || 
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by category
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;

    // Only show active integrations in main section
    const isActive = integration.status === 'active';

    return matchesSearch && matchesCategory && isActive;
  });

  // Get coming soon integrations
  const comingSoonIntegrations = integrations.filter((integration) => {
    const matchesSearch = !searchQuery || 
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;

    return matchesSearch && matchesCategory && integration.status === 'coming_soon';
  });

  // Category options
  const categories: Array<{ value: IntegrationCategory | 'all'; label: string }> = [
    { value: 'all', label: (t as any)('integrations_category_all') || 'All' },
    { value: 'design-tools', label: (t as any)('integrations_category_design_tools') || 'Design Tools' },
    { value: 'ecommerce', label: (t as any)('integrations_category_ecommerce') || 'E-commerce' },
    { value: 'marketing', label: (t as any)('integrations_category_marketing') || 'Marketing' },
    { value: 'storage', label: (t as any)('integrations_category_storage') || 'Storage' },
  ];

  // Handler functions for IntegrationCard
  const handleConnect = (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;
    
    // Special handling for Shopify - show shop domain modal
    if (integration.name.toLowerCase() === 'shopify') {
      setShopifyModalState({
        isOpen: true,
        integrationId,
      });
      return;
    }
    
    setModalState({
      isOpen: true,
      integration,
      mode: 'connect',
    });
  };

  const handleDisconnect = (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;
    
    setModalState({
      isOpen: true,
      integration,
      mode: 'disconnect',
    });
  };

  const handleModalClose = () => {
    setModalState({
      isOpen: false,
      integration: null,
      mode: null,
    });
  };

  const handleModalSuccess = async (successMessage?: string) => {
    // Show success toast
    if (successMessage) {
      toast.success(successMessage);
    }
    
    // Reload integrations to update connection status
    if (!user) return;
    try {
      const data = await integrationService.getIntegrations(user.id);
      setIntegrations(data);
    } catch (err: any) {
      console.error('Failed to reload integrations:', err);
      toast.error(err.userMessage || 'Failed to reload integrations');
    }
  };

  const handleSync = async (integrationId: string, operation: string) => {
    if (!user) return;
    
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;
    
    // Handle folder selection for Google Drive
    if (operation === 'select_folder' && integration.name === 'Google Drive') {
      setFolderPickerState({
        isOpen: true,
        folders: [],
        isLoading: true,
        integrationId,
      });
      
      try {
        // Use integration service to list folders (handles token refresh automatically)
        const result = await integrationService.syncIntegration(user.id, integrationId, 'list_folders');
        
        setFolderPickerState(prev => ({
          ...prev,
          folders: result.folders || [],
          isLoading: false,
        }));
      } catch (err: any) {
        console.error('Failed to list folders:', err);
        toast.error(err.userMessage || err.message || 'Failed to load folders');
        setFolderPickerState({
          isOpen: false,
          folders: [],
          isLoading: false,
          integrationId: null,
        });
      }
      return;
    }
    
    // Add to syncing set to show loading state
    setSyncingIntegrations(prev => new Set(prev).add(integrationId));
    
    try {
      const result = await integrationService.syncIntegration(user.id, integrationId, operation);
      
      // Show success message with sync results
      let successMessage = (t as any)('integrations_sync_success') || 'Sync completed successfully';
      
      // Customize message based on operation and result
      if ((operation === 'sync_products' || operation === 'import_products') && result.productsImported !== undefined) {
        successMessage = (t as any)('integrations_products_imported')?.replace('{count}', result.productsImported) 
          || `${result.productsImported} ürün senkronize edildi`;
      } else if (operation === 'publish_mockup' && result.imagesAdded !== undefined) {
        successMessage = (t as any)('integrations_mockups_published')?.replace('{count}', result.imagesAdded)
          || `${result.imagesAdded} mockups published`;
      } else if (operation === 'upload_mockups' && result.filesUploaded !== undefined) {
        successMessage = (t as any)('integrations_files_uploaded')?.replace('{count}', result.filesUploaded)
          || `${result.filesUploaded} files uploaded`;
      }
      
      toast.success(successMessage);
    } catch (err: any) {
      console.error('Failed to sync integration:', err);
      toast.error(err.userMessage || 'Failed to sync integration');
    } finally {
      // Remove from syncing set
      setSyncingIntegrations(prev => {
        const newSet = new Set(prev);
        newSet.delete(integrationId);
        return newSet;
      });
    }
  };

  const handleFolderSelect = (folderId: string | null, folderName: string) => {
    // Save selected folder to localStorage
    const folderData = {
      folderId,
      folderName,
      integrationId: folderPickerState.integrationId,
    };
    localStorage.setItem('googleDriveFolder', JSON.stringify(folderData));
    
    // Close modal
    setFolderPickerState({
      isOpen: false,
      folders: [],
      isLoading: false,
      integrationId: null,
    });
    
    // Show success message
    toast.success((t as any)('integration_folder_selected')?.replace('{folder}', folderName) || `Folder selected: ${folderName}`);
  };

  const handleFolderPickerClose = () => {
    setFolderPickerState({
      isOpen: false,
      folders: [],
      isLoading: false,
      integrationId: null,
    });
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {(t as any)('integrations_page_title') || 'Integrations'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {(t as any)('integrations_page_subtitle') || 'Connect MockupSuite with your favorite tools and platforms'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={(t as any)('integrations_search_placeholder') || 'Search integrations...'}
              className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <svg 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-primary text-gray-900 dark:text-[#111718]'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Spinner progressText={(t as any)('integrations_loading') || 'Loading integrations...'} />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Active Integrations Grid */}
        {!isLoading && !error && (
          <>
            {filteredIntegrations.length === 0 && comingSoonIntegrations.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {(t as any)('integrations_no_results')?.replace('{query}', searchQuery) || 'No integrations found'}
                </p>
              </div>
            )}

            {filteredIntegrations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {filteredIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onSync={handleSync}
                    isSyncing={syncingIntegrations.has(integration.id)}
                  />
                ))}
              </div>
            )}

            {/* Coming Soon Section */}
            {comingSoonIntegrations.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {(t as any)('integrations_coming_soon_title') || 'Coming Soon'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {comingSoonIntegrations.map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onSync={handleSync}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Connection Modal */}
      <ConnectionModal
        integration={modalState.integration}
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      {/* Toast Notifications */}
      <ToastContainer messages={toast.messages} onClose={toast.closeToast} />

      {/* Folder Picker Modal */}
      <FolderPickerModal
        isOpen={folderPickerState.isOpen}
        folders={folderPickerState.folders}
        isLoading={folderPickerState.isLoading}
        onClose={handleFolderPickerClose}
        onSelectFolder={handleFolderSelect}
      />

      {/* Shopify Connect Modal */}
      <ShopifyConnectModal
        isOpen={shopifyModalState.isOpen}
        onClose={() => setShopifyModalState({ isOpen: false, integrationId: null })}
        onConnect={async (shopDomain) => {
          if (!user || !shopifyModalState.integrationId) return;
          
          try {
            const { authUrl } = await integrationService.connectIntegration(
              user.id,
              shopifyModalState.integrationId,
              { shopDomain }
            );
            
            // Open OAuth in popup
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            
            window.open(
              authUrl,
              'oauth_popup',
              `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
            );
            
            setShopifyModalState({ isOpen: false, integrationId: null });
          } catch (err: any) {
            toast.error(err.userMessage || err.message || 'Failed to connect to Shopify');
            throw err;
          }
        }}
      />
    </div>
  );
};

export default IntegrationsPage;
