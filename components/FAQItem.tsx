import React from 'react';
import { FAQItem as FAQItemType } from '../types';
import { highlightSearchTerms } from '../utils/faqUtils';

interface FAQItemProps {
  faq: FAQItemType;
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery: string;
}

const FAQItemComponent: React.FC<FAQItemProps> = ({
  faq,
  isExpanded,
  onToggle,
  searchQuery,
}) => {
  const answerId = `faq-answer-${faq.id}`;
  const questionId = `faq-question-${faq.id}`;

  // Handle keyboard interaction
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  // Render text with highlighted search terms
  const renderHighlightedText = (text: string) => {
    const segments = highlightSearchTerms(text, searchQuery);
    
    return segments.map((segment, index) => {
      if (segment.highlighted) {
        return (
          <mark
            key={index}
            className="bg-primary/20 text-gray-900 dark:text-white rounded px-0.5"
          >
            {segment.text}
          </mark>
        );
      }
      return <React.Fragment key={index}>{segment.text}</React.Fragment>;
    });
  };

  return (
    <div
      id={`faq-${faq.id}`}
      className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
    >
      {/* Question Header */}
      <h3>
        <button
          id={questionId}
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          className="
            w-full flex items-center justify-between gap-4 py-4 px-2
            text-left transition-all duration-200 ease-in-out
            hover:bg-gray-50 dark:hover:bg-gray-800/50
            hover:pl-3
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset
            focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset
            rounded-lg
          "
          aria-expanded={isExpanded}
          aria-controls={answerId}
          type="button"
          tabIndex={0}
        >
          <span className="flex-1 text-base font-medium text-gray-900 dark:text-white">
            {renderHighlightedText(faq.question)}
          </span>
          
          {/* Animated Chevron Icon */}
          <svg
            className={`
              w-5 h-5 flex-shrink-0 text-gray-500 dark:text-gray-400
              transition-transform duration-300 ease-in-out
              ${isExpanded ? 'rotate-180' : 'rotate-0'}
            `}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </h3>

      {/* Answer Content */}
      <div
        id={answerId}
        role="region"
        aria-labelledby={questionId}
        aria-hidden={!isExpanded}
        className={`
          overflow-hidden
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
        style={{
          transitionTimingFunction: isExpanded 
            ? 'cubic-bezier(0.4, 0, 0.2, 1)' 
            : 'cubic-bezier(0.4, 0, 1, 1)'
        }}
      >
        <div className={`
          px-2 pb-4 pt-1
          transition-transform duration-300 ease-out
          ${isExpanded ? 'translate-y-0' : '-translate-y-2'}
        `}>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {renderHighlightedText(faq.answer)}
          </p>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
// Only re-render when faq, isExpanded, or searchQuery changes
export const FAQItem = React.memo(FAQItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.faq.id === nextProps.faq.id &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.searchQuery === nextProps.searchQuery
  );
});
