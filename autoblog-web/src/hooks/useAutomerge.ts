import { useState, useEffect, useCallback } from 'react'
import { useRepo } from '../contexts/AutomergeContext'
import { getOrCreateIndex, findPostBySlug } from '../services/automerge'
import type { BlogPost, BlogIndex } from '../types'

/**
 * Hook to get all blog posts using the repository directly
 * This is simpler than trying to use the individual document hooks
 * until we understand the v2.0 API better
 */
export function useBlogPosts(options: {
  status?: 'draft' | 'published' | 'all'
  limit?: number
  author?: string
} = {}) {
  const { status = 'published', limit, author } = options
  const repo = useRepo()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [blogIndex, setBlogIndex] = useState<BlogIndex | null>(null)

  const loadPosts = useCallback(async () => {
    if (!repo) return

    try {
      setIsLoading(true)
      
      // Get the blog index
      const indexHandle = await getOrCreateIndex(repo)
      const index = await indexHandle.doc()
      setBlogIndex(index)

      if (!index?.posts || Object.keys(index.posts).length === 0) {
        setPosts([])
        setIsLoading(false)
        return
      }

      // Load all posts
      const loadedPosts: BlogPost[] = []
      for (const [slug, docId] of Object.entries(index.posts)) {
        try {
          const postHandle = await repo.find<BlogPost>(docId as any)
          if (!postHandle) continue

          await postHandle.whenReady()
          const post = await postHandle.doc()
          if (post) {
            loadedPosts.push(post)
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Failed to load post with slug: ${slug}`)
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
  }, [repo, status, limit, author])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  return {
    posts,
    isLoading,
    blogIndex,
    refresh: loadPosts
  }
}

/**
 * Hook to get a single blog post by slug
 */
export function useBlogPost(slug: string) {
  const repo = useRepo()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadPost = async () => {
      if (!repo || !slug) return

      try {
        setIsLoading(true)
        setNotFound(false)

        // Get the blog index
        const indexHandle = await getOrCreateIndex(repo)
        const postDocumentId = await findPostBySlug(indexHandle, slug)

        if (!postDocumentId) {
          if (mounted) {
            setNotFound(true)
            setIsLoading(false)
          }
          return
        }

        // Get the post document
        const postHandle = await repo.find<BlogPost>(postDocumentId as any)
        if (!postHandle) {
          if (mounted) {
            setNotFound(true)
            setIsLoading(false)
          }
          return
        }

        await postHandle.whenReady()
        const postData = await postHandle.doc()

        if (mounted) {
          setPost(postData || null)
          setIsLoading(false)
        }
      } catch (error) {
        if (mounted) {
          // eslint-disable-next-line no-console
          console.error('Failed to load post:', error)
          setIsLoading(false)
        }
      }
    }

    loadPost()

    return () => {
      mounted = false
    }
  }, [repo, slug])

  return {
    post,
    isLoading,
    notFound
  }
}

/**
 * Hook to get the blog index
 */
export function useBlogIndex() {
  const repo = useRepo()
  const [blogIndex, setBlogIndex] = useState<BlogIndex | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadIndex = async () => {
      if (!repo) return

      try {
        setIsLoading(true)
        const indexHandle = await getOrCreateIndex(repo)
        const index = await indexHandle.doc()

        if (mounted) {
          setBlogIndex(index || null)
          setIsLoading(false)
        }
      } catch (error) {
        if (mounted) {
          // eslint-disable-next-line no-console
          console.error('Failed to load blog index:', error)
          setIsLoading(false)
        }
      }
    }

    loadIndex()

    return () => {
      mounted = false
    }
  }, [repo])

  return {
    blogIndex,
    isLoading
  }
}