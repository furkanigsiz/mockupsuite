import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import type { AppMode } from '../types';
import SceneIcon from './icons/SceneIcon';
import TshirtIcon from './icons/TshirtIcon';
import VideoIcon from './icons/VideoIcon';
import BackgroundRemoveIcon from './icons/BackgroundRemoveIcon';

interface ModeSwitcherProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ currentMode, onModeChange }) => {
  const { t } = useTranslations();
  const modes: { id: AppMode; labelKey: 'mode_scene' | 'mode_product' | 'mode_video' | 'mode_background_remover'; icon: React.ReactNode }[] = [
    { id: 'scene', labelKey: 'mode_scene', icon: <SceneIcon className="h-4 w-4" /> },
    { id: 'product', labelKey: 'mode_product', icon: <TshirtIcon className="h-4 w-4" /> },
    { id: 'video', labelKey: 'mode_video', icon: <VideoIcon className="h-4 w-4" /> },
    { id: 'background-remover', labelKey: 'mode_background_remover', icon: <BackgroundRemoveIcon className="h-4 w-4" /> },
  ];

  return (
    <div className="w-full bg-gray-800/50 p-1 rounded-lg border border-gray-700 grid grid-cols-2 gap-1">
      {modes.map(mode => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`py-2 px-3 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none flex items-center justify-center gap-2 ${
            currentMode === mode.id
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-400 hover:bg-gray-700'
          }`}
        >
          {mode.icon}
          {t(mode.labelKey)}
        </button>
      ))}
    </div>
  );
};

export default ModeSwitcher;
