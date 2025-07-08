import { handleError, AutomergeError } from './errorHandling'

export interface ErrorReport {
  error: AutomergeError
  timestamp: Date
  userAgent: string
  url: string
  userId?: string
}

export interface GlobalErrorHandlerOptions {
  enableConsoleLogging?: boolean
  enableErrorReporting?: boolean
  onError?: (report: ErrorReport) => void
  debounceMs?: number
}

class GlobalErrorHandler {
  private options: Required<GlobalErrorHandlerOptions>
  private errorQueue: Set<string> = new Set()
  private debounceTimer: number | null = null

  constructor(options: GlobalErrorHandlerOptions = {}) {
    this.options = {
      enableConsoleLogging: true,
      enableErrorReporting: false,
      onError: () => {},
      debounceMs: 1000,
      ...options,
    }

    this.initialize()
  }

  private initialize() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', this.handleGlobalError)

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handlePromiseRejection)

    // Handle resource loading errors
    window.addEventListener('error', this.handleResourceError, true)
  }

  private handleGlobalError = (event: ErrorEvent) => {
    const error = handleError(event.error || event.message, 'Global Error')
    this.reportError(error)
  }

  private handlePromiseRejection = (event: PromiseRejectionEvent) => {
    const error = handleError(event.reason, 'Unhandled Promise Rejection')
    this.reportError(error)

    // Prevent the error from being logged to console twice
    event.preventDefault()
  }

  private handleResourceError = (event: Event) => {
    const target = event.target as HTMLElement
    if (target && target !== (window as unknown)) {
      const error = handleError(
        `Resource loading failed: ${target.tagName} ${target.getAttribute('src') || target.getAttribute('href') || ''}`,
        'Resource Loading Error'
      )
      this.reportError(error)
    }
  }

  private reportError(error: AutomergeError) {
    const errorKey = `${error.message}-${error.stack?.slice(0, 100)}`

    // Debounce identical errors
    if (this.errorQueue.has(errorKey)) {
      return
    }

    this.errorQueue.add(errorKey)

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = window.setTimeout(() => {
      this.processError(error)
      this.errorQueue.delete(errorKey)
    }, this.options.debounceMs)
  }

  private processError(error: AutomergeError) {
    if (this.options.enableConsoleLogging) {
      // eslint-disable-next-line no-console
      console.error('Global error handler:', error)
    }

    if (this.options.enableErrorReporting) {
      const report: ErrorReport = {
        error,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }

      try {
        this.options.onError(report)
      } catch (reportingError) {
        // eslint-disable-next-line no-console
        console.error('Error reporting failed:', reportingError)
      }
    }
  }

  public destroy() {
    window.removeEventListener('error', this.handleGlobalError)
    window.removeEventListener(
      'unhandledrejection',
      this.handlePromiseRejection
    )
    window.removeEventListener('error', this.handleResourceError, true)

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.errorQueue.clear()
  }

  public clearErrorQueue() {
    this.errorQueue.clear()
  }
}

// Global instance
let globalErrorHandler: GlobalErrorHandler | null = null

export function initializeGlobalErrorHandler(
  options: GlobalErrorHandlerOptions = {}
) {
  if (globalErrorHandler) {
    globalErrorHandler.destroy()
  }

  globalErrorHandler = new GlobalErrorHandler(options)
  return globalErrorHandler
}

export function getGlobalErrorHandler() {
  return globalErrorHandler
}

export function destroyGlobalErrorHandler() {
  if (globalErrorHandler) {
    globalErrorHandler.destroy()
    globalErrorHandler = null
  }
}

// Auto-initialize with default options
if (typeof window !== 'undefined') {
  initializeGlobalErrorHandler({
    enableConsoleLogging: import.meta.env.DEV,
    enableErrorReporting: false,
  })
}
