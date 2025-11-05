import { useTranslations } from '../hooks/useTranslations';
import { ContactSupportCTAProps } from '../types';

export function ContactSupportCTA({ onContactClick }: ContactSupportCTAProps) {
  const { t } = useTranslations();

  const handleContactClick = () => {
    if (onContactClick) {
      onContactClick();
    } else {
      // Default behavior: open email client
      window.location.href = 'mailto:support@mockupsuite.com?subject=Support Request';
    }
  };

  return (
    <section 
      className="mt-12 p-8 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30"
      role="region"
      aria-label="Contact Support"
    >
      <div className="max-w-2xl mx-auto text-center">
        {/* Heading */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {t('help_center_contact_title')}
        </h2>
        
        {/* Description */}
        <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mb-6">
          {t('help_center_contact_description')}
        </p>
        
        {/* Contact Button */}
        <button
          onClick={handleContactClick}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background-dark font-bold text-base rounded-lg hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus:ring-offset-background-dark dark:focus-visible:ring-offset-background-dark"
          aria-label="Contact support team via email"
          type="button"
          tabIndex={0}
        >
          <span className="material-symbols-outlined text-xl" aria-hidden="true">
            mail
          </span>
          {t('help_center_contact_button')}
        </button>
        
        {/* Additional Contact Info */}
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          support@mockupsuite.com
        </p>
      </div>
    </section>
  );
}
