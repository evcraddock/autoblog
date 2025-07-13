// Runtime configuration helper
declare global {
  interface Window {
    _env_?: {
      AUTOBLOG_SYNC_URL?: string
      AUTOBLOG_INDEX_ID?: string
    }
  }
}

export const getRuntimeConfig = () => {
  // In development, use process.env
  if (import.meta.env.DEV) {
    // Development mode - using env vars
    return {
      syncUrl: import.meta.env.VITE_AUTOBLOG_SYNC_URL || 'ws://localhost:3030',
      indexId: import.meta.env.VITE_AUTOBLOG_INDEX_ID || '',
    }
  }

  // In production, use window._env_ (injected by Docker)
  return {
    syncUrl: window._env_?.AUTOBLOG_SYNC_URL || 'ws://localhost:3030',
    indexId: window._env_?.AUTOBLOG_INDEX_ID || '',
  }
}
