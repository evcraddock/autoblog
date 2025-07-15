import express from 'express'
import { createServer as createViteServer } from 'vite'
import fs from 'fs'

async function createDevServer() {
  const app = express()

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })

  // Use vite's connect instance as middleware
  app.use(vite.middlewares)

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

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl

    try {
      // Get the index.html template
      let template = fs.readFileSync('index.html', 'utf-8')
      template = await vite.transformIndexHtml(url, template)

      // Render the app HTML using SSR entry
      const { render } = await vite.ssrLoadModule('/src/entry-server.tsx')
      const appHtml = await render(url)

      // Inject rendered app into template
      const html = template.replace('<!--ssr-outlet-->', appHtml)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite.ssrFixStacktrace(e)
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
    console.log(`🚀 SSR Dev server running at http://localhost:${port}`)
  })
})
