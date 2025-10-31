import React, { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import AuthPage from './AuthPage';
import Spinner from './Spinner';
import { useTranslations } from '../hooks/useTranslations';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component that guards routes requiring authentication
 * Redirects unauthenticated users to the login page
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { t } = useTranslations();

  // Show loading spinner while checking authentication state
  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
        <Spinner progressText={t('loading_project')} />
      </div>
    );
  }

  // Redirect to auth page if user is not authenticated
  if (!user) {
    return <AuthPage />;
  }

  // Render protected content if user is authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
