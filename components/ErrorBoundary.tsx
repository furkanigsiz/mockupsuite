import { Component, ReactNode, ErrorInfo } from 'react';
import { SupabaseError, getUserFriendlyMessage } from '../utils/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  language?: 'en' | 'tr';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle React errors
 * Note: Error boundaries must be class components in React
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const language = this.props.language || 'en';
      const error = this.state.error;
      
      // Get user-friendly message if it's a SupabaseError
      let errorMessage = 'An unexpected error occurred. Please try refreshing the page.';
      if (language === 'tr') {
        errorMessage = 'Beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin.';
      }
      
      if (error instanceof SupabaseError) {
        errorMessage = getUserFriendlyMessage(error, language);
      }

      const texts = {
        en: {
          title: 'Something went wrong',
          tryAgain: 'Try again',
          reloadPage: 'Reload page',
          errorDetails: 'Error details',
        },
        tr: {
          title: 'Bir şeyler yanlış gitti',
          tryAgain: 'Tekrar dene',
          reloadPage: 'Sayfayı yenile',
          errorDetails: 'Hata detayları',
        },
      };

      const t = texts[language];

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              {t.title}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {errorMessage}
            </p>

            {error && (
              <details className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                <summary className="cursor-pointer text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {t.errorDetails}
                </summary>
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto whitespace-pre-wrap break-words">
                  {error.message}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                aria-label={t.tryAgain}
              >
                {t.tryAgain}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                aria-label={t.reloadPage}
              >
                {t.reloadPage}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
