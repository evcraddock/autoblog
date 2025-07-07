import { useState, useEffect, useCallback } from 'react'
import {
  getAllBlogPosts,
  getBlogPostBySlug,
  getBlogIndex,
  getConnectionStatus,
  cleanup,
  type SyncSource
} from '../services/automerge'
import type { BlogPost, ConnectionStatus, AutomergeState } from '../types'

/**
 * Custom hook for managing Automerge state and blog posts
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'remote'
 * @param syncUrl - WebSocket URL for sync server
 * @returns AutomergeState and methods for interacting with blog data
 */
export function useAutomerge(
  source: SyncSource = 'remote',
  syncUrl?: string
) {
  const [state, setState] = useState<AutomergeState>({
    isLoading: true,
    posts: [],
    connectionStatus: {
      isConnected: false,
      isConnecting: false
    }
  })

  const [refreshCounter, setRefreshCounter] = useState(0)

  // Update connection status
  const updateConnectionStatus = useCallback(async () => {
    try {
      const isConnected = await getConnectionStatus()
      setState(prev => ({
        ...prev,
        connectionStatus: {
          ...prev.connectionStatus,
          isConnected,
          isConnecting: false
        }
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        connectionStatus: {
          ...prev.connectionStatus,
          isConnected: false,
          isConnecting: false,
          lastError: error instanceof Error ? error.message : 'Connection check failed'
        }
      }))
    }
  }, [])

  // Load all blog posts
  const loadPosts = useCallback(async () => {
    try {
      setState(prev => ({ 
        ...prev, 
        isLoading: true 
      }))
      
      const posts = await getAllBlogPosts(source, syncUrl)
      const blogIndex = await getBlogIndex(source, syncUrl)
      
      setState(prev => ({
        ...prev,
        posts,
        ...(blogIndex && { blogIndex }),
        isLoading: false
      }))
      
      // Clear error on successful load
      setState(prev => {
        if (prev.error) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { error, ...rest } = prev
          return rest as AutomergeState
        }
        return prev
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load posts'
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, syncUrl, refreshCounter]) // refreshCounter is intentionally included to trigger re-fetch

  // Refresh data
  const refresh = useCallback(() => {
    setRefreshCounter(prev => prev + 1)
  }, [])

  // Initialize and load data
  useEffect(() => {
    loadPosts()
    updateConnectionStatus()
  }, [loadPosts, updateConnectionStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  return {
    ...state,
    refresh,
    updateConnectionStatus
  }
}

/**
 * Custom hook for getting a single blog post by slug
 * @param slug - The slug of the blog post to retrieve
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'remote'
 * @param syncUrl - WebSocket URL for sync server
 * @returns Blog post data and loading state
 */
export function useBlogPost(
  slug: string,
  source: SyncSource = 'remote',
  syncUrl?: string
) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    let mounted = true

    const loadPost = async () => {
      try {
        setIsLoading(true)
        setError(undefined)
        
        const blogPost = await getBlogPostBySlug(slug, source, syncUrl)
        
        if (mounted) {
          setPost(blogPost)
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load post')
          setIsLoading(false)
        }
      }
    }

    loadPost()

    return () => {
      mounted = false
    }
  }, [slug, source, syncUrl])

  return { post, isLoading, error }
}

/**
 * Custom hook for getting multiple blog posts with filtering and sorting
 * @param options - Configuration options for post retrieval
 * @returns Filtered and sorted blog posts
 */
export function useBlogPosts(options: {
  source?: SyncSource
  syncUrl?: string
  status?: 'draft' | 'published' | 'all'
  limit?: number
  author?: string
} = {}) {
  const {
    source = 'remote',
    syncUrl,
    status = 'published',
    limit,
    author
  } = options

  const { posts, isLoading, error, refresh } = useAutomerge(source, syncUrl)

  const filteredPosts = posts
    .filter(post => {
      // Filter by status
      if (status !== 'all' && post.status !== status) {
        return false
      }
      
      // Filter by author
      if (author && post.author !== author) {
        return false
      }
      
      return true
    })
    .slice(0, limit)

  return {
    posts: filteredPosts,
    isLoading,
    error,
    refresh
  }
}

/**
 * Custom hook for connection status monitoring
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'remote'
 * @param syncUrl - WebSocket URL for sync server
 * @returns Connection status and management functions
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isConnecting: false
  })

  const checkConnection = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, isConnecting: true }))
      
      const isConnected = await getConnectionStatus()
      
      setStatus({
        isConnected,
        isConnecting: false
      })
    } catch (error) {
      setStatus({
        isConnected: false,
        isConnecting: false,
        lastError: error instanceof Error ? error.message : 'Connection check failed'
      })
    }
  }, [])

  useEffect(() => {
    checkConnection()
    
    // Check connection status periodically
    const interval = setInterval(checkConnection, 10000) // Check every 10 seconds
    
    return () => clearInterval(interval)
  }, [checkConnection])

  return {
    ...status,
    checkConnection
  }
}