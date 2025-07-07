import { useState, useEffect, useCallback } from 'react'
import { useRepo, useDocument } from '@automerge/react'
import { DocumentId } from '@automerge/react'
import { getOrCreateIndex } from '../services/automerge'
import type { BlogPost, BlogIndex } from '../types'

/**
 * Hook to get the blog index using Suspense for smooth loading
 * NOTE: This requires the component to be wrapped in a Suspense boundary
 */
export function useBlogIndexSuspense(indexId: DocumentId) {
  // Use suspense for smooth loading experience
  const [blogIndex] = useDocument<BlogIndex>(indexId, { suspense: true })

  return {
    blogIndex
  }
}

/**
 * Hook to get a single blog post by slug using Suspense
 * NOTE: This requires the component to be wrapped in a Suspense boundary
 */
export function useBlogPostSuspense(postId: DocumentId) {
  // Use suspense for smooth loading experience
  const [post] = useDocument<BlogPost>(postId, { suspense: true })

  return {
    post
  }
}

/**
 * Regular hooks (non-suspense) for backwards compatibility
 */
export function useBlogIndex() {
  const repo = useRepo()
  const [indexId, setIndexId] = useState<DocumentId | undefined>()
  
  const [blogIndex] = useDocument<BlogIndex>(indexId)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!repo) return

    const loadIndex = async () => {
      try {
        const handle = await getOrCreateIndex(repo)
        setIndexId(handle.documentId)
        setIsLoading(false)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load index:', error)
        setIsLoading(false)
      }
    }

    loadIndex()
  }, [repo])

  return {
    blogIndex,
    isLoading: isLoading || !blogIndex
  }
}

/**
 * Hook to get a single blog post by slug (non-suspense)
 */
export function useBlogPost(slug: string) {
  const repo = useRepo()
  const { blogIndex } = useBlogIndex()
  const [postId, setPostId] = useState<DocumentId | undefined>()
  
  const [post] = useDocument<BlogPost>(postId)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!repo || !blogIndex || !slug) return

    const postDocId = blogIndex?.posts?.[slug]
    if (!postDocId) {
      setNotFound(true)
      return
    }

    setPostId(postDocId as DocumentId)
    setNotFound(false)
  }, [repo, blogIndex, slug])

  return {
    post,
    isLoading: !post && !notFound,
    notFound
  }
}

/**
 * Hook to get all blog posts (non-suspense)
 */
export function useBlogPosts(options: {
  status?: 'draft' | 'published' | 'all'
  limit?: number
  author?: string
} = {}) {
  const { status = 'published', limit, author } = options
  const repo = useRepo()
  const { blogIndex, isLoading: indexLoading } = useBlogIndex()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (indexLoading || !blogIndex || !repo) return

    setIsLoading(true)
    
    const loadPosts = async () => {
      try {
        const loadedPosts: BlogPost[] = []
        const postIds = Object.values(blogIndex?.posts || {})
        
        for (const docId of postIds) {
          try {
            const handle = await repo.find<BlogPost>(docId as DocumentId)
            if (!handle) continue

            await handle.whenReady()
            const postDoc = await handle.doc()
            if (postDoc) {
              loadedPosts.push(postDoc)
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Failed to load post with ID: ${docId}`, error)
          }
        }

        // Filter and sort posts
        const filteredPosts = loadedPosts
          .filter(post => {
            if (status !== 'all' && post.status !== status) return false
            if (author && post.author !== author) return false
            return true
          })
          .sort((a, b) => {
            const dateA = new Date(a.published).getTime()
            const dateB = new Date(b.published).getTime()
            return dateB - dateA
          })

        setPosts(limit ? filteredPosts.slice(0, limit) : filteredPosts)
        setIsLoading(false)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load posts:', error)
        setIsLoading(false)
      }
    }

    loadPosts()
  }, [repo, indexLoading, blogIndex, status, limit, author])

  const refresh = useCallback(async () => {
    if (!repo || !blogIndex) return
    
    // Force reload posts
    setIsLoading(true)
    
    const loadPosts = async () => {
      try {
        const loadedPosts: BlogPost[] = []
        const postIds = Object.values(blogIndex?.posts || {})
        
        for (const docId of postIds) {
          try {
            const handle = await repo.find<BlogPost>(docId as DocumentId)
            if (!handle) continue

            await handle.whenReady()
            const postDoc = await handle.doc()
            if (postDoc) {
              loadedPosts.push(postDoc)
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Failed to load post with ID: ${docId}`, error)
          }
        }

        // Filter and sort posts
        const filteredPosts = loadedPosts
          .filter(post => {
            if (status !== 'all' && post.status !== status) return false
            if (author && post.author !== author) return false
            return true
          })
          .sort((a, b) => {
            const dateA = new Date(a.published).getTime()
            const dateB = new Date(b.published).getTime()
            return dateB - dateA
          })

        setPosts(limit ? filteredPosts.slice(0, limit) : filteredPosts)
        setIsLoading(false)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load posts:', error)
        setIsLoading(false)
      }
    }

    await loadPosts()
  }, [repo, blogIndex, status, limit, author])

  return {
    posts,
    isLoading,
    blogIndex,
    refresh
  }
}