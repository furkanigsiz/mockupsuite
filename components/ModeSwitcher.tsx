import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import type { AppMode } from '../types';
import SceneIcon from './icons/SceneIcon';
import TshirtIcon from './icons/TshirtIcon';
import VideoIcon from './icons/VideoIcon';

interface ModeSwitcherProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ currentMode, onModeChange }) => {
  const { t } = useTranslations();
  const modes: { id: AppMode; labelKey: 'mode_scene' | 'mode_product' | 'mode_video'; icon: React.ReactNode }[] = [
    { id: 'scene', labelKey: 'mode_scene', icon: <SceneIcon className="h-4 w-4" /> },
    { id: 'product', labelKey: 'mode_product', icon: <TshirtIcon className="h-4 w-4" /> },
    { id: 'video', labelKey: 'mode_video', icon: <VideoIcon className="h-4 w-4" /> },
  ];

  return (
    <div className="w-full bg-gray-800/50 p-1 rounded-lg border border-gray-700 flex">
      {modes.map(mode => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`w-1/3 py-2 px-3 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none flex items-center justify-center gap-2 ${
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
