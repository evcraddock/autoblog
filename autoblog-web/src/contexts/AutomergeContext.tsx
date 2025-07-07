import React, { useEffect, useState, ReactNode } from 'react'
import {
  Repo,
  RepoContext,
  WebSocketClientAdapter,
  IndexedDBStorageAdapter,
} from '@automerge/react'
import { cleanup } from '../services/automerge'
import type { AppConfig } from '../types'

interface AutomergeProviderProps {
  children: ReactNode
  config?: Partial<AppConfig>
}

const DEFAULT_CONFIG: AppConfig = {
  syncUrl: 'wss://sync.automerge.org',
  theme: 'system',
}

export function AutomergeProvider({
  children,
  config: userConfig,
}: AutomergeProviderProps) {
  const [repo, setRepo] = useState<Repo | null>(null)
  const [config] = useState<AppConfig>({ ...DEFAULT_CONFIG, ...userConfig })

  useEffect(() => {
    const initializeRepo = () => {
      try {
        // Use the simplified meta-package approach
        const repoConfig: {
          storage: IndexedDBStorageAdapter
          network?: WebSocketClientAdapter[]
        } = {
          storage: new IndexedDBStorageAdapter('autoblog-web'),
        }

        if (config.syncUrl) {
          repoConfig.network = [new WebSocketClientAdapter(config.syncUrl)]
        }

        const newRepo = new Repo(repoConfig)
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

  return <RepoContext.Provider value={repo}>{children}</RepoContext.Provider>
}

// Re-export the official useRepo hook from meta-package
// eslint-disable-next-line react-refresh/only-export-components
export { useRepo } from '@automerge/react'

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
