// Runtime configuration helper
declare global {
  interface Window {
    _env_?: {
      REACT_APP_AUTOBLOG_SYNC_URL?: string
      REACT_APP_AUTOBLOG_INDEX_ID?: string
    }
  }
}

export const getRuntimeConfig = () => {
  // In development, use process.env
  if (import.meta.env.DEV) {
    console.log('DEV mode - env vars:', {
      VITE_APP_AUTOBLOG_SYNC_URL: import.meta.env.VITE_APP_AUTOBLOG_SYNC_URL,
      VITE_APP_AUTOBLOG_INDEX_ID: import.meta.env.VITE_APP_AUTOBLOG_INDEX_ID,
    })
    return {
      syncUrl:
        import.meta.env.VITE_APP_AUTOBLOG_SYNC_URL ||
        'wss://sync.automerge.org',
      indexId: import.meta.env.VITE_APP_AUTOBLOG_INDEX_ID || '',
    }
  }

  // In production, use window._env_ (injected by Docker)
  return {
    syncUrl:
      window._env_?.REACT_APP_AUTOBLOG_SYNC_URL || 'wss://sync.automerge.org',
    indexId: window._env_?.REACT_APP_AUTOBLOG_INDEX_ID || '',
  }
}
