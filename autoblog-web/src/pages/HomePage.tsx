import { useBlogPosts } from '../hooks/useAutomerge'
import { PostList } from '../components/PostList'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useErrorHandler } from '../contexts/ErrorContext'

export function HomePage() {
  const { posts, isLoading } = useBlogPosts({ status: 'all' })
  const handleError = useErrorHandler()

  return (
    <ErrorBoundary onError={error => handleError(error, 'HomePage')}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>
        <PostList posts={posts} isLoading={isLoading} />
      </div>
    </ErrorBoundary>
  )
}
