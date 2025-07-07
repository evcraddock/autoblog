import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Repo } from '@automerge/automerge-repo'
import { initRepo, cleanup, type SyncSource } from '../services/automerge'
import type { AppConfig } from '../types'

// Create our own repo context since we're not using the official hooks package
const RepoContext = createContext<Repo | null>(null)

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
  const [config] = useState<AppConfig>({ ...DEFAULT_CONFIG, ...userConfig })

  useEffect(() => {
    const initializeRepo = async () => {
      try {
        const source: SyncSource = config.syncUrl ? 'remote' : 'local'
        const newRepo = await initRepo(source, config.syncUrl)
        setRepo(newRepo)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Automerge initialization error:', err)
      }
    }

    initializeRepo()
    
    // Cleanup on unmount
    return () => {
      cleanup()
    }
  }, [config.syncUrl])

  return (
    <RepoContext.Provider value={repo}>
      {children}
    </RepoContext.Provider>
  )
}

// Custom useRepo hook
export function useRepo(): Repo | null {
  return useContext(RepoContext)
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