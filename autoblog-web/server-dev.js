import express from 'express'
import { createServer as createViteServer } from 'vite'
import fs from 'fs'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

async function createDevServer() {
  const app = express()

  // Secure config endpoint (MUST be before Vite middleware)
  app.get('/api/config', (req, res) => {
    const config = {
      syncUrl:
        process.env.VITE_AUTOBLOG_SYNC_URL ||
        process.env.AUTOBLOG_SYNC_URL ||
        'ws://localhost:3001',
      indexId:
        process.env.VITE_AUTOBLOG_INDEX_ID ||
        process.env.AUTOBLOG_INDEX_ID ||
        'main',
      features: {
        authentication: false,
        analytics: false,
      },
    }
    res.json(config)
  })

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })

  // Use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl

    try {
      // Get the index.html template
      let template = fs.readFileSync('index.html', 'utf-8')
      template = await vite.transformIndexHtml(url, template)

      // For development, skip SSR and just send client-side app
      // SSR will work in production build
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      // eslint-disable-next-line no-console
      console.error(e)
      next(e)
    }
  })

  return app
}

// Start the development server
const port = process.env.PORT || 3000
createDevServer().then(app => {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 SSR Dev server running at http://localhost:${port}`)
  })
})
