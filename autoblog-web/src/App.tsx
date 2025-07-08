import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AutomergeProvider } from './contexts/AutomergeContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ErrorProvider } from './contexts/ErrorContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ErrorToastContainer } from './components/ErrorToast'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ErrorProvider>
          <AutomergeProvider>
            <RouterProvider router={router} />
            <ErrorToastContainer />
          </AutomergeProvider>
        </ErrorProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
