export const config = {
  syncUrl: import.meta.env.APP_AUTOBLOG_SYNC_URL || 'wss://sync.automerge.org',
  databaseName: import.meta.env.APP_AUTOBLOG_DB_NAME || 'autoblog-web',
  // Optional: Specific index ID to use (for CLI integration)
  indexId: import.meta.env.APP_AUTOBLOG_INDEX_ID || undefined,
}
