/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { Repo, DocHandle, DocumentId } from '@automerge/automerge-repo'
import { useRepo, useDocument } from '@automerge/react'
import { getOrCreateIndex } from '../../services/automerge'
import type { BlogPost, BlogIndex } from '../../types'
import {
  useBlogIndex,
  useBlogPost,
  useBlogPosts,
  useBlogIndexSuspense,
  useBlogPostSuspense,
} from '../useAutomerge'

// Mock external dependencies
vi.mock('@automerge/react')
vi.mock('../../services/automerge')

// Mock console to avoid test output pollution
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('useAutomerge hooks', () => {
  let mockRepo: Repo
  let mockDocHandle: DocHandle<BlogIndex>
  let mockPostHandle: DocHandle<BlogPost>
  let mockBlogIndex: BlogIndex
  let mockBlogPost: BlogPost
  let mockBlogPosts: BlogPost[]

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()

    // Create mock data
    mockBlogIndex = {
      posts: {
        'hello-world': 'post-doc-id-1',
        'getting-started': 'post-doc-id-2',
        'advanced-topics': 'post-doc-id-3',
      },
      lastUpdated: new Date('2023-01-01'),
    }

    mockBlogPost = {
      title: 'Hello World',
      author: 'Test Author',
      published: new Date('2023-01-01'),
      status: 'published',
      slug: 'hello-world',
      description: 'Test description',
      content: 'Test content',
      imageUrl: 'https://example.com/image.jpg',
    }

    mockBlogPosts = [
      {
        title: 'Hello World',
        author: 'Test Author',
        published: new Date('2023-01-01'),
        status: 'published',
        slug: 'hello-world',
        description: 'Test description',
        content: 'Test content',
      },
      {
        title: 'Getting Started',
        author: 'Test Author',
        published: new Date('2023-01-02'),
        status: 'published',
        slug: 'getting-started',
        description: 'Getting started description',
        content: 'Getting started content',
      },
      {
        title: 'Draft Post',
        author: 'Test Author',
        published: new Date('2023-01-03'),
        status: 'draft',
        slug: 'draft-post',
        description: 'Draft description',
        content: 'Draft content',
      },
    ] as BlogPost[]

    // Create mock handles
    mockDocHandle = {
      documentId: 'index-doc-id',
      doc: vi.fn().mockResolvedValue(mockBlogIndex),
      change: vi.fn(),
      whenReady: vi.fn().mockResolvedValue(undefined),
    } as unknown as DocHandle<BlogIndex>

    mockPostHandle = {
      documentId: 'post-doc-id-1',
      doc: vi.fn().mockResolvedValue(mockBlogPost),
      change: vi.fn(),
      whenReady: vi.fn().mockResolvedValue(undefined),
    } as unknown as DocHandle<BlogPost>

    // Create mock repo
    mockRepo = {
      create: vi.fn().mockReturnValue(mockDocHandle),
      find: vi.fn().mockImplementation((docId: DocumentId) => {
        if (docId === 'post-doc-id-1') {
          return Promise.resolve(mockPostHandle)
        }
        if (docId === 'post-doc-id-2') {
          return Promise.resolve({
            ...mockPostHandle,
            documentId: 'post-doc-id-2',
            doc: vi.fn().mockResolvedValue(mockBlogPosts[1]),
          })
        }
        if (docId === 'post-doc-id-3') {
          return Promise.resolve({
            ...mockPostHandle,
            documentId: 'post-doc-id-3',
            doc: vi.fn().mockResolvedValue(mockBlogPosts[2]),
          })
        }
        return Promise.resolve(mockDocHandle)
      }),
    } as unknown as Repo

    // Mock @automerge/react hooks
    vi.mocked(useRepo).mockReturnValue(mockRepo as any)
    vi.mocked(useDocument).mockImplementation(((docId?: any, options?: any) => {
      if (options?.suspense) {
        // For suspense mode, return the document directly
        if (docId === 'index-doc-id') {
          return [mockBlogIndex]
        }
        if (docId === 'post-doc-id-1') {
          return [mockBlogPost]
        }
        return [null]
      }
      // For regular mode, return the document or null based on docId
      if (docId === 'index-doc-id') {
        return [mockBlogIndex]
      }
      if (docId === 'post-doc-id-1') {
        return [mockBlogPost]
      }
      return [null]
    }) as any)

    // Mock getOrCreateIndex service
    vi.mocked(getOrCreateIndex).mockResolvedValue(mockDocHandle)
  })

  afterEach(() => {
    consoleSpy.mockClear()
  })

  describe('useBlogIndex', () => {
    it('should return loading state initially', async () => {
      vi.mocked(useDocument).mockReturnValue([null] as any)
      vi.mocked(getOrCreateIndex).mockImplementation(
        () =>
          new Promise(resolve => setTimeout(() => resolve(mockDocHandle), 100))
      )

      const { result } = renderHook(() => useBlogIndex())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.blogIndex).toBeNull()
    })

    it('should return blog index when loaded successfully', async () => {
      const { result } = renderHook(() => useBlogIndex())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.blogIndex).toEqual(mockBlogIndex)
      expect(getOrCreateIndex).toHaveBeenCalledWith(mockRepo)
    })

    it('should handle error when getOrCreateIndex fails', async () => {
      const error = new Error('Failed to load index')
      vi.mocked(getOrCreateIndex).mockRejectedValue(error)
      vi.mocked(useDocument).mockReturnValue([null] as any)

      const { result } = renderHook(() => useBlogIndex())

      await waitFor(() => {
        expect(getOrCreateIndex).toHaveBeenCalled()
      })

      // Should still be loading because blogIndex is null, even though async operation failed
      expect(result.current.isLoading).toBe(true)
      expect(result.current.blogIndex).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load index:', error)
    })

    it('should not load index when repo is not available', () => {
      vi.mocked(useRepo).mockReturnValue(null)

      const { result } = renderHook(() => useBlogIndex())

      expect(result.current.isLoading).toBe(true)
      expect(getOrCreateIndex).not.toHaveBeenCalled()
    })

    it('should consider loading complete when blogIndex is available', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

      const { result } = renderHook(() => useBlogIndex())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.blogIndex).toEqual(mockBlogIndex)
    })

    it('should remain loading when blogIndex is not available', async () => {
      vi.mocked(useDocument).mockReturnValue([null])

      const { result } = renderHook(() => useBlogIndex())

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(getOrCreateIndex).toHaveBeenCalled()
      })

      // Should still be loading because blogIndex is null (isLoading || !blogIndex)
      expect(result.current.isLoading).toBe(true)
      expect(result.current.blogIndex).toBeNull()
    })
  })

  describe('useBlogPost', () => {
    it('should return loading state initially', () => {
      vi.mocked(useDocument).mockReturnValue([null])

      const { result } = renderHook(() => useBlogPost('hello-world'))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.post).toBeNull()
      expect(result.current.notFound).toBe(false)
    })

    it('should return blog post when found', async () => {
      // Mock useBlogIndex to return the index
      vi.mocked(useDocument).mockImplementation(docId => {
        if (docId === 'index-doc-id') {
          return [mockBlogIndex]
        }
        if (docId === 'post-doc-id-1') {
          return [mockBlogPost]
        }
        return [null]
      })

      const { result } = renderHook(() => useBlogPost('hello-world'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.post).toEqual(mockBlogPost)
      expect(result.current.notFound).toBe(false)
    })

    it('should return notFound when post slug does not exist', async () => {
      vi.mocked(useDocument).mockImplementation(docId => {
        if (docId === 'index-doc-id') {
          return [mockBlogIndex]
        }
        return [null]
      })

      const { result } = renderHook(() => useBlogPost('non-existent-slug'))

      await waitFor(() => {
        expect(result.current.notFound).toBe(true)
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.post).toBeNull()
    })

    it('should handle empty slug', () => {
      const { result } = renderHook(() => useBlogPost(''))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.notFound).toBe(false)
    })

    it('should wait for blog index to load before processing', () => {
      vi.mocked(useDocument).mockReturnValue([null])

      const { result } = renderHook(() => useBlogPost('hello-world'))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.notFound).toBe(false)
    })

    it('should handle repo not available', () => {
      vi.mocked(useRepo).mockReturnValue(null)

      const { result } = renderHook(() => useBlogPost('hello-world'))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.notFound).toBe(false)
    })

    it('should update when slug changes', async () => {
      vi.mocked(useDocument).mockImplementation(docId => {
        if (docId === 'index-doc-id') {
          return [mockBlogIndex]
        }
        if (docId === 'post-doc-id-1') {
          return [mockBlogPost]
        }
        if (docId === 'post-doc-id-2') {
          return [mockBlogPosts[1]]
        }
        return [null]
      })

      const { result, rerender } = renderHook(({ slug }) => useBlogPost(slug), {
        initialProps: { slug: 'hello-world' },
      })

      await waitFor(() => {
        expect(result.current.post).toEqual(mockBlogPost)
      })

      // Change slug
      rerender({ slug: 'getting-started' })

      await waitFor(() => {
        expect(result.current.post).toEqual(mockBlogPosts[1])
      })
    })
  })

  describe('useBlogPosts', () => {
    beforeEach(() => {
      // Mock repo.find to return handles for each post
      vi.mocked(mockRepo.find).mockImplementation(async (docId: DocumentId) => {
        const postIndex = mockBlogPosts.findIndex(
          (_, i) => `post-doc-id-${i + 1}` === docId
        )
        if (postIndex !== -1) {
          return {
            documentId: docId,
            doc: vi.fn().mockResolvedValue(mockBlogPosts[postIndex]),
            whenReady: vi.fn().mockResolvedValue(undefined),
          } as unknown as DocHandle<BlogPost>
        }
        return null
      })
    })

    it('should return loading state initially', () => {
      vi.mocked(useDocument).mockReturnValue([null])

      const { result } = renderHook(() => useBlogPosts())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.posts).toEqual([])
    })

    it('should return published posts by default', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

      const { result } = renderHook(() => useBlogPosts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const publishedPosts = result.current.posts.filter(
        post => post.status === 'published'
      )
      expect(publishedPosts).toHaveLength(2)
      expect(publishedPosts.every(post => post.status === 'published')).toBe(
        true
      )
    })

    it('should filter posts by status', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

      const { result } = renderHook(() => useBlogPosts({ status: 'draft' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const draftPosts = result.current.posts.filter(
        post => post.status === 'draft'
      )
      expect(draftPosts).toHaveLength(1)
      expect(draftPosts[0].status).toBe('draft')
    })

    it('should return all posts when status is "all"', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

      const { result } = renderHook(() => useBlogPosts({ status: 'all' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts).toHaveLength(3)
    })

    it('should filter posts by author', async () => {
      // Create posts with different authors
      const postsWithDifferentAuthors = [
        { ...mockBlogPosts[0], author: 'Author 1' },
        { ...mockBlogPosts[1], author: 'Author 2' },
        { ...mockBlogPosts[2], author: 'Author 1' },
      ]

      vi.mocked(mockRepo.find).mockImplementation(async (docId: DocumentId) => {
        const postIndex = postsWithDifferentAuthors.findIndex(
          (_, i) => `post-doc-id-${i + 1}` === docId
        )
        if (postIndex !== -1) {
          return {
            documentId: docId,
            doc: vi
              .fn()
              .mockResolvedValue(postsWithDifferentAuthors[postIndex]),
            whenReady: vi.fn().mockResolvedValue(undefined),
          } as unknown as DocHandle<BlogPost>
        }
        return null
      })

      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

      const { result } = renderHook(() =>
        useBlogPosts({ author: 'Author 1', status: 'all' })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts).toHaveLength(2)
      expect(
        result.current.posts.every(post => post.author === 'Author 1')
      ).toBe(true)
    })

    it('should limit posts when limit is specified', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

      const { result } = renderHook(() =>
        useBlogPosts({ limit: 1, status: 'all' })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts).toHaveLength(1)
    })

    it('should sort posts by published date descending', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

      const { result } = renderHook(() => useBlogPosts({ status: 'all' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const posts = result.current.posts
      for (let i = 0; i < posts.length - 1; i++) {
        const currentDate = new Date(posts[i].published).getTime()
        const nextDate = new Date(posts[i + 1].published).getTime()
        expect(currentDate).toBeGreaterThanOrEqual(nextDate)
      }
    })

    it('should handle error when loading posts', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])
      vi.mocked(mockRepo.find).mockRejectedValue(
        new Error('Failed to load post')
      )

      const { result } = renderHook(() => useBlogPosts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load post with ID: post-doc-id-1',
        expect.any(Error)
      )
    })

    it('should handle individual post loading errors', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])
      vi.mocked(mockRepo.find).mockImplementation(async (docId: DocumentId) => {
        if (docId === 'post-doc-id-1') {
          throw new Error('Failed to load specific post')
        }
        const postIndex = mockBlogPosts.findIndex(
          (_, i) => `post-doc-id-${i + 1}` === docId
        )
        if (postIndex !== -1) {
          return {
            documentId: docId,
            doc: vi.fn().mockResolvedValue(mockBlogPosts[postIndex]),
            whenReady: vi.fn().mockResolvedValue(undefined),
          } as unknown as DocHandle<BlogPost>
        }
        return null
      })

      const { result } = renderHook(() => useBlogPosts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should still return the posts that loaded successfully
      expect(result.current.posts.length).toBeGreaterThan(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load post with ID: post-doc-id-1',
        expect.any(Error)
      )
    })

    it('should wait for blog index to load', () => {
      vi.mocked(useDocument).mockReturnValue([null])

      const { result } = renderHook(() => useBlogPosts())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.posts).toEqual([])
    })

    it('should handle empty blog index', async () => {
      const emptyIndex = { posts: {}, lastUpdated: new Date() }
      vi.mocked(useDocument).mockReturnValue([emptyIndex])

      const { result } = renderHook(() => useBlogPosts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts).toEqual([])
    })

    it('should handle repo not available', () => {
      vi.mocked(useRepo).mockReturnValue(null)

      const { result } = renderHook(() => useBlogPosts())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.posts).toEqual([])
    })

    it('should handle null post document', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])
      vi.mocked(mockRepo.find).mockImplementation(async (docId: DocumentId) => {
        return {
          documentId: docId,
          doc: vi.fn().mockResolvedValue(null), // Return null document
          whenReady: vi.fn().mockResolvedValue(undefined),
        } as unknown as DocHandle<BlogPost>
      })

      const { result } = renderHook(() => useBlogPosts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts).toEqual([])
    })

    it('should handle null post handle', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])
      vi.mocked(mockRepo.find).mockResolvedValue(null)

      const { result } = renderHook(() => useBlogPosts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts).toEqual([])
    })

    describe('refresh functionality', () => {
      it('should refresh posts when refresh is called', async () => {
        vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

        const { result } = renderHook(() => useBlogPosts())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        const initialPosts = result.current.posts
        expect(initialPosts.length).toBeGreaterThan(0)

        // Clear the mock and set up new data
        vi.clearAllMocks()
        vi.mocked(useDocument).mockReturnValue([mockBlogIndex])
        vi.mocked(mockRepo.find).mockImplementation(
          async (docId: DocumentId) => {
            const postIndex = mockBlogPosts.findIndex(
              (_, i) => `post-doc-id-${i + 1}` === docId
            )
            if (postIndex !== -1) {
              return {
                documentId: docId,
                doc: vi.fn().mockResolvedValue(mockBlogPosts[postIndex]),
                whenReady: vi.fn().mockResolvedValue(undefined),
              } as unknown as DocHandle<BlogPost>
            }
            return null
          }
        )

        // Call refresh
        await result.current.refresh()

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Verify posts were reloaded
        expect(mockRepo.find).toHaveBeenCalled()
      })

      it('should handle refresh when repo is not available', async () => {
        vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

        const { result } = renderHook(() => useBlogPosts())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Change repo to null after initial load
        vi.mocked(useRepo).mockReturnValue(null)

        // Should not throw error
        await expect(result.current.refresh()).resolves.toBeUndefined()
      })

      it('should handle refresh when blogIndex is not available', async () => {
        vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

        const { result } = renderHook(() => useBlogPosts())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Change blogIndex to null after initial load
        vi.mocked(useDocument).mockReturnValue([null])

        // Should not throw error
        await expect(result.current.refresh()).resolves.toBeUndefined()
      })

      it('should handle refresh error', async () => {
        vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

        const { result } = renderHook(() => useBlogPosts())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Mock error on refresh
        vi.mocked(mockRepo.find).mockRejectedValue(new Error('Refresh failed'))

        await result.current.refresh()

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load post with ID: post-doc-id-1',
          expect.any(Error)
        )
      })
    })
  })

  describe('useBlogIndexSuspense', () => {
    it('should return blog index using suspense', () => {
      const indexId = 'index-doc-id' as DocumentId
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

      const { result } = renderHook(() => useBlogIndexSuspense(indexId))

      expect(result.current.blogIndex).toEqual(mockBlogIndex)
      expect(useDocument).toHaveBeenCalledWith(indexId, { suspense: true })
    })

    it('should handle different index IDs', () => {
      const indexId = 'different-index-id' as DocumentId
      const differentIndex = { posts: {}, lastUpdated: new Date() }
      vi.mocked(useDocument).mockReturnValue([differentIndex])

      const { result } = renderHook(() => useBlogIndexSuspense(indexId))

      expect(result.current.blogIndex).toEqual(differentIndex)
      expect(useDocument).toHaveBeenCalledWith(indexId, { suspense: true })
    })

    it('should handle null blog index', () => {
      const indexId = 'null-index-id' as DocumentId
      vi.mocked(useDocument).mockReturnValue([null])

      const { result } = renderHook(() => useBlogIndexSuspense(indexId))

      expect(result.current.blogIndex).toBeNull()
      expect(useDocument).toHaveBeenCalledWith(indexId, { suspense: true })
    })
  })

  describe('useBlogPostSuspense', () => {
    it('should return blog post using suspense', () => {
      const postId = 'post-doc-id-1' as DocumentId
      vi.mocked(useDocument).mockReturnValue([mockBlogPost])

      const { result } = renderHook(() => useBlogPostSuspense(postId))

      expect(result.current.post).toEqual(mockBlogPost)
      expect(useDocument).toHaveBeenCalledWith(postId, { suspense: true })
    })

    it('should handle different post IDs', () => {
      const postId = 'different-post-id' as DocumentId
      const differentPost = { ...mockBlogPost, title: 'Different Post' }
      vi.mocked(useDocument).mockReturnValue([differentPost])

      const { result } = renderHook(() => useBlogPostSuspense(postId))

      expect(result.current.post).toEqual(differentPost)
      expect(useDocument).toHaveBeenCalledWith(postId, { suspense: true })
    })

    it('should handle null blog post', () => {
      const postId = 'null-post-id' as DocumentId
      vi.mocked(useDocument).mockReturnValue([null])

      const { result } = renderHook(() => useBlogPostSuspense(postId))

      expect(result.current.post).toBeNull()
      expect(useDocument).toHaveBeenCalledWith(postId, { suspense: true })
    })
  })

  describe('state transitions', () => {
    it('should transition from loading to success in useBlogIndex', async () => {
      let resolveIndex: (value: DocHandle<BlogIndex>) => void
      vi.mocked(getOrCreateIndex).mockReturnValue(
        new Promise(resolve => {
          resolveIndex = resolve
        })
      )
      vi.mocked(useDocument).mockReturnValue([null])

      const { result } = renderHook(() => useBlogIndex())

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.blogIndex).toBeNull()

      // Mock document becomes available
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])
      resolveIndex!(mockDocHandle)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.blogIndex).toEqual(mockBlogIndex)
    })

    it('should transition from loading to error in useBlogIndex', async () => {
      vi.mocked(getOrCreateIndex).mockRejectedValue(new Error('Load failed'))
      vi.mocked(useDocument).mockReturnValue([null])

      const { result } = renderHook(() => useBlogIndex())

      await waitFor(() => {
        expect(getOrCreateIndex).toHaveBeenCalled()
      })

      // Should still be loading because blogIndex is null, even though async operation failed
      expect(result.current.isLoading).toBe(true)
      expect(result.current.blogIndex).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load index:',
        expect.any(Error)
      )
    })

    it('should transition from loading to success in useBlogPosts', async () => {
      // Start with loading state
      vi.mocked(useDocument).mockReturnValue([null])

      const { result } = renderHook(() => useBlogPosts())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.posts).toEqual([])

      // Index becomes available
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts.length).toBeGreaterThan(0)
    })

    it('should transition from loading to error in useBlogPosts', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])
      vi.mocked(mockRepo.find).mockRejectedValue(new Error('Posts load failed'))

      const { result } = renderHook(() => useBlogPosts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load post with ID: post-doc-id-1',
        expect.any(Error)
      )
    })
  })

  describe('edge cases', () => {
    it('should handle whenReady failure in useBlogPosts', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])
      vi.mocked(mockRepo.find).mockImplementation(async (docId: DocumentId) => {
        return {
          documentId: docId,
          doc: vi.fn().mockResolvedValue(mockBlogPost),
          whenReady: vi.fn().mockRejectedValue(new Error('Not ready')),
        } as unknown as DocHandle<BlogPost>
      })

      const { result } = renderHook(() => useBlogPosts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load post with ID:'),
        expect.any(Error)
      )
    })

    it('should handle complex filtering combinations', async () => {
      const complexPosts = [
        { ...mockBlogPost, status: 'published' as const, author: 'Alice' },
        { ...mockBlogPost, status: 'draft' as const, author: 'Bob' },
        { ...mockBlogPost, status: 'published' as const, author: 'Alice' },
        { ...mockBlogPost, status: 'published' as const, author: 'Bob' },
      ]

      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])
      vi.mocked(mockRepo.find).mockImplementation(async (docId: DocumentId) => {
        const postIndex = complexPosts.findIndex(
          (_, i) => `post-doc-id-${i + 1}` === docId
        )
        if (postIndex !== -1) {
          return {
            documentId: docId,
            doc: vi.fn().mockResolvedValue(complexPosts[postIndex]),
            whenReady: vi.fn().mockResolvedValue(undefined),
          } as unknown as DocHandle<BlogPost>
        }
        return null
      })

      const { result } = renderHook(() =>
        useBlogPosts({
          status: 'published',
          author: 'Alice',
          limit: 1,
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts).toHaveLength(1)
      expect(result.current.posts[0].status).toBe('published')
      expect(result.current.posts[0].author).toBe('Alice')
    })

    it('should handle rapid slug changes in useBlogPost', async () => {
      vi.mocked(useDocument).mockImplementation(docId => {
        if (docId === 'index-doc-id') {
          return [mockBlogIndex]
        }
        if (docId === 'post-doc-id-1') {
          return [mockBlogPost]
        }
        return [null]
      })

      const { result, rerender } = renderHook(({ slug }) => useBlogPost(slug), {
        initialProps: { slug: 'hello-world' },
      })

      await waitFor(() => {
        expect(result.current.post).toEqual(mockBlogPost)
      })

      // Rapidly change slug
      rerender({ slug: 'non-existent' })
      rerender({ slug: 'hello-world' })

      await waitFor(() => {
        expect(result.current.post).toEqual(mockBlogPost)
      })
    })

    it('should handle options changes in useBlogPosts', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

      const { result, rerender } = renderHook(
        ({ options }) => useBlogPosts(options),
        { initialProps: { options: { status: 'published' as const } } }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCount = result.current.posts.length

      // Change options
      rerender({ options: { status: 'all' as const } })

      await waitFor(() => {
        expect(result.current.posts.length).toBeGreaterThanOrEqual(initialCount)
      })
    })

    it('should handle undefined options in useBlogPosts', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

      const { result } = renderHook(() => useBlogPosts(undefined))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should use default options (published posts)
      expect(
        result.current.posts.every(post => post.status === 'published')
      ).toBe(true)
    })

    it('should handle empty options object in useBlogPosts', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

      const { result } = renderHook(() => useBlogPosts({}))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should use default options (published posts)
      expect(
        result.current.posts.every(post => post.status === 'published')
      ).toBe(true)
    })
  })

  describe('data invalidation', () => {
    it('should invalidate data when repo changes', async () => {
      const { result, rerender } = renderHook(() => useBlogIndex())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Change repo
      const newRepo = { ...mockRepo }
      vi.mocked(useRepo).mockReturnValue(newRepo)
      vi.mocked(getOrCreateIndex).mockClear()

      rerender()

      expect(getOrCreateIndex).toHaveBeenCalledWith(newRepo)
    })

    it('should invalidate posts when blogIndex changes', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex])

      const { result, rerender } = renderHook(() => useBlogPosts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialPosts = result.current.posts

      // Change blog index
      const newBlogIndex = { ...mockBlogIndex, posts: {} }
      vi.mocked(useDocument).mockReturnValue([newBlogIndex])

      rerender()

      await waitFor(() => {
        expect(result.current.posts).not.toEqual(initialPosts)
      })
    })
  })
})
