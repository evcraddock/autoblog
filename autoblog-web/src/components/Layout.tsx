import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { SkipLink } from './SkipLink'

export function Layout() {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark')
  })
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const previousPathRef = useRef(location.pathname)

  const toggleTheme = () => {
    setIsDark(!isDark)
    if (!isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Focus management and route announcements
  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      // Focus main content on route change
      if (mainRef.current) {
        mainRef.current.focus()
      }

      // Announce route change to screen readers
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'

      let message = 'Navigated to '
      if (location.pathname === '/') {
        message += 'home page'
      } else if (location.pathname === '/404') {
        message += 'page not found'
      } else {
        message += `blog post ${location.pathname.substring(1)}`
      }

      announcement.textContent = message
      document.body.appendChild(announcement)

      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)

      previousPathRef.current = location.pathname
    }
  }, [location])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <SkipLink />
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

      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 focus:outline-none"
      >
        <Outlet />
      </main>
    </div>
  )
}
