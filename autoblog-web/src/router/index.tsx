import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { HomePage } from '../pages/HomePage'
import { PostPage } from '../pages/PostPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: '404',
        element: <NotFoundPage />,
      },
      {
        path: ':slug',
        element: <PostPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
