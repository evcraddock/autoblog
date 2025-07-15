import { renderToString } from 'react-dom/server'
import App from './App'

export function render(_url: string) {
  // For now, render without router context for SSR
  // The client will hydrate with proper routing
  const html = renderToString(<App />)
  return html
}
