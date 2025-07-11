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
