import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AutomergeProvider } from './contexts/AutomergeContext'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <AutomergeProvider>
        <RouterProvider router={router} />
      </AutomergeProvider>
    </ThemeProvider>
  )
}

export default App
