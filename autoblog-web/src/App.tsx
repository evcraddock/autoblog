import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AutomergeProvider } from './contexts/AutomergeContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ErrorProvider } from './contexts/ErrorContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ErrorToastContainer } from './components/ErrorToast'
import { config } from './config'
import type { AppConfig } from './types'

function App() {
  // Create AppConfig from runtime config
  const appConfig: AppConfig = {
    syncUrl: config.syncUrl,
    theme: 'system',
    indexId: config.indexId,
  }

  // Debug logging removed for production

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ErrorProvider>
          <AutomergeProvider config={appConfig}>
            <RouterProvider router={router} />
            <ErrorToastContainer />
          </AutomergeProvider>
        </ErrorProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
