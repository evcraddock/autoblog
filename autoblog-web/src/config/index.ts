export const config = {
  syncUrl: import.meta.env.APP_AUTOBLOG_SYNC_URL || 'wss://sync.automerge.org',
  databaseName: import.meta.env.APP_AUTOBLOG_DB_NAME || 'autoblog-web',
  cliIndexId:
    import.meta.env.APP_AUTOBLOG_CLI_INDEX_ID || '5yuf2779r3W6ntgFZgzR6S6RKiW',
}
