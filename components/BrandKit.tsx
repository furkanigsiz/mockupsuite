import React, { useRef, useState } from 'react';
import { BrandKit as BrandKitType } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useAuth } from './AuthProvider';
import { fileToBase64 } from '../utils/fileUtils';
import * as offlineDataService from '../services/offlineDataService';
import * as storageService from '../services/storageService';
import CopyIcon from './icons/CopyIcon';
import TrashIcon from './icons/TrashIcon';
import XIcon from './icons/XIcon';

interface BrandKitProps {
  brandKit: BrandKitType;
  setBrandKit: React.Dispatch<React.SetStateAction<BrandKitType>>;
}

const BrandKit: React.FC<BrandKitProps> = ({ brandKit, setBrandKit }) => {
  const { t } = useTranslations();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newColor, setNewColor] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to save brand kit to database (with offline support)
  const saveBrandKitToDatabase = async (updatedBrandKit: BrandKitType) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      await offlineDataService.saveBrandKit(user.id, updatedBrandKit);
    } catch (e) {
      console.error('Failed to save brand kit:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      try {
        // Upload logo to storage
        const logoPath = await storageService.uploadImage(user.id, file, 'logos');
        
        // Get signed URL for display
        const logoUrl = await storageService.getImageUrl(logoPath);
        
        // Update local state with signed URL
        const updatedBrandKit = { ...brandKit, logo: logoUrl };
        setBrandKit(updatedBrandKit);
        
        // Save to database with storage path (not signed URL)
        await saveBrandKitToDatabase({ ...brandKit, logo: logoPath });
      } catch (error) {
        console.error('Error uploading logo:', error);
        alert('Failed to upload logo. Please try again.');
      }
    }
  };
  
  const handleAddColor = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newColor.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/) && !brandKit.colors.includes(newColor)) {
          const updatedBrandKit = {...brandKit, colors: [...brandKit.colors, newColor]};
          setBrandKit(updatedBrandKit);
          setNewColor('');
          await saveBrandKitToDatabase(updatedBrandKit);
      }
  }
  
  const handleRemoveColor = async (colorToRemove: string) => {
      const updatedBrandKit = {...brandKit, colors: brandKit.colors.filter(c => c !== colorToRemove)};
      setBrandKit(updatedBrandKit);
      await saveBrandKitToDatabase(updatedBrandKit);
  }
  
  const handleCopyColor = (color: string) => {
      navigator.clipboard.writeText(color);
  }

  return (
    <div className="w-full bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-4">
      <h2 className="text-lg font-bold text-gray-100">{t('brand_kit_title')}</h2>
      
      {/* Logo Section */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{t('logo_label')}</label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gray-700 rounded-md flex items-center justify-center overflow-hidden">
            {brandKit.logo ? (
              <img src={brandKit.logo.startsWith('http') ? brandKit.logo : `data:image/png;base64,${brandKit.logo}`} alt="Brand Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs text-gray-500 text-center">No Logo</span>
            )}
          </div>
          <div className="flex-1">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/png" onChange={handleLogoUpload} />
            <button onClick={() => fileInputRef.current?.click()} className="w-full text-sm font-semibold py-2 px-4 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors" disabled={isSaving}>
              {isSaving ? 'Uploading...' : (brandKit.logo ? t('logo_replace_cta') : t('logo_upload_cta'))}
            </button>
             {brandKit.logo && (
              <button onClick={async () => {
                const updatedBrandKit = {...brandKit, logo: null};
                setBrandKit(updatedBrandKit);
                await saveBrandKitToDatabase(updatedBrandKit);
              }} className="w-full text-sm text-red-400 hover:text-red-300 mt-2">
                Remove Logo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Watermark Toggle */}
      <div className="flex items-center justify-between">
        <label htmlFor="useWatermark" className="text-sm font-medium text-gray-300">{t('use_watermark_label')}</label>
        <button onClick={async () => {
          const updatedBrandKit = {...brandKit, useWatermark: !brandKit.useWatermark};
          setBrandKit(updatedBrandKit);
          await saveBrandKitToDatabase(updatedBrandKit);
        }} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${brandKit.useWatermark ? 'bg-primary' : 'bg-gray-600'}`}>
          <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${brandKit.useWatermark ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      
      {/* Colors Section */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{t('colors_label')}</label>
        <form onSubmit={handleAddColor} className="flex gap-2 mb-2">
            <input 
                type="text" 
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder={t('add_color_placeholder') as string}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <button type="submit" className="text-sm font-semibold py-1 px-3 rounded-md bg-primary hover:bg-primary/80 transition-colors">{t('add_color_button')}</button>
        </form>
        <div className="flex flex-wrap gap-2">
            {brandKit.colors.map(color => (
                <div key={color} className="group relative flex items-center gap-2 bg-gray-700 p-1 rounded-md">
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: color }} />
                    <span className="text-sm font-mono">{color}</span>
                    <div className="absolute inset-0 bg-black/70 rounded-md flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleCopyColor(color)} title={t('copy_color_tooltip')} className="p-1 text-gray-200 hover:text-white"><CopyIcon className="h-4 w-4" /></button>
                         <button onClick={() => handleRemoveColor(color)} title="Remove" className="p-1 text-red-400 hover:text-red-300"><XIcon className="h-5 w-5" /></button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default BrandKit;
