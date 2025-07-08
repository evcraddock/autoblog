import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { AutomergeError } from '../utils/errorHandling'

export interface ErrorFallbackProps {
  error: AutomergeError
  onRetry?: () => void
  onGoBack?: () => void
  onGoHome?: () => void
  showDetails?: boolean
  context?: string
}

export function ErrorFallback({
  error,
  onRetry,
  onGoBack,
  onGoHome,
  showDetails = import.meta.env.DEV,
  context,
}: ErrorFallbackProps) {
  const getErrorTitle = () => {
    switch (error.type) {
      case 'network':
        return 'Connection Error'
      case 'storage':
        return 'Storage Error'
      case 'document':
        return 'Document Not Found'
      default:
        return 'Something went wrong'
    }
  }

  const getErrorMessage = () => {
    switch (error.type) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection and try again.'
      case 'storage':
        return 'There was a problem accessing local storage. Please try refreshing the page.'
      case 'document':
        return 'The requested document could not be found. It may have been moved or deleted.'
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.'
    }
  }

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return (
          <AlertCircle
            className="h-16 w-16 text-orange-500"
            aria-hidden="true"
          />
        )
      case 'storage':
        return (
          <AlertCircle
            className="h-16 w-16 text-yellow-500"
            aria-hidden="true"
          />
        )
      case 'document':
        return (
          <AlertCircle className="h-16 w-16 text-blue-500" aria-hidden="true" />
        )
      default:
        return (
          <AlertCircle className="h-16 w-16 text-red-500" aria-hidden="true" />
        )
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-64 bg-gray-50 px-4 py-8"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">{getErrorIcon()}</div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {getErrorTitle()}
        </h2>

        <p className="text-gray-600 mb-4">{getErrorMessage()}</p>

        {context && (
          <p className="text-sm text-gray-500 mb-4">Context: {context}</p>
        )}

        {showDetails && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Show technical details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
              <div className="mb-2">
                <strong>Error Type:</strong> {error.type}
              </div>
              <div className="mb-2">
                <strong>Message:</strong> {error.message}
              </div>
              {error.cause && (
                <div className="mb-2">
                  <strong>Cause:</strong> {error.cause.message}
                </div>
              )}
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap text-xs">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label="Retry the failed operation"
            >
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Try Again
            </button>
          )}

          {onGoBack && (
            <button
              onClick={onGoBack}
              className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              aria-label="Go back to previous page"
            >
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Go Back
            </button>
          )}

          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              aria-label="Go to homepage"
            >
              <Home className="h-4 w-4 mr-2" aria-hidden="true" />
              Home
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function NetworkErrorFallback(props: Omit<ErrorFallbackProps, 'error'>) {
  const networkError = new AutomergeError(
    'Network connection failed',
    'network'
  )

  return <ErrorFallback {...props} error={networkError} />
}

export function StorageErrorFallback(props: Omit<ErrorFallbackProps, 'error'>) {
  const storageError = new AutomergeError('Storage access failed', 'storage')

  return <ErrorFallback {...props} error={storageError} />
}

export function DocumentNotFoundFallback(
  props: Omit<ErrorFallbackProps, 'error'>
) {
  const documentError = new AutomergeError('Document not found', 'document')

  return <ErrorFallback {...props} error={documentError} />
}

export function GenericErrorFallback(props: Omit<ErrorFallbackProps, 'error'>) {
  const genericError = new AutomergeError(
    'An unexpected error occurred',
    'unknown'
  )

  return <ErrorFallback {...props} error={genericError} />
}

export default ErrorFallback
