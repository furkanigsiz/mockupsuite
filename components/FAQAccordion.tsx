import React from 'react';
import { FAQAccordionProps } from '../types';
import { FAQItem } from './FAQItem';
import { useTranslations } from '../hooks/useTranslations';

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  faqs,
  expandedItems,
  onToggle,
  searchQuery,
}) => {
  const { t } = useTranslations();

  // Show "no results" message when filtered list is empty
  if (faqs.length === 0) {
    return (
      <section
        role="region"
        aria-label="FAQ results"
        className="py-8 text-center"
      >
        <div className="max-w-md mx-auto">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('help_center_no_results', { query: searchQuery })}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('help_center_search_placeholder')}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      role="region"
      aria-label="Frequently Asked Questions"
      className="w-full"
    >
      <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
        {faqs.map((faq) => (
          <li key={faq.id}>
            <FAQItem
              faq={faq}
              isExpanded={expandedItems.has(faq.id)}
              onToggle={() => onToggle(faq.id)}
              searchQuery={searchQuery}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};
