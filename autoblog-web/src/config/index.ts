import { getRuntimeConfig } from './runtime'

// Create config as a getter to ensure runtime config is evaluated when accessed
export const config = {
  get syncUrl() {
    return getRuntimeConfig().syncUrl
  },
  get databaseName() {
    return import.meta.env.AUTOBLOG_DB_NAME || 'autoblog-web'
  },
  get indexId() {
    return getRuntimeConfig().indexId
  },
}
