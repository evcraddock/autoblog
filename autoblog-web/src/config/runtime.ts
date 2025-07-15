// Runtime configuration helper
declare global {
  interface Window {
    _env_?: {
      AUTOBLOG_SYNC_URL?: string
      AUTOBLOG_INDEX_ID?: string
    }
  }
}

let configCache: { syncUrl: string; indexId: string } | null = null

export const getRuntimeConfig = () => {
  // Return cached config if available
  if (configCache) {
    return configCache
  }

  // In development, use process.env
  if (import.meta.env.DEV) {
    configCache = {
      syncUrl: import.meta.env.VITE_AUTOBLOG_SYNC_URL || 'ws://localhost:3030',
      indexId: import.meta.env.VITE_AUTOBLOG_INDEX_ID || '',
    }
    return configCache
  }

  // In production with SSR, fetch config from server
  if (typeof window === 'undefined') {
    // Server-side rendering - use environment variables
    configCache = {
      syncUrl: process.env.AUTOBLOG_SYNC_URL || 'ws://localhost:3030',
      indexId: process.env.AUTOBLOG_INDEX_ID || '',
    }
    return configCache
  }

  // Client-side in production - fetch from API
  // For now, use fallback values until hydration completes
  configCache = {
    syncUrl: 'ws://localhost:3030',
    indexId: '',
  }

  // Fetch real config from server
  fetch('/api/config')
    .then(res => res.json())
    .then(config => {
      configCache = {
        syncUrl: config.syncUrl,
        indexId: config.indexId,
      }
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch runtime config:', error)
    })

  return configCache
}
