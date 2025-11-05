import { FAQItem, FAQCategory } from '../types';
import { Translations } from '../locales';

/**
 * Extracts FAQ data from translation files and structures it into FAQItem objects
 * @param translations - The translations object from useTranslations hook
 * @returns Array of structured FAQ items with generated IDs and keywords
 */
export function loadFAQsFromTranslations(translations: Translations): FAQItem[] {
  const faqs: FAQItem[] = [];

  // Define FAQ categories and their prefixes
  const categories: Array<{ category: FAQCategory; prefix: string; count: number }> = [
    { category: 'getting-started', prefix: 'faq_gs_', count: 5 },
    { category: 'billing', prefix: 'faq_billing_', count: 6 },
    { category: 'ai-features', prefix: 'faq_ai_', count: 6 },
    { category: 'troubleshooting', prefix: 'faq_trouble_', count: 6 },
    { category: 'privacy', prefix: 'faq_privacy_', count: 6 },
  ];

  // Extract FAQs for each category
  categories.forEach(({ category, prefix, count }) => {
    for (let i = 1; i <= count; i++) {
      const questionKey = `${prefix}${i}_question` as keyof Translations;
      const answerKey = `${prefix}${i}_answer` as keyof Translations;

      const question = translations[questionKey];
      const answer = translations[answerKey];

      if (question && answer) {
        const id = `${category}-${i}`;
        const keywords = extractKeywords(question, answer);

        faqs.push({
          id,
          category,
          question,
          answer,
          keywords,
        });
      }
    }
  });

  return faqs;
}

/**
 * Extracts keywords from question and answer text for enhanced search
 * @param question - The FAQ question text
 * @param answer - The FAQ answer text
 * @returns Array of lowercase keywords
 */
function extractKeywords(question: string, answer: string): string[] {
  // Combine question and answer
  const text = `${question} ${answer}`.toLowerCase();

  // Remove common words and punctuation
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'can', 'what', 'how',
    'why', 'when', 'where', 'who', 'which', 'this', 'that', 'these',
    'those', 'i', 'you', 'we', 'they', 'it', 'my', 'your', 'our', 'their',
  ]);

  // Extract words (alphanumeric sequences)
  const words: string[] = text.match(/\b[a-z0-9]+\b/g) || [];

  // Filter out common words and short words, keep unique keywords
  const keywords = [...new Set(
    words.filter(word => 
      word.length > 2 && 
      !commonWords.has(word)
    )
  )];

  return keywords;
}

/**
 * Searches FAQs based on a query string
 * @param faqs - Array of FAQ items to search
 * @param query - Search query string
 * @returns Filtered array of FAQ items matching the query
 */
export function searchFAQs(faqs: FAQItem[], query: string): FAQItem[] {
  if (!query.trim()) return faqs;

  const lowerQuery = query.toLowerCase();

  return faqs.filter(faq => {
    // Search in question
    if (faq.question.toLowerCase().includes(lowerQuery)) return true;

    // Search in answer
    if (faq.answer.toLowerCase().includes(lowerQuery)) return true;

    // Search in keywords
    if (faq.keywords.some(keyword => keyword.includes(lowerQuery))) return true;

    return false;
  });
}

/**
 * Filters FAQs by category
 * @param faqs - Array of FAQ items to filter
 * @param category - Category to filter by, or 'all' for no filtering
 * @returns Filtered array of FAQ items
 */
export function filterFAQsByCategory(
  faqs: FAQItem[],
  category: FAQCategory | 'all'
): FAQItem[] {
  if (category === 'all') return faqs;
  return faqs.filter(faq => faq.category === category);
}

/**
 * Gets count of FAQs per category
 * @param faqs - Array of FAQ items
 * @returns Record mapping each category to its FAQ count
 */
export function getFAQCounts(faqs: FAQItem[]): Record<FAQCategory, number> {
  const counts: Record<FAQCategory, number> = {
    'getting-started': 0,
    'billing': 0,
    'ai-features': 0,
    'troubleshooting': 0,
    'privacy': 0,
  };

  faqs.forEach(faq => {
    counts[faq.category]++;
  });

  return counts;
}

/**
 * Highlights search terms in text by wrapping matches in mark elements
 * @param text - The text to highlight
 * @param query - The search query to highlight
 * @returns Array of text segments and highlighted segments
 */
export function highlightSearchTerms(
  text: string,
  query: string
): Array<{ text: string; highlighted: boolean }> {
  if (!query.trim()) {
    return [{ text, highlighted: false }];
  }

  // Escape special regex characters in the query
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create case-insensitive regex with global flag
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  // Split text by matches
  const parts = text.split(regex);
  
  // Map parts to segments with highlighted flag
  return parts
    .filter(part => part.length > 0)
    .map(part => ({
      text: part,
      highlighted: regex.test(part) || part.toLowerCase() === query.toLowerCase(),
    }));
}
