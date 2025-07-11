import { getRuntimeConfig } from './runtime'

const runtimeConfig = getRuntimeConfig()

export const config = {
  syncUrl: runtimeConfig.syncUrl,
  databaseName: import.meta.env.APP_AUTOBLOG_DB_NAME || 'autoblog-web',
  // Optional: Specific index ID to use (for CLI integration)
  indexId: runtimeConfig.indexId || undefined,
}
