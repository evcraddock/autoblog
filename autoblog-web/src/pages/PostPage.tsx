import { useParams, Link } from 'react-router-dom'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { useBlogPost } from '../hooks/useAutomerge'

export function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { post, notFound } = useBlogPost(slug || '')

  const isLoading = !post && !notFound

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <nav className="mb-8">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Posts
          </Link>
        </nav>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-8 w-1/4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="container mx-auto px-4 py-8">
        <nav className="mb-8">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Posts
          </Link>
        </nav>
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h1 className="text-2xl font-bold mb-2">Post not found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The post &ldquo;{slug}&rdquo; could not be found.
            </p>
            <Link
              to="/"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View all posts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return null
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-8">
        <Link
          to="/"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Posts
        </Link>
      </nav>

      <article className="max-w-4xl mx-auto">
        {/* Post Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400 mb-6">
            <span>By {post.author}</span>
            <span>•</span>
            <time dateTime={post.published.toISOString()}>
              {formatDate(post.published)}
            </time>
            <span>•</span>
            <span
              className={`px-2 py-1 rounded text-sm ${
                post.status === 'published'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}
            >
              {post.status}
            </span>
          </div>

          {post.description && (
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              {post.description}
            </p>
          )}

          {post.imageUrl && (
            <div className="mb-8">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}
        </header>

        {/* Post Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <MarkdownRenderer content={post.content} />
        </div>
      </article>
    </div>
  )
}
