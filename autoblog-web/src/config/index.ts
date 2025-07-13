import { getRuntimeConfig } from './runtime'

// Create config as a getter to ensure runtime config is evaluated when accessed
export const config = {
  get syncUrl() {
    return getRuntimeConfig().syncUrl
  },
  get databaseName() {
    return import.meta.env.AUTOBLOG_DB_NAME || 'autoblog-web'
  },
  // Optional: Specific index ID to use (for CLI integration)
  get indexId() {
    return getRuntimeConfig().indexId || undefined
  },
}
