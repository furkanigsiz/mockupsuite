import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { useAuth } from './AuthProvider';

interface PasswordResetFormProps {
  onSwitchToSignIn: () => void;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ onSwitchToSignIn }) => {
  const { t } = useTranslations();
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!email) {
      setError(t('auth_error_occurred'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('auth_invalid_email'));
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message || t('auth_error_occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="bg-white dark:bg-[#1c2527] rounded-xl border border-gray-200 dark:border-[#3b4f54] p-8">
        <h2 className="text-gray-900 dark:text-white text-2xl font-bold mb-2 text-center">
          {t('auth_reset_password')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 rounded-lg">
            <p className="text-green-700 dark:text-green-400 text-sm">{t('auth_reset_sent')}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth_email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth_email_placeholder')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#3b4f54] rounded-lg bg-white dark:bg-[#111718] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-primary text-gray-900 dark:text-[#111718] font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('auth_sending_reset') : t('auth_send_reset_link')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-sm text-primary hover:underline"
            disabled={isLoading}
          >
            {t('auth_back_to_sign_in')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetForm;
