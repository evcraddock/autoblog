import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

// Serve static assets with caching
app.use(
  '/assets',
  express.static(path.resolve(__dirname, 'dist/client/assets'), {
    maxAge: '1y',
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache')
      }
    },
  })
)

// Serve other static files
app.use(
  express.static(path.resolve(__dirname, 'dist/client'), { index: false })
)

// Secure config endpoint
app.get('/api/config', (req, res) => {
  const config = {
    syncUrl: process.env.AUTOBLOG_SYNC_URL || 'ws://localhost:3001',
    indexId: process.env.AUTOBLOG_INDEX_ID || 'main',
    features: {
      authentication: false,
      analytics: false,
    },
  }
  res.json(config)
})

// Load production assets
const template = fs.readFileSync(
  path.resolve(__dirname, 'dist/client/index.html'),
  'utf-8'
)

// Import the SSR handler
const { render } = await import('./dist/server/entry-server.js')

app.use('*', async (req, res) => {
  try {
    const url = req.originalUrl
    const appHtml = await render(url)
    const html = template.replace('<!--ssr-outlet-->', appHtml)

    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  } catch (e) {
    console.error(e)
    res.status(500).end(e.message)
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`🚀 SSR Production server running at http://localhost:${port}`)
})
