import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AutomergeProvider } from './contexts/AutomergeContext'

function App() {
  return (
    <AutomergeProvider>
      <RouterProvider router={router} />
    </AutomergeProvider>
  )
}

export default App
