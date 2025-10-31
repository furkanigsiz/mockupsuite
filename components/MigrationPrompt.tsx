import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { MigrationResult } from '../services/migrationService';
import Spinner from './Spinner';

interface MigrationPromptProps {
  onMigrate: () => Promise<MigrationResult | void>;
  onSkip: () => void;
  onClose: () => void;
}

export default function MigrationPrompt({ onMigrate, onSkip, onClose }: MigrationPromptProps) {
  const { t } = useTranslations();
  const [isOpen, setIsOpen] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const result = await onMigrate();
      if (result) {
        setMigrationResult(result);
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationResult({
        success: false,
        projectsMigrated: 0,
        mockupsMigrated: 0,
        brandKitMigrated: false,
        templatesMigrated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    onSkip();
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  // Show migration in progress
  if (isMigrating) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 max-w-md w-full mx-4">
          <Spinner progressText={t('migration_in_progress')} />
        </div>
      </div>
    );
  }

  // Show migration result
  if (migrationResult) {
    const hasErrors = migrationResult.errors.length > 0;
    const isSuccess = migrationResult.success;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4">
              {isSuccess ? (
                <svg
                  className="h-12 w-12 text-green-600"
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
              ) : (
                <svg
                  className="h-12 w-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>

            {/* Title */}
            <h3 className="text-lg font-medium text-neutral-dark dark:text-white mb-2">
              {isSuccess ? t('migration_success_title') : t('migration_error_title')}
            </h3>

            {/* Description */}
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              {isSuccess
                ? hasErrors
                  ? t('migration_partial_success')
                  : t('migration_success_description')
                : t('migration_error_description')}
            </p>

            {/* Stats */}
            <div className="bg-neutral-100 dark:bg-neutral-700 rounded-lg p-4 mb-4">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {t('migration_stats', {
                  projects: migrationResult.projectsMigrated.toString(),
                  mockups: migrationResult.mockupsMigrated.toString(),
                  templates: migrationResult.templatesMigrated.toString(),
                })}
              </p>
              {migrationResult.brandKitMigrated && (
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">
                  ✓ Brand Kit
                </p>
              )}
            </div>

            {/* Errors */}
            {hasErrors && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto">
                <p className="text-xs text-red-800 dark:text-red-300 font-medium mb-2">
                  Errors:
                </p>
                {migrationResult.errors.map((error, index) => (
                  <p key={index} className="text-xs text-red-700 dark:text-red-400 mb-1">
                    • {error}
                  </p>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {!isSuccess && (
                <button
                  onClick={handleMigrate}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  {t('migration_button_retry')}
                </button>
              )}
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-dark dark:text-white rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
              >
                {t('migration_button_close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show initial migration prompt
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <svg
              className="h-6 w-6 text-blue-600 dark:text-blue-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-lg font-medium text-neutral-dark dark:text-white mb-2">
            {t('migration_title')}
          </h3>

          {/* Description */}
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            {t('migration_description')}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleMigrate}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              {t('migration_button_migrate')}
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-dark dark:text-white rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
            >
              {t('migration_button_skip')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
