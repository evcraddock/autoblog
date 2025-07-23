import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

// Load environment variables from .env file in development
config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'

// Get runtime configuration from environment
function getRuntimeConfig() {
  const syncUrl = process.env.AUTOBLOG_SYNC_URL
  const indexId = process.env.AUTOBLOG_INDEX_ID

  if (!syncUrl) {
    throw new Error('AUTOBLOG_SYNC_URL environment variable is required')
  }

  if (!indexId) {
    throw new Error('AUTOBLOG_INDEX_ID environment variable is required')
  }

  return {
    syncUrl,
    indexId,
  }
}

// Inject configuration into HTML
function injectConfig(html) {
  const config = getRuntimeConfig()
  const configScript = `<script>window.__AUTOBLOG_CONFIG__ = ${JSON.stringify(config)};</script>`
  return html.replace('</head>', `${configScript}</head>`)
}

async function createServer() {
  const app = express()

  if (isProduction) {
    // Production: serve pre-built files
    app.use(
      '/assets',
      express.static(path.resolve(__dirname, 'dist/assets'), {
        maxAge: '1y',
        immutable: true,
      })
    )

    app.use(express.static(path.resolve(__dirname, 'dist'), { index: false }))

    const template = fs.readFileSync(
      path.resolve(__dirname, 'dist/index.html'),
      'utf-8'
    )

    app.use('*', (req, res) => {
      const html = injectConfig(template)
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    })
  } else {
    // Development: use Vite dev server
    const { createServer: createViteServer } = await import('vite')
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    })

    app.use(vite.middlewares)

    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl
        let template = fs.readFileSync('index.html', 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        const html = injectConfig(template)

        res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
      } catch (e) {
        vite.ssrFixStacktrace(e)
        // eslint-disable-next-line no-console
        console.error(e)
        next(e)
      }
    })
  }

  return app
}

const port = process.env.PORT || 3000

createServer().then(app => {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Server running at http://localhost:${port}`)
  })
})
