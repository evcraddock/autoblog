import { useBlogPosts } from '../hooks/useAutomerge'
import { PostList } from '../components/PostList'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useErrorHandler } from '../hooks/errorHooks'
import { config } from '../config'

export function HomePage() {
  const { posts, isLoading } = useBlogPosts({ status: 'all' })
  const handleError = useErrorHandler()

  return (
    <ErrorBoundary onError={error => handleError(error, 'HomePage')}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Sync Server:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-300">
                {config.syncUrl}
              </span>
            </div>
            <div>
              <span className="font-medium">Index ID:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-300">
                {config.indexId || 'Not specified'}
              </span>
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>
        <PostList posts={posts} isLoading={isLoading} />
      </div>
    </ErrorBoundary>
  )
}
