/**
 * Tests for error handling utility functions
 */

import { vi } from 'vitest'
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
  RetryOptions,
} from '../errorHandling'

describe('AutomergeError', () => {
  test('should create an AutomergeError with correct properties', () => {
    const message = 'Test error message'
    const type = 'network'
    const cause = new Error('Original error')

    const error = new AutomergeError(message, type, cause)

    expect(error.message).toBe(message)
    expect(error.type).toBe(type)
    expect(error.cause).toBe(cause)
    expect(error.name).toBe('AutomergeError')
    expect(error instanceof Error).toBe(true)
  })

  test('should create an AutomergeError without cause', () => {
    const message = 'Test error message'
    const type = 'storage'

    const error = new AutomergeError(message, type)

    expect(error.message).toBe(message)
    expect(error.type).toBe(type)
    expect(error.cause).toBeUndefined()
    expect(error.name).toBe('AutomergeError')
  })
})

describe('createError', () => {
  test('should create an AutomergeError with all parameters', () => {
    const message = 'Test error'
    const type = 'document'
    const cause = new Error('Original error')

    const error = createError(message, type, cause)

    expect(error).toBeInstanceOf(AutomergeError)
    expect(error.message).toBe(message)
    expect(error.type).toBe(type)
    expect(error.cause).toBe(cause)
  })

  test('should create an AutomergeError with default unknown type', () => {
    const message = 'Test error'

    const error = createError(message)

    expect(error).toBeInstanceOf(AutomergeError)
    expect(error.message).toBe(message)
    expect(error.type).toBe('unknown')
    expect(error.cause).toBeUndefined()
  })

  test('should create an AutomergeError with type but no cause', () => {
    const message = 'Test error'
    const type = 'network'

    const error = createError(message, type)

    expect(error).toBeInstanceOf(AutomergeError)
    expect(error.message).toBe(message)
    expect(error.type).toBe(type)
    expect(error.cause).toBeUndefined()
  })
})

describe('Error classification functions', () => {
  describe('isNetworkError', () => {
    test('should return true for network AutomergeError', () => {
      const error = createError('Network error', 'network')
      expect(isNetworkError(error)).toBe(true)
    })

    test('should return false for non-network AutomergeError', () => {
      const error = createError('Storage error', 'storage')
      expect(isNetworkError(error)).toBe(false)
    })

    test('should return false for regular Error', () => {
      const error = new Error('Regular error')
      expect(isNetworkError(error)).toBe(false)
    })

    test('should return false for unknown type AutomergeError', () => {
      const error = createError('Unknown error', 'unknown')
      expect(isNetworkError(error)).toBe(false)
    })
  })

  describe('isStorageError', () => {
    test('should return true for storage AutomergeError', () => {
      const error = createError('Storage error', 'storage')
      expect(isStorageError(error)).toBe(true)
    })

    test('should return false for non-storage AutomergeError', () => {
      const error = createError('Network error', 'network')
      expect(isStorageError(error)).toBe(false)
    })

    test('should return false for regular Error', () => {
      const error = new Error('Regular error')
      expect(isStorageError(error)).toBe(false)
    })

    test('should return false for unknown type AutomergeError', () => {
      const error = createError('Unknown error', 'unknown')
      expect(isStorageError(error)).toBe(false)
    })
  })

  describe('isDocumentError', () => {
    test('should return true for document AutomergeError', () => {
      const error = createError('Document error', 'document')
      expect(isDocumentError(error)).toBe(true)
    })

    test('should return false for non-document AutomergeError', () => {
      const error = createError('Network error', 'network')
      expect(isDocumentError(error)).toBe(false)
    })

    test('should return false for regular Error', () => {
      const error = new Error('Regular error')
      expect(isDocumentError(error)).toBe(false)
    })

    test('should return false for unknown type AutomergeError', () => {
      const error = createError('Unknown error', 'unknown')
      expect(isDocumentError(error)).toBe(false)
    })
  })
})

describe('getErrorMessage', () => {
  test('should return error message for Error instance', () => {
    const error = new Error('Test error message')
    expect(getErrorMessage(error)).toBe('Test error message')
  })

  test('should return error message for AutomergeError instance', () => {
    const error = createError('Test AutomergeError message', 'network')
    expect(getErrorMessage(error)).toBe('Test AutomergeError message')
  })

  test('should return string representation for string value', () => {
    expect(getErrorMessage('String error')).toBe('String error')
  })

  test('should return string representation for number value', () => {
    expect(getErrorMessage(42)).toBe('42')
  })

  test('should return string representation for boolean value', () => {
    expect(getErrorMessage(true)).toBe('true')
  })

  test('should return string representation for null', () => {
    expect(getErrorMessage(null)).toBe('null')
  })

  test('should return string representation for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('undefined')
  })

  test('should return string representation for object', () => {
    const obj = { key: 'value' }
    expect(getErrorMessage(obj)).toBe('[object Object]')
  })
})

describe('sanitizeErrorMessage', () => {
  test('should sanitize email addresses', () => {
    const message = 'Error with email test@example.com in message'
    expect(sanitizeErrorMessage(message)).toBe(
      'Error with email [email] in message'
    )
  })

  test('should sanitize multiple email addresses', () => {
    const message = 'Errors with emails test@example.com and user@domain.org'
    expect(sanitizeErrorMessage(message)).toBe(
      'Errors with emails [email] and [email]'
    )
  })

  test('should sanitize URLs with protocol', () => {
    const message = 'Error accessing https://example.com/path'
    expect(sanitizeErrorMessage(message)).toBe('Error accessing [url]/path')
  })

  test('should sanitize URLs without protocol', () => {
    const message = 'Error accessing example.com/path'
    expect(sanitizeErrorMessage(message)).toBe('Error accessing [url]/path')
  })

  test('should sanitize multiple URLs', () => {
    const message = 'Errors with https://example.com and test.org'
    expect(sanitizeErrorMessage(message)).toBe('Errors with [url] and [url]')
  })

  test('should sanitize UUIDs', () => {
    const message = 'Error with UUID 123e4567-e89b-12d3-a456-426614174000'
    expect(sanitizeErrorMessage(message)).toBe('Error with UUID [uuid]')
  })

  test('should sanitize multiple UUIDs', () => {
    const message =
      'UUIDs 123e4567-e89b-12d3-a456-426614174000 and 987fcdeb-51a2-43d7-8765-123456789abc'
    expect(sanitizeErrorMessage(message)).toBe('UUIDs [uuid] and [uuid]')
  })

  test('should sanitize all sensitive information types together', () => {
    const message =
      'Error: user@example.com accessed https://api.example.com/resource/123e4567-e89b-12d3-a456-426614174000'
    expect(sanitizeErrorMessage(message)).toBe(
      'Error: [email] accessed [url]/resource/[uuid]'
    )
  })

  test('should handle empty string', () => {
    expect(sanitizeErrorMessage('')).toBe('')
  })

  test('should handle message without sensitive information', () => {
    const message = 'Simple error message'
    expect(sanitizeErrorMessage(message)).toBe('Simple error message')
  })

  test('should handle case-insensitive UUID matching', () => {
    const message = 'Error with UUID 123E4567-E89B-12D3-A456-426614174000'
    expect(sanitizeErrorMessage(message)).toBe('Error with UUID [uuid]')
  })
})

describe('handleError', () => {
  let consoleSpy: any

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  test('should handle Error instance and log to console', () => {
    const originalError = new Error('Original error message')
    const context = 'test context'

    const result = handleError(originalError, context)

    expect(result).toBeInstanceOf(AutomergeError)
    expect(result.message).toBe('test context: Original error message')
    expect(result.type).toBe('unknown')
    expect(result.cause).toBe(originalError)
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error in test context:',
      originalError
    )
  })

  test('should classify network errors based on message content', () => {
    const networkError = new Error('Network connection failed')
    const result = handleError(networkError, 'network test')

    expect(result.type).toBe('network')
    expect(result.message).toBe('network test: Network connection failed')
  })

  test('should classify websocket errors as network errors', () => {
    const websocketError = new Error('WebSocket connection closed')
    const result = handleError(websocketError, 'websocket test')

    expect(result.type).toBe('network')
  })

  test('should classify connection errors as network errors', () => {
    const connectionError = new Error('connection timeout')
    const result = handleError(connectionError, 'connection test')

    expect(result.type).toBe('network')
  })

  test('should classify storage errors based on message content', () => {
    const storageError = new Error('storage quota exceeded')
    const result = handleError(storageError, 'storage test')

    expect(result.type).toBe('storage')
    expect(result.message).toBe('storage test: storage quota exceeded')
  })

  test('should classify IndexedDB errors as storage errors', () => {
    const indexedDBError = new Error('indexeddb transaction failed')
    const result = handleError(indexedDBError, 'indexeddb test')

    expect(result.type).toBe('storage')
  })

  test('should classify document errors based on message content', () => {
    const documentError = new Error('Document not found')
    const result = handleError(documentError, 'document test')

    expect(result.type).toBe('document')
    expect(result.message).toBe('document test: Document not found')
  })

  test('should classify "not found" errors as document errors', () => {
    const notFoundError = new Error('Resource not found')
    const result = handleError(notFoundError, 'resource test')

    expect(result.type).toBe('document')
  })

  test('should handle non-Error values', () => {
    const stringError = 'String error message'
    const result = handleError(stringError, 'string test')

    expect(result).toBeInstanceOf(AutomergeError)
    expect(result.message).toBe('string test: String error message')
    expect(result.type).toBe('unknown')
    expect(result.cause).toBeUndefined()
  })

  test('should sanitize error messages with sensitive information', () => {
    const sensitiveError = new Error(
      'Error with user@example.com and https://api.example.com'
    )
    const result = handleError(sensitiveError, 'sensitive test')

    expect(result.message).toBe('sensitive test: Error with [email] and [url]')
  })

  test('should handle multiple keyword matches (first match wins)', () => {
    const mixedError = new Error('network storage document error')
    const result = handleError(mixedError, 'mixed test')

    expect(result.type).toBe('network') // First match wins
  })
})

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  test('should succeed on first attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')

    const result = await withRetry(mockFn)

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  test('should retry on failure and eventually succeed', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success')

    const resultPromise = withRetry(mockFn)

    // Fast forward through delays
    await vi.advanceTimersByTimeAsync(1000) // First retry delay
    await vi.advanceTimersByTimeAsync(2000) // Second retry delay (backoff: 1000 * 2)

    const result = await resultPromise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  test('should fail after max attempts', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Persistent failure'))

    const resultPromise = withRetry(mockFn, { maxAttempts: 2 })

    // Fast forward through delays
    await vi.advanceTimersByTimeAsync(1000) // First retry delay

    await expect(resultPromise).rejects.toThrow('Persistent failure')
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  test('should use custom retry options', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success')

    const options: Partial<RetryOptions> = {
      maxAttempts: 5,
      delay: 500,
      backoffFactor: 3,
    }

    const resultPromise = withRetry(mockFn, options)

    // Fast forward through custom delay
    await vi.advanceTimersByTimeAsync(500)

    const result = await resultPromise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  test('should respect shouldRetry function', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Non-retryable error'))
    const shouldRetry = vi.fn().mockReturnValue(false)

    const resultPromise = withRetry(mockFn, { shouldRetry })

    await expect(resultPromise).rejects.toThrow('Non-retryable error')
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error))
  })

  test('should continue retrying when shouldRetry returns true', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Retryable error'))
      .mockResolvedValue('success')
    const shouldRetry = vi.fn().mockReturnValue(true)

    const resultPromise = withRetry(mockFn, { shouldRetry })

    // Fast forward through delay
    await vi.advanceTimersByTimeAsync(1000)

    const result = await resultPromise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error))
  })

  test('should apply exponential backoff correctly', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success')

    const resultPromise = withRetry(mockFn, { delay: 100, backoffFactor: 2 })

    // First retry delay: 100ms
    await vi.advanceTimersByTimeAsync(100)

    // Second retry delay: 200ms (100 * 2)
    await vi.advanceTimersByTimeAsync(200)

    const result = await resultPromise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  test('should handle non-Error rejections', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce('String error')
      .mockResolvedValue('success')

    const resultPromise = withRetry(mockFn)

    // Fast forward through delay
    await vi.advanceTimersByTimeAsync(1000)

    const result = await resultPromise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  test('should throw last error when all attempts fail', async () => {
    const firstError = new Error('First error')
    const secondError = new Error('Second error')
    const thirdError = new Error('Third error')

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(firstError)
      .mockRejectedValueOnce(secondError)
      .mockRejectedValueOnce(thirdError)

    const resultPromise = withRetry(mockFn, { maxAttempts: 3 })

    // Fast forward through delays
    await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(2000)

    await expect(resultPromise).rejects.toBe(thirdError)
  })

  test('should handle zero maxAttempts gracefully', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Error'))

    // With zero maxAttempts, the loop should not execute
    await expect(withRetry(mockFn, { maxAttempts: 0 })).rejects.toThrow()
    expect(mockFn).not.toHaveBeenCalled()
  })

  test('should handle single maxAttempt', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Error'))

    const resultPromise = withRetry(mockFn, { maxAttempts: 1 })

    await expect(resultPromise).rejects.toThrow('Error')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})

describe('shouldRetryNetworkError', () => {
  test('should return true for network AutomergeError', () => {
    const error = createError('Network error', 'network')
    expect(shouldRetryNetworkError(error)).toBe(true)
  })

  test('should return false for non-network AutomergeError', () => {
    const error = createError('Storage error', 'storage')
    expect(shouldRetryNetworkError(error)).toBe(false)
  })

  test('should return true for timeout errors', () => {
    const error = new Error('Request timeout')
    expect(shouldRetryNetworkError(error)).toBe(true)
  })

  test('should return true for connection errors', () => {
    const error = new Error('connection refused')
    expect(shouldRetryNetworkError(error)).toBe(true)
  })

  test('should return false for other errors', () => {
    const error = new Error('Validation error')
    expect(shouldRetryNetworkError(error)).toBe(false)
  })

  test('should return true for errors with timeout in message', () => {
    const error = new Error('Operation timeout occurred')
    expect(shouldRetryNetworkError(error)).toBe(true)
  })

  test('should return true for errors with connection in message', () => {
    const error = new Error('Lost connection to server')
    expect(shouldRetryNetworkError(error)).toBe(true)
  })
})

describe('shouldRetryStorageError', () => {
  test('should return true for storage AutomergeError', () => {
    const error = createError('Storage write failed', 'storage')
    expect(shouldRetryStorageError(error)).toBe(true)
  })

  test('should return false for non-storage AutomergeError', () => {
    const error = createError('Network error', 'network')
    expect(shouldRetryStorageError(error)).toBe(false)
  })

  test('should return false for quota exceeded errors', () => {
    const error = createError('Storage quota exceeded', 'storage')
    expect(shouldRetryStorageError(error)).toBe(false)
  })

  test('should return false for regular errors', () => {
    const error = new Error('General error')
    expect(shouldRetryStorageError(error)).toBe(false)
  })

  test('should return true for storage errors without quota exceeded', () => {
    const error = createError('Storage transaction failed', 'storage')
    expect(shouldRetryStorageError(error)).toBe(true)
  })

  test('should handle case-insensitive quota exceeded check', () => {
    const error = createError('Storage quota exceeded', 'storage')
    expect(shouldRetryStorageError(error)).toBe(false)
  })
})

describe('Integration tests', () => {
  test('should handle complete error flow with retry', async () => {
    vi.useFakeTimers()

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network connection failed'))
      .mockResolvedValue('success')

    const resultPromise = withRetry(mockFn, {
      maxAttempts: 3,
      shouldRetry: shouldRetryNetworkError,
    })

    // Fast forward through delay
    await vi.advanceTimersByTimeAsync(1000)

    const result = await resultPromise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })

  test('should not retry non-retryable storage errors', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValue(createError('Storage quota exceeded', 'storage'))

    const resultPromise = withRetry(mockFn, {
      maxAttempts: 3,
      shouldRetry: shouldRetryStorageError,
    })

    await expect(resultPromise).rejects.toThrow('Storage quota exceeded')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  test('should sanitize and classify errors in handleError', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const sensitiveError = new Error('network error with user@example.com')
    const result = handleError(sensitiveError, 'API call')

    expect(result.type).toBe('network')
    expect(result.message).toBe('API call: network error with [email]')
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error in API call:',
      sensitiveError
    )

    consoleSpy.mockRestore()
  })
})
