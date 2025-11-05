import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface ShopifyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (shopDomain: string) => Promise<void>;
}

const ShopifyConnectModal: React.FC<ShopifyConnectModalProps> = ({
  isOpen,
  onClose,
  onConnect,
}) => {
  const { t } = useTranslations();
  const [shopDomain, setShopDomain] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopDomain.trim()) {
      setError('Shop domain is required');
      return;
    }

    // Validate shop domain format
    let domain = shopDomain.trim().toLowerCase();
    
    // Remove https:// or http://
    domain = domain.replace(/^https?:\/\//, '');
    
    // Remove trailing slash
    domain = domain.replace(/\/$/, '');
    
    // If user entered full URL, extract domain
    if (domain.includes('/')) {
      domain = domain.split('/')[0];
    }
    
    // Add .myshopify.com if not present
    if (!domain.includes('.')) {
      domain = `${domain}.myshopify.com`;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await onConnect(domain);
      setShopDomain('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Shopify');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    if (!isConnecting) {
      setShopDomain('');
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src="https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-primary-logo-456baa801ee66a0a435671082365958316831c9960c480451dd0330bcdae304f.svg"
              alt="Shopify"
              className="w-8 h-8"
            />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Connect Shopify Store
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isConnecting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Enter your Shopify store domain to connect. You'll be redirected to Shopify to authorize the connection.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="shop-domain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Shop Domain
            </label>
            <div className="relative">
              <input
                id="shop-domain"
                type="text"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder="mystore.myshopify.com"
                disabled={isConnecting}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Example: mystore.myshopify.com or just mystore
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isConnecting}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isConnecting || !shopDomain.trim()}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-primary text-gray-900 dark:text-[#111718] hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isConnecting && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopifyConnectModal;
