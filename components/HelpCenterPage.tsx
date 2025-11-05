import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { HelpCenterPageProps, FAQItem, FAQCategory } from '../types';
import {
  loadFAQsFromTranslations,
  searchFAQs,
  filterFAQsByCategory,
  getFAQCounts,
} from '../utils/faqUtils';
import SearchBar from './SearchBar';
import { CategoryFilter } from './CategoryFilter';
import { FAQAccordion } from './FAQAccordion';
import { ContactSupportCTA } from './ContactSupportCTA';

export const HelpCenterPage: React.FC<HelpCenterPageProps> = ({
  initialCategory,
  initialQuestionId,
  onContactSupport,
}) => {
  const { t, translations } = useTranslations();

  // Get all available categories (defined early for use in effects)
  const categories: FAQCategory[] = [
    'getting-started',
    'billing',
    'ai-features',
    'troubleshooting',
    'privacy',
  ];

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | 'all'>(
    initialCategory || 'all'
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Load FAQ data from translations with error handling
  const { faqs: allFAQs, error: loadError } = useMemo(() => {
    try {
      const faqs = loadFAQsFromTranslations(translations);
      
      // Check if FAQs were loaded successfully
      if (!faqs || faqs.length === 0) {
        return {
          faqs: [],
          error: 'No FAQ content available. Please check translations.',
        };
      }
      
      return { faqs, error: null };
    } catch (error) {
      console.error('Failed to load FAQs:', error);
      return {
        faqs: [],
        error: error instanceof Error ? error.message : 'Failed to load FAQ content',
      };
    }
  }, [translations]);

  // Deep linking: Parse URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    const questionParam = urlParams.get('question');

    // Set category from URL if valid
    if (categoryParam && (categoryParam === 'all' || categories.includes(categoryParam as FAQCategory))) {
      setSelectedCategory(categoryParam as FAQCategory | 'all');
    }

    // Expand and scroll to specific question if provided
    if (questionParam) {
      setExpandedItems(new Set([questionParam]));
      
      // Scroll to question after render
      setTimeout(() => {
        const element = document.getElementById(`faq-${questionParam}`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 100);
    }
  }, []);

  // Update URL when category changes (optional)
  useEffect(() => {
    if (selectedCategory !== 'all') {
      const url = new URL(window.location.href);
      url.searchParams.set('category', selectedCategory);
      window.history.replaceState({}, '', url.toString());
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('category');
      window.history.replaceState({}, '', url.toString());
    }
  }, [selectedCategory]);

  // Calculate FAQ counts per category
  const faqCounts = useMemo(() => getFAQCounts(allFAQs), [allFAQs]);

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    let faqs = allFAQs;

    // Apply category filter
    faqs = filterFAQsByCategory(faqs, selectedCategory);

    // Apply search filter
    faqs = searchFAQs(faqs, searchQuery);

    return faqs;
  }, [allFAQs, selectedCategory, searchQuery]);

  // Handle search query change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Handle category selection
  const handleCategorySelect = (category: FAQCategory | 'all') => {
    setSelectedCategory(category);
  };

  // Handle accordion toggle
  const handleToggle = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Error state UI
  if (loadError) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-red-500 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Failed to Load Help Center
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {loadError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty FAQ list fallback
  if (allFAQs.length === 0) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No FAQ Content Available
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              FAQ content is currently unavailable. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Container with max-width and padding */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Header */}
        <header className="text-center mb-8 sm:mb-12" role="banner">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            {t('help_center_title')}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('help_center_subtitle')}
          </p>
        </header>

        {/* Search Bar */}
        <div className="mb-6 sm:mb-8" role="search" aria-label="Search FAQs">
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('help_center_search_placeholder')}
          />
        </div>

        {/* Category Filter */}
        <nav aria-label="FAQ categories" className="mb-6">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            faqCounts={faqCounts}
          />
        </nav>

        {/* FAQ Accordion */}
        <main role="main" className="mb-12">
          <FAQAccordion
            faqs={filteredFAQs}
            expandedItems={expandedItems}
            onToggle={handleToggle}
            searchQuery={searchQuery}
          />
        </main>

        {/* Contact Support CTA */}
        <aside role="complementary" aria-label="Contact support">
          <ContactSupportCTA onContactClick={onContactSupport} />
        </aside>
      </div>
    </div>
  );
};
