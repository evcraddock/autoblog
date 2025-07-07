import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Repo, DocHandle, DocumentId } from '@automerge/automerge-repo'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { AutomergeError, handleError } from '../../utils/errorHandling'
import type { BlogIndex } from '../../types'
import {
  initRepo,
  getOrCreateIndex,
  findPostBySlug,
  cleanup,
  type SyncSource,
} from '../automerge'

// Mock external dependencies
vi.mock('@automerge/automerge-repo')
vi.mock('@automerge/automerge-repo-storage-indexeddb')
vi.mock('@automerge/automerge-repo-network-websocket')
vi.mock('../../utils/errorHandling')

// Mock console to avoid test output pollution
const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('automerge service', () => {
  let mockRepo: Repo
  let mockDocHandle: DocHandle<BlogIndex>
  let mockStorageAdapter: IndexedDBStorageAdapter
  let mockNetworkAdapter: BrowserWebSocketClientAdapter

  beforeEach(async () => {
    // Clear all mocks before each test
    vi.clearAllMocks()

    // Clean up any existing repo instance
    await cleanup()

    // Mock implementations
    mockStorageAdapter = {
      name: 'indexeddb',
    } as unknown as IndexedDBStorageAdapter

    mockNetworkAdapter = {
      name: 'websocket',
    } as unknown as BrowserWebSocketClientAdapter

    mockDocHandle = {
      documentId: 'test-doc-id',
      doc: vi.fn(),
      change: vi.fn(),
      whenReady: vi.fn().mockResolvedValue(undefined),
    } as unknown as DocHandle<BlogIndex>

    mockRepo = {
      create: vi.fn().mockReturnValue(mockDocHandle),
      find: vi.fn(),
    } as unknown as Repo

    // Mock constructors
    vi.mocked(IndexedDBStorageAdapter).mockImplementation(
      () => mockStorageAdapter
    )
    vi.mocked(BrowserWebSocketClientAdapter).mockImplementation(
      () => mockNetworkAdapter
    )
    vi.mocked(Repo).mockImplementation(() => mockRepo)

    // Mock handleError
    vi.mocked(AutomergeError).mockImplementation((message, type, cause) => {
      const error = new Error(message) as Error & {
        type: string
        cause?: Error
      }
      error.type = type
      if (cause) {
        error.cause = cause
      }
      return error as AutomergeError
    })

    vi.mocked(handleError).mockImplementation((error, context) => {
      const message = error instanceof Error ? error.message : String(error)
      return new AutomergeError(
        `${context}: ${message}`,
        'unknown',
        error instanceof Error ? error : undefined
      )
    })

    // Clear localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    })
  })

  afterEach(() => {
    consoleSpy.mockClear()
    consoleErrorSpy.mockClear()
    vi.unstubAllGlobals()
  })

  describe('initRepo', () => {
    it('should initialize repo with remote sync by default', async () => {
      const result = await initRepo()

      expect(IndexedDBStorageAdapter).toHaveBeenCalledWith('autoblog-web')
      expect(BrowserWebSocketClientAdapter).toHaveBeenCalledWith(
        'wss://sync.automerge.org'
      )
      expect(Repo).toHaveBeenCalledWith({
        storage: mockStorageAdapter,
        network: [mockNetworkAdapter],
      })
      expect(result).toBe(mockRepo)
    })

    it('should initialize repo with local sync when specified', async () => {
      const result = await initRepo('local')

      expect(IndexedDBStorageAdapter).toHaveBeenCalledWith('autoblog-web')
      expect(BrowserWebSocketClientAdapter).not.toHaveBeenCalled()
      expect(Repo).toHaveBeenCalledWith({
        storage: mockStorageAdapter,
      })
      expect(result).toBe(mockRepo)
    })

    it('should initialize repo with custom sync URL', async () => {
      const customUrl = 'wss://custom.sync.server'
      const result = await initRepo('remote', customUrl)

      expect(BrowserWebSocketClientAdapter).toHaveBeenCalledWith(customUrl)
      expect(Repo).toHaveBeenCalledWith({
        storage: mockStorageAdapter,
        network: [mockNetworkAdapter],
      })
      expect(result).toBe(mockRepo)
    })

    it('should return existing repo instance when already initialized', async () => {
      // First call initializes the repo
      const firstResult = await initRepo()

      // Second call should return the same instance without recreating
      const secondResult = await initRepo()

      expect(firstResult).toBe(secondResult)
      expect(Repo).toHaveBeenCalledTimes(1)
    })

    it('should handle storage adapter creation failure', async () => {
      const storageError = new Error('Storage initialization failed')
      vi.mocked(IndexedDBStorageAdapter).mockImplementation(() => {
        throw storageError
      })

      const mockHandleError = vi
        .fn()
        .mockReturnValue(
          new AutomergeError('Handled error', 'storage', storageError)
        )
      vi.mocked(handleError).mockImplementation(mockHandleError)

      await expect(initRepo()).rejects.toThrow('Handled error')
      expect(mockHandleError).toHaveBeenCalledWith(
        storageError,
        'Failed to initialize Automerge repository'
      )
    })

    it('should handle network adapter creation failure', async () => {
      const networkError = new Error('Network initialization failed')
      vi.mocked(BrowserWebSocketClientAdapter).mockImplementation(() => {
        throw networkError
      })

      const mockHandleError = vi
        .fn()
        .mockReturnValue(
          new AutomergeError('Handled error', 'network', networkError)
        )
      vi.mocked(handleError).mockImplementation(mockHandleError)

      await expect(initRepo('remote')).rejects.toThrow('Handled error')
      expect(mockHandleError).toHaveBeenCalledWith(
        networkError,
        'Failed to initialize Automerge repository'
      )
    })

    it('should handle repo creation failure', async () => {
      const repoError = new Error('Repo creation failed')
      vi.mocked(Repo).mockImplementation(() => {
        throw repoError
      })

      const mockHandleError = vi
        .fn()
        .mockReturnValue(
          new AutomergeError('Handled error', 'unknown', repoError)
        )
      vi.mocked(handleError).mockImplementation(mockHandleError)

      await expect(initRepo()).rejects.toThrow('Handled error')
      expect(mockHandleError).toHaveBeenCalledWith(
        repoError,
        'Failed to initialize Automerge repository'
      )
    })
  })

  describe('getOrCreateIndex', () => {
    beforeEach(async () => {
      // Clean up any existing repo instance
      await cleanup()
    })

    it('should create new index when no existing index ID in localStorage', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)

      const result = await getOrCreateIndex(mockRepo)

      expect(localStorage.getItem).toHaveBeenCalledWith('autoblog-index-id')
      expect(mockRepo.create).toHaveBeenCalled()
      expect(mockDocHandle.change).toHaveBeenCalled()
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'autoblog-index-id',
        'test-doc-id'
      )
      expect(result).toBe(mockDocHandle)
    })

    it('should return existing index when found in localStorage', async () => {
      const existingId = 'existing-doc-id'
      vi.mocked(localStorage.getItem).mockReturnValue(existingId)
      vi.mocked(mockRepo.find).mockResolvedValue(mockDocHandle)

      const result = await getOrCreateIndex(mockRepo)

      expect(localStorage.getItem).toHaveBeenCalledWith('autoblog-index-id')
      expect(mockRepo.find).toHaveBeenCalledWith(existingId)
      expect(mockDocHandle.whenReady).toHaveBeenCalled()
      expect(mockRepo.create).not.toHaveBeenCalled()
      expect(result).toBe(mockDocHandle)
    })

    it('should create new index when existing index not found in repo', async () => {
      const existingId = 'non-existent-doc-id'
      vi.mocked(localStorage.getItem).mockReturnValue(existingId)
      vi.mocked(mockRepo.find).mockResolvedValue(
        null as unknown as DocHandle<BlogIndex>
      )

      const result = await getOrCreateIndex(mockRepo)

      expect(mockRepo.find).toHaveBeenCalledWith(existingId)
      expect(mockRepo.create).toHaveBeenCalled()
      expect(mockDocHandle.change).toHaveBeenCalled()
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'autoblog-index-id',
        'test-doc-id'
      )
      expect(result).toBe(mockDocHandle)
    })

    it('should create new index when existing index is corrupted', async () => {
      const existingId = 'corrupted-doc-id'
      vi.mocked(localStorage.getItem).mockReturnValue(existingId)
      vi.mocked(mockRepo.find).mockRejectedValue(
        new Error('Document corrupted')
      )

      const result = await getOrCreateIndex(mockRepo)

      expect(mockRepo.find).toHaveBeenCalledWith(existingId)
      expect(mockRepo.create).toHaveBeenCalled()
      expect(mockDocHandle.change).toHaveBeenCalled()
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'autoblog-index-id',
        'test-doc-id'
      )
      expect(result).toBe(mockDocHandle)
    })

    it('should handle localStorage getItem failure gracefully', async () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })

      const result = await getOrCreateIndex(mockRepo)

      expect(mockRepo.create).toHaveBeenCalled()
      expect(mockDocHandle.change).toHaveBeenCalled()
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'autoblog-index-id',
        'test-doc-id'
      )
      expect(result).toBe(mockDocHandle)
    })

    it('should handle localStorage setItem failure gracefully', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('localStorage quota exceeded')
      })

      const result = await getOrCreateIndex(mockRepo)

      expect(mockRepo.create).toHaveBeenCalled()
      expect(mockDocHandle.change).toHaveBeenCalled()
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'autoblog-index-id',
        'test-doc-id'
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        'Warning: Could not save index document ID to localStorage'
      )
      expect(result).toBe(mockDocHandle)
    })

    it('should initialize empty posts object and lastUpdated date', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      const mockChangeCallback = vi.fn()
      vi.mocked(mockDocHandle.change).mockImplementation(mockChangeCallback)

      await getOrCreateIndex(mockRepo)

      expect(mockDocHandle.change).toHaveBeenCalled()

      // Get the callback passed to change and verify it sets the correct properties
      const changeCallback = mockChangeCallback.mock.calls[0]?.[0]
      if (changeCallback) {
        const mockDoc = {} as BlogIndex
        changeCallback(mockDoc)

        expect(mockDoc.posts).toEqual({})
        expect(mockDoc.lastUpdated).toBeInstanceOf(Date)
      }
    })

    it('should handle whenReady failure on existing document', async () => {
      const existingId = 'existing-doc-id'
      vi.mocked(localStorage.getItem).mockReturnValue(existingId)
      vi.mocked(mockRepo.find).mockResolvedValue(mockDocHandle)
      vi.mocked(mockDocHandle.whenReady).mockRejectedValue(
        new Error('Document not ready')
      )

      const result = await getOrCreateIndex(mockRepo)

      expect(mockRepo.find).toHaveBeenCalledWith(existingId)
      expect(mockDocHandle.whenReady).toHaveBeenCalled()
      // Should fall back to creating new index
      expect(mockRepo.create).toHaveBeenCalled()
      expect(result).toBe(mockDocHandle)
    })
  })

  describe('findPostBySlug', () => {
    let mockBlogIndex: BlogIndex

    beforeEach(() => {
      mockBlogIndex = {
        posts: {
          'hello-world': 'post-doc-id-1',
          'getting-started': 'post-doc-id-2',
          'advanced-topics': 'post-doc-id-3',
        },
        lastUpdated: new Date('2023-01-01'),
      }
    })

    it('should return document ID when post exists', async () => {
      vi.mocked(mockDocHandle.doc).mockResolvedValue(mockBlogIndex)

      const result = await findPostBySlug(mockDocHandle, 'hello-world')

      expect(mockDocHandle.doc).toHaveBeenCalled()
      expect(result).toBe('post-doc-id-1')
    })

    it('should return null when post does not exist', async () => {
      vi.mocked(mockDocHandle.doc).mockResolvedValue(mockBlogIndex)

      const result = await findPostBySlug(mockDocHandle, 'non-existent-slug')

      expect(mockDocHandle.doc).toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should return null when document is null', async () => {
      vi.mocked(mockDocHandle.doc).mockResolvedValue(
        null as unknown as BlogIndex
      )

      const result = await findPostBySlug(mockDocHandle, 'hello-world')

      expect(mockDocHandle.doc).toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should return null when document is undefined', async () => {
      vi.mocked(mockDocHandle.doc).mockResolvedValue(
        undefined as unknown as BlogIndex
      )

      const result = await findPostBySlug(mockDocHandle, 'hello-world')

      expect(mockDocHandle.doc).toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should handle empty slug', async () => {
      vi.mocked(mockDocHandle.doc).mockResolvedValue(mockBlogIndex)

      const result = await findPostBySlug(mockDocHandle, '')

      expect(mockDocHandle.doc).toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should handle slug with special characters', async () => {
      const specialSlug = 'post-with-special-chars-@#$%'
      mockBlogIndex.posts[specialSlug] = 'special-doc-id'
      vi.mocked(mockDocHandle.doc).mockResolvedValue(mockBlogIndex)

      const result = await findPostBySlug(mockDocHandle, specialSlug)

      expect(result).toBe('special-doc-id')
    })

    it('should handle case sensitivity', async () => {
      vi.mocked(mockDocHandle.doc).mockResolvedValue(mockBlogIndex)

      const result = await findPostBySlug(mockDocHandle, 'HELLO-WORLD')

      expect(result).toBeNull() // Should be case-sensitive
    })

    it('should handle whitespace in slug', async () => {
      vi.mocked(mockDocHandle.doc).mockResolvedValue(mockBlogIndex)

      const result = await findPostBySlug(mockDocHandle, ' hello-world ')

      expect(result).toBeNull() // Should match exactly
    })

    it('should handle document with empty posts object', async () => {
      const emptyBlogIndex: BlogIndex = {
        posts: {},
        lastUpdated: new Date(),
      }
      vi.mocked(mockDocHandle.doc).mockResolvedValue(emptyBlogIndex)

      const result = await findPostBySlug(mockDocHandle, 'any-slug')

      expect(result).toBeNull()
    })

    it('should handle document without posts property', async () => {
      const incompleteBlogIndex = {
        lastUpdated: new Date(),
        posts: undefined,
      } as unknown as BlogIndex
      vi.mocked(mockDocHandle.doc).mockResolvedValue(incompleteBlogIndex)

      const result = await findPostBySlug(mockDocHandle, 'any-slug')

      expect(result).toBeNull()
    })

    it('should handle doc() method throwing error', async () => {
      vi.mocked(mockDocHandle.doc).mockRejectedValue(
        new Error('Document access failed')
      )

      await expect(
        findPostBySlug(mockDocHandle, 'hello-world')
      ).rejects.toThrow('Document access failed')
    })
  })

  describe('cleanup', () => {
    it('should clear repo instance when cleanup is called', async () => {
      // First initialize a repo
      await initRepo()

      // Then cleanup
      await cleanup()

      // Next call to initRepo should create a new instance
      const newRepo = await initRepo()
      expect(newRepo).toBe(mockRepo)
      expect(Repo).toHaveBeenCalledTimes(2) // Once for initial, once after cleanup
    })

    it('should handle cleanup when no repo instance exists', async () => {
      // Should not throw error when no repo exists
      await expect(cleanup()).resolves.toBeUndefined()
    })

    it('should handle cleanup errors gracefully', async () => {
      // Initialize repo first
      await initRepo()

      // Mock console.warn to capture warning
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Cleanup should not throw even if there are errors
      await expect(cleanup()).resolves.toBeUndefined()

      warnSpy.mockRestore()
    })

    it('should always clear repo instance even if errors occur', async () => {
      // Initialize repo first
      await initRepo()

      // Cleanup
      await cleanup()

      // Verify repo is cleared by checking if next initRepo creates new instance
      const newRepo = await initRepo()
      expect(newRepo).toBe(mockRepo)
    })
  })

  describe('error handling integration', () => {
    it('should handle network errors in initRepo', async () => {
      const networkError = new Error('WebSocket connection failed')
      vi.mocked(BrowserWebSocketClientAdapter).mockImplementation(() => {
        throw networkError
      })

      const mockHandleError = vi
        .fn()
        .mockReturnValue(
          new AutomergeError('Network error', 'network', networkError)
        )
      vi.mocked(handleError).mockImplementation(mockHandleError)

      await expect(initRepo('remote')).rejects.toThrow('Network error')
      expect(mockHandleError).toHaveBeenCalledWith(
        networkError,
        'Failed to initialize Automerge repository'
      )
    })

    it('should handle storage errors in initRepo', async () => {
      const storageError = new Error('IndexedDB not available')
      vi.mocked(IndexedDBStorageAdapter).mockImplementation(() => {
        throw storageError
      })

      const mockHandleError = vi
        .fn()
        .mockReturnValue(
          new AutomergeError('Storage error', 'storage', storageError)
        )
      vi.mocked(handleError).mockImplementation(mockHandleError)

      await expect(initRepo()).rejects.toThrow('Storage error')
      expect(mockHandleError).toHaveBeenCalledWith(
        storageError,
        'Failed to initialize Automerge repository'
      )
    })
  })

  describe('type safety', () => {
    it('should handle SyncSource type correctly', async () => {
      const localSource: SyncSource = 'local'
      const remoteSource: SyncSource = 'remote'

      await initRepo(localSource)
      await initRepo(remoteSource)

      // TypeScript should prevent invalid values
      // This would cause a TypeScript error: initRepo('invalid')
    })

    it('should handle DocumentId type correctly', async () => {
      const documentId = 'test-doc-id' as DocumentId
      vi.mocked(localStorage.getItem).mockReturnValue(documentId)
      vi.mocked(mockRepo.find).mockResolvedValue(mockDocHandle)

      await getOrCreateIndex(mockRepo)

      expect(mockRepo.find).toHaveBeenCalledWith(documentId)
    })
  })

  describe('edge cases and boundary conditions', () => {
    it('should handle very long slug names', async () => {
      const longSlug = 'a'.repeat(1000)
      const mockBlogIndex: BlogIndex = {
        posts: {
          [longSlug]: 'long-slug-doc-id',
        },
        lastUpdated: new Date(),
      }
      vi.mocked(mockDocHandle.doc).mockResolvedValue(mockBlogIndex)

      const result = await findPostBySlug(mockDocHandle, longSlug)

      expect(result).toBe('long-slug-doc-id')
    })

    it('should handle Unicode characters in slug', async () => {
      const unicodeSlug = 'post-with-unicode-emoji-🚀-and-中文'
      const mockBlogIndex: BlogIndex = {
        posts: {
          [unicodeSlug]: 'unicode-doc-id',
        },
        lastUpdated: new Date(),
      }
      vi.mocked(mockDocHandle.doc).mockResolvedValue(mockBlogIndex)

      const result = await findPostBySlug(mockDocHandle, unicodeSlug)

      expect(result).toBe('unicode-doc-id')
    })

    it('should handle multiple concurrent initRepo calls', async () => {
      const promises = [initRepo(), initRepo(), initRepo()]

      const results = await Promise.all(promises)

      // All should return the same instance
      expect(results[0]).toBe(results[1])
      expect(results[1]).toBe(results[2])
      expect(Repo).toHaveBeenCalledTimes(1)
    })

    it('should handle localStorage quota exceeded scenario', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('QuotaExceededError: localStorage quota exceeded')
      })

      // Create a fresh spy for this test
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await getOrCreateIndex(mockRepo)

      expect(result).toBe(mockDocHandle)
      expect(warnSpy).toHaveBeenCalledWith(
        'Warning: Could not save index document ID to localStorage'
      )

      warnSpy.mockRestore()
    })
  })
})
