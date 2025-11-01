import React from 'react';
import { User } from './AuthProvider';
import { useTranslations } from '../hooks/useTranslations';

interface ProfileSidebarProps {
  user: User;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onSignOut: () => void;
  isMobileOpen: boolean;
}

interface NavigationItem {
  id: string;
  labelKey: string;
  icon: string;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  user,
  activeSection,
  onSectionChange,
  onSignOut,
  isMobileOpen,
}) => {
  const { t } = useTranslations();
  
  const navigationItems: NavigationItem[] = [
    { id: 'profile', labelKey: 'profile_nav_profile', icon: 'person' },
    { id: 'settings', labelKey: 'profile_nav_settings', icon: 'settings' },
    { id: 'security', labelKey: 'profile_nav_security', icon: 'lock' },
    { id: 'subscription', labelKey: 'profile_nav_subscription', icon: 'credit_card' },
    { id: 'generations', labelKey: 'profile_nav_generations', icon: 'photo_library' },
  ];
  
  return (
    <aside
      className={`
        w-64 bg-slate-50 dark:bg-white/5 border-r border-slate-200 dark:border-white/10 flex flex-col
        fixed md:relative inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      role="navigation"
      aria-label="Profile navigation"
    >
      {/* User Profile Header Section */}
      <div className="p-4 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-primary text-2xl">
              person
            </span>
          </div>
          
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {user.email.split('@')[0]}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSectionChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset
                  ${
                    activeSection === item.id
                      ? 'bg-primary/20 text-primary'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                  }
                `}
                aria-current={activeSection === item.id ? 'page' : undefined}
                aria-label={`Navigate to ${t(item.labelKey as any)}`}
              >
                <span className="material-symbols-outlined text-xl" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{t(item.labelKey as any)}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-slate-200 dark:border-white/10">
        <button
          onClick={onSignOut}
          className="
            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
            text-red-600 dark:text-red-400
            hover:bg-red-50 dark:hover:bg-red-500/10
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset
          "
          aria-label="Sign out"
        >
          <span className="material-symbols-outlined text-xl">
            logout
          </span>
          <span>{t('profile_sign_out')}</span>
        </button>
      </div>
    </aside>
  );
};

export default ProfileSidebar;
