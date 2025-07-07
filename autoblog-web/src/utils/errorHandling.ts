/**
 * Utility functions for error handling and recovery
 */

export class AutomergeError extends Error {
  constructor(
    message: string,
    public readonly type: 'network' | 'storage' | 'document' | 'unknown',
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'AutomergeError'
  }
}

export function createError(
  message: string,
  type: 'network' | 'storage' | 'document' | 'unknown' = 'unknown',
  cause?: Error
): AutomergeError {
  return new AutomergeError(message, type, cause)
}

export function isNetworkError(error: Error): boolean {
  return error instanceof AutomergeError && error.type === 'network'
}

export function isStorageError(error: Error): boolean {
  return error instanceof AutomergeError && error.type === 'storage'
}

export function isDocumentError(error: Error): boolean {
  return error instanceof AutomergeError && error.type === 'document'
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export function sanitizeErrorMessage(message: string): string {
  // Remove sensitive information from error messages
  return message
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]')
    .replace(/\b(?:https?:\/\/)?[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[url]')
    .replace(
      /\b[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}\b/g,
      '[uuid]'
    )
}

export function handleError(error: unknown, context: string): AutomergeError {
  const message = getErrorMessage(error)
  const sanitizedMessage = sanitizeErrorMessage(message)

  // eslint-disable-next-line no-console
  console.error(`Error in ${context}:`, error)

  // Determine error type based on message content
  let type: 'network' | 'storage' | 'document' | 'unknown' = 'unknown'

  if (
    message.includes('network') ||
    message.includes('websocket') ||
    message.includes('connection')
  ) {
    type = 'network'
  } else if (message.includes('storage') || message.includes('indexeddb')) {
    type = 'storage'
  } else if (message.includes('document') || message.includes('not found')) {
    type = 'document'
  }

  return createError(
    `${context}: ${sanitizedMessage}`,
    type,
    error instanceof Error ? error : undefined
  )
}

export interface RetryOptions {
  maxAttempts: number
  delay: number
  backoffFactor: number
  shouldRetry?: (error: Error) => boolean
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delay: 1000,
  backoffFactor: 2,
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const { maxAttempts, delay, backoffFactor, shouldRetry } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  }

  let lastError: Error
  let currentDelay = delay

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxAttempts) {
        throw lastError
      }

      if (shouldRetry && !shouldRetry(lastError)) {
        throw lastError
      }

      await new Promise(resolve => setTimeout(resolve, currentDelay))
      currentDelay *= backoffFactor
    }
  }

  throw lastError!
}

export function shouldRetryNetworkError(error: Error): boolean {
  return (
    isNetworkError(error) ||
    error.message.includes('timeout') ||
    error.message.includes('connection')
  )
}

export function shouldRetryStorageError(error: Error): boolean {
  return isStorageError(error) && !error.message.includes('quota exceeded')
}
