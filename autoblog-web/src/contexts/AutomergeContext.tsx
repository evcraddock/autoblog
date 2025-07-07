import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Repo } from '@automerge/automerge-repo'
import { initRepo, cleanup, type SyncSource } from '../services/automerge'
import type { AppConfig } from '../types'

interface AutomergeContextType {
  repo: Repo | null
  isInitialized: boolean
  isConnecting: boolean
  error: string | null
  config: AppConfig
  reconnect: () => Promise<void>
}

const AutomergeContext = createContext<AutomergeContextType | undefined>(undefined)

interface AutomergeProviderProps {
  children: ReactNode
  config?: Partial<AppConfig>
}

const DEFAULT_CONFIG: AppConfig = {
  syncUrl: 'wss://sync.automerge.org',
  theme: 'system'
}

export function AutomergeProvider({ children, config: userConfig }: AutomergeProviderProps) {
  const [repo, setRepo] = useState<Repo | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config] = useState<AppConfig>({ ...DEFAULT_CONFIG, ...userConfig })

  const initializeRepo = async (isReconnect = false) => {
    try {
      setIsConnecting(true)
      setError(null)
      
      if (isReconnect && repo) {
        await cleanup()
        setRepo(null)
      }
      
      const source: SyncSource = config.syncUrl ? 'remote' : 'local'
      const newRepo = await initRepo(source, config.syncUrl)
      
      setRepo(newRepo)
      setIsInitialized(true)
      setIsConnecting(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Automerge repository'
      setError(errorMessage)
      setIsConnecting(false)
      // eslint-disable-next-line no-console
      console.error('Automerge initialization error:', err)
    }
  }

  const reconnect = async () => {
    await initializeRepo(true)
  }

  useEffect(() => {
    initializeRepo()
    
    // Cleanup on unmount
    return () => {
      cleanup()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle network connection changes
  useEffect(() => {
    const handleOnline = () => {
      if (!isInitialized && !isConnecting) {
        initializeRepo(true)
      }
    }

    const handleOffline = () => {
      setError('Network connection lost')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, isConnecting])

  const value: AutomergeContextType = {
    repo,
    isInitialized,
    isConnecting,
    error,
    config,
    reconnect
  }

  return (
    <AutomergeContext.Provider value={value}>
      {children}
    </AutomergeContext.Provider>
  )
}

export function useAutomergeContext() {
  const context = useContext(AutomergeContext)
  if (context === undefined) {
    throw new Error('useAutomergeContext must be used within an AutomergeProvider')
  }
  return context
}

// Higher-order component for components that need Automerge context
// eslint-disable-next-line react-refresh/only-export-components
export function withAutomerge<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AutomergeWrappedComponent(props: P) {
    return (
      <AutomergeProvider>
        <Component {...props} />
      </AutomergeProvider>
    )
  }
}