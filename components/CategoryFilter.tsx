import React from 'react';
import { FAQCategory } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface CategoryFilterProps {
  categories: FAQCategory[];
  selectedCategory: FAQCategory | 'all';
  onCategorySelect: (category: FAQCategory | 'all') => void;
  faqCounts: Record<FAQCategory, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  faqCounts,
}) => {
  const { t } = useTranslations();

  // Get translation key for category
  const getCategoryLabel = (category: FAQCategory | 'all'): string => {
    const key = `faq_category_${category.replaceAll('-', '_')}` as keyof typeof t;
    return t[key] || category;
  };

  // Handle category click
  const handleCategoryClick = (category: FAQCategory | 'all') => {
    onCategorySelect(category);
  };

  // Handle keyboard navigation
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    category: FAQCategory | 'all'
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCategoryClick(category);
    }
  };

  // Calculate total count for "All" category
  const totalCount = Object.values(faqCounts).reduce((sum, count) => sum + count, 0);

  // All categories including "all"
  const allCategories: Array<FAQCategory | 'all'> = ['all', ...categories];

  return (
    <div
      className="flex flex-wrap gap-2 mb-6"
      role="group"
      aria-label="Filter FAQs by category"
    >
      {allCategories.map((category) => {
        const isActive = selectedCategory === category;
        const count = category === 'all' ? totalCount : faqCounts[category as FAQCategory];
        const label = getCategoryLabel(category);

        return (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            onKeyDown={(e) => handleKeyDown(e, category)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200 ease-in-out
              hover:scale-105 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
              dark:focus:ring-offset-gray-900 dark:focus-visible:ring-offset-gray-900
              ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }
            `}
            aria-pressed={isActive}
            aria-current={isActive ? 'true' : 'false'}
            aria-label={`Filter by ${label}, ${count} ${count === 1 ? 'question' : 'questions'}`}
            type="button"
            tabIndex={0}
          >
            <span className="flex items-center gap-2">
              <span>{label}</span>
              <span
                className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }
                `}
                aria-label={`${count} items`}
              >
                {count}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
