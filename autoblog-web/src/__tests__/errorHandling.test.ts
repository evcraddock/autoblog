import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  AutomergeError,
  createError,
  isNetworkError,
  isStorageError,
  isDocumentError,
  getErrorMessage,
  sanitizeErrorMessage,
  handleError,
  withRetry,
  shouldRetryNetworkError,
  shouldRetryStorageError,
} from '../utils/errorHandling'

describe('Error Handling Utilities', () => {
  describe('AutomergeError', () => {
    it('should create error with correct properties', () => {
      const cause = new Error('Original error')
      const error = new AutomergeError('Test error', 'network', cause)

      expect(error.name).toBe('AutomergeError')
      expect(error.message).toBe('Test error')
      expect(error.type).toBe('network')
      expect(error.cause).toBe(cause)
    })
  })

  describe('createError', () => {
    it('should create AutomergeError with default type', () => {
      const error = createError('Test message')

      expect(error).toBeInstanceOf(AutomergeError)
      expect(error.type).toBe('unknown')
      expect(error.message).toBe('Test message')
    })

    it('should create AutomergeError with specified type', () => {
      const error = createError('Network error', 'network')

      expect(error.type).toBe('network')
    })
  })

  describe('Error type checkers', () => {
    it('should identify network errors', () => {
      const networkError = createError('Network failure', 'network')
      const storageError = createError('Storage failure', 'storage')

      expect(isNetworkError(networkError)).toBe(true)
      expect(isNetworkError(storageError)).toBe(false)
    })

    it('should identify storage errors', () => {
      const storageError = createError('Storage failure', 'storage')
      const networkError = createError('Network failure', 'network')

      expect(isStorageError(storageError)).toBe(true)
      expect(isStorageError(networkError)).toBe(false)
    })

    it('should identify document errors', () => {
      const documentError = createError('Document not found', 'document')
      const networkError = createError('Network failure', 'network')

      expect(isDocumentError(documentError)).toBe(true)
      expect(isDocumentError(networkError)).toBe(false)
    })
  })

  describe('getErrorMessage', () => {
    it('should extract message from Error objects', () => {
      const error = new Error('Test error')
      expect(getErrorMessage(error)).toBe('Test error')
    })

    it('should convert non-Error objects to string', () => {
      expect(getErrorMessage('string error')).toBe('string error')
      expect(getErrorMessage(123)).toBe('123')
      expect(getErrorMessage(null)).toBe('null')
    })
  })

  describe('sanitizeErrorMessage', () => {
    it('should remove email addresses', () => {
      const message = 'Error for user@example.com'
      expect(sanitizeErrorMessage(message)).toBe('Error for [email]')
    })

    it('should remove URLs', () => {
      const message = 'Failed to fetch https://example.com/api'
      expect(sanitizeErrorMessage(message)).toBe('Failed to fetch [url]')
    })

    it('should remove UUIDs', () => {
      const message = 'Document 123e4567-e89b-12d3-a456-426614174000 not found'
      expect(sanitizeErrorMessage(message)).toBe('Document [uuid] not found')
    })
  })

  describe('handleError', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('should create AutomergeError with context', () => {
      const originalError = new Error('Original error')
      const handledError = handleError(originalError, 'Test context')

      expect(handledError).toBeInstanceOf(AutomergeError)
      expect(handledError.message).toContain('Test context')
      expect(handledError.cause).toBe(originalError)
    })

    it('should detect network error type', () => {
      const networkError = new Error('Network connection failed')
      const handledError = handleError(networkError, 'Test')

      expect(handledError.type).toBe('network')
    })

    it('should detect storage error type', () => {
      const storageError = new Error('IndexedDB access failed')
      const handledError = handleError(storageError, 'Test')

      expect(handledError.type).toBe('storage')
    })

    it('should detect document error type', () => {
      const documentError = new Error('Document not found')
      const handledError = handleError(documentError, 'Test')

      expect(handledError.type).toBe('document')
    })
  })

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')

      const result = await withRetry(mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success')

      const result = await withRetry(mockFn, { maxAttempts: 3, delay: 10 })

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('should fail after max attempts', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Persistent failure'))

      await expect(
        withRetry(mockFn, { maxAttempts: 2, delay: 10 })
      ).rejects.toThrow('Persistent failure')

      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should respect shouldRetry condition', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Non-retryable'))
      const shouldRetry = vi.fn().mockReturnValue(false)

      await expect(
        withRetry(mockFn, { shouldRetry, maxAttempts: 3 })
      ).rejects.toThrow('Non-retryable')

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(shouldRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('Retry conditions', () => {
    it('should retry network errors', () => {
      const networkError = createError('Connection failed', 'network')
      expect(shouldRetryNetworkError(networkError)).toBe(true)
    })

    it('should retry timeout errors', () => {
      const timeoutError = new Error('Request timeout')
      expect(shouldRetryNetworkError(timeoutError)).toBe(true)
    })

    it('should not retry non-network errors', () => {
      const validationError = new Error('Invalid input')
      expect(shouldRetryNetworkError(validationError)).toBe(false)
    })

    it('should retry storage errors', () => {
      const storageError = createError('Storage access failed', 'storage')
      expect(shouldRetryStorageError(storageError)).toBe(true)
    })

    it('should not retry quota exceeded errors', () => {
      const quotaError = createError('Quota exceeded', 'storage')
      expect(shouldRetryStorageError(quotaError)).toBe(false)
    })
  })
})
