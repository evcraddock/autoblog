// Runtime configuration helper
declare global {
  interface Window {
    __AUTOBLOG_CONFIG__?: {
      syncUrl: string
      indexId: string
    }
  }
}

export const getRuntimeConfig = () => {
  // Use server-injected config if available
  if (typeof window !== 'undefined' && window.__AUTOBLOG_CONFIG__) {
    return window.__AUTOBLOG_CONFIG__
  }

  // No defaults - configuration must be provided
  throw new Error(
    'Configuration not found. Please ensure environment variables are set.'
  )
}
