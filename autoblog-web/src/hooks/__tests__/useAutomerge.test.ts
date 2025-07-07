/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { Repo, DocHandle } from '@automerge/automerge-repo'
import { useRepo, useDocument } from '@automerge/react'
import { getOrCreateIndex } from '../../services/automerge'
import type { BlogPost, BlogIndex } from '../../types'
import { useBlogIndex, useBlogPost, useBlogPosts } from '../useAutomerge'

// Mock external dependencies
vi.mock('@automerge/react')
vi.mock('../../services/automerge')

describe('useAutomerge hooks', () => {
  let mockRepo: Repo
  let mockDocHandle: DocHandle<BlogIndex>
  let mockBlogIndex: BlogIndex
  let mockBlogPost: BlogPost

  beforeEach(() => {
    vi.clearAllMocks()

    mockBlogIndex = {
      posts: {
        'hello-world': 'post-doc-id-1',
        'getting-started': 'post-doc-id-2',
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
    }

    mockDocHandle = {
      documentId: 'index-doc-id',
    } as unknown as DocHandle<BlogIndex>

    mockRepo = {
      find: vi.fn(),
    } as unknown as Repo

    vi.mocked(useRepo).mockReturnValue(mockRepo as any)
    vi.mocked(getOrCreateIndex).mockResolvedValue(mockDocHandle)
  })

  describe('useBlogIndex', () => {
    it('should return blog index when available', async () => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex, vi.fn()] as any)

      const { result } = renderHook(() => useBlogIndex())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.blogIndex).toEqual(mockBlogIndex)
    })

    it('should show loading when blog index is not available', () => {
      vi.mocked(useDocument).mockReturnValue([undefined, vi.fn()] as any)

      const { result } = renderHook(() => useBlogIndex())

      act(() => {
        expect(result.current.isLoading).toBe(true)
        expect(result.current.blogIndex).toBeUndefined()
      })
    })
  })

  describe('useBlogPost', () => {
    it('should return post when found in index', async () => {
      vi.mocked(useDocument).mockImplementation(((docId: any) => {
        const mockChangeDoc = vi.fn()
        if (docId === 'index-doc-id') {
          return [mockBlogIndex, mockChangeDoc]
        }
        if (docId === 'post-doc-id-1') {
          return [mockBlogPost, mockChangeDoc]
        }
        return [undefined, mockChangeDoc]
      }) as any)

      const { result } = renderHook(() => useBlogPost('hello-world'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.post).toEqual(mockBlogPost)
      expect(result.current.notFound).toBe(false)
    })

    it('should return notFound for non-existent slug', async () => {
      vi.mocked(useDocument).mockImplementation(((docId: any) => {
        const mockChangeDoc = vi.fn()
        if (docId === 'index-doc-id') {
          return [mockBlogIndex, mockChangeDoc]
        }
        return [undefined, mockChangeDoc]
      }) as any)

      const { result } = renderHook(() => useBlogPost('non-existent'))

      await waitFor(() => {
        expect(result.current.notFound).toBe(true)
      })

      expect(result.current.post).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('useBlogPosts', () => {
    const mockPosts = [
      { ...mockBlogPost, status: 'published' as const },
      { ...mockBlogPost, slug: 'draft-post', status: 'draft' as const },
    ]

    beforeEach(() => {
      vi.mocked(useDocument).mockReturnValue([mockBlogIndex, vi.fn()] as any)
      vi.mocked(mockRepo.find).mockImplementation((async (docId: any) => {
        const postIndex = mockPosts.findIndex(
          (_, i) => `post-doc-id-${i + 1}` === docId
        )
        if (postIndex !== -1) {
          return {
            doc: vi.fn().mockResolvedValue(mockPosts[postIndex]),
            whenReady: vi.fn().mockResolvedValue(undefined),
          } as unknown as DocHandle<BlogPost>
        }
        return null
      }) as any)
    })

    it('should filter posts by status (published by default)', async () => {
      const { result } = renderHook(() => useBlogPosts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts).toHaveLength(1)
      expect(result.current.posts[0]?.status).toBe('published')
    })

    it('should return all posts when status is "all"', async () => {
      const { result } = renderHook(() => useBlogPosts({ status: 'all' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts).toHaveLength(2)
    })

    it('should filter by author', async () => {
      const postsWithAuthors = [
        { ...mockBlogPost, author: 'Alice', status: 'published' as const },
        { ...mockBlogPost, author: 'Bob', status: 'published' as const },
      ]

      vi.mocked(mockRepo.find).mockImplementation((async (docId: any) => {
        const postIndex = postsWithAuthors.findIndex(
          (_, i) => `post-doc-id-${i + 1}` === docId
        )
        if (postIndex !== -1) {
          return {
            doc: vi.fn().mockResolvedValue(postsWithAuthors[postIndex]),
            whenReady: vi.fn().mockResolvedValue(undefined),
          } as unknown as DocHandle<BlogPost>
        }
        return null
      }) as any)

      const { result } = renderHook(() => useBlogPosts({ author: 'Alice' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts).toHaveLength(1)
      expect(result.current.posts[0]?.author).toBe('Alice')
    })

    it('should limit posts when limit is specified', async () => {
      const { result } = renderHook(() =>
        useBlogPosts({ status: 'all', limit: 1 })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.posts).toHaveLength(1)
    })
  })
})
