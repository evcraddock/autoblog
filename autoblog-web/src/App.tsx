import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import MarkdownRenderer from './components/MarkdownRenderer'

function App() {
  const [isDark, setIsDark] = useState(false)

  const toggleTheme = () => {
    setIsDark(!isDark)
    if (!isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <header className="border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Autoblog
              </h1>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                Web Viewer
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Autoblog Web Viewer
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            A local-first blog platform built on Automerge CRDT technology. This
            web viewer provides a modern interface for reading and exploring
            blog posts synchronized across devices.
          </p>

          <div className="space-y-6">
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
                Markdown Renderer Demo
              </h3>
              <p className="text-primary-700 dark:text-primary-300 text-sm mb-4">
                Testing the markdown rendering system with syntax highlighting, tables, and links.
              </p>
              
              <MarkdownRenderer 
                content={`# Sample Blog Post

Welcome to the **Autoblog** markdown rendering system! This demonstrates various markdown features:

## Code Blocks

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}
\`\`\`

## Lists and Links

- [Internal link](#section)
- [External link](https://example.com)
- **Bold text** and *italic text*
- Inline \`code\` formatting

## Table Example

| Feature | Status | Notes |
|---------|--------|-------|
| Syntax highlighting | ✅ | Works with multiple languages |
| Link security | ✅ | External links open safely |
| Image lazy loading | ✅ | Optimized performance |

> This is a blockquote demonstrating styled content rendering.

The system handles XSS prevention and provides a clean, accessible reading experience.`}
                isDark={isDark}
                className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
