import { Link } from 'react-router-dom'
import { BlogPost } from '../types'

interface PostCardProps {
  post: BlogPost
  viewMode: 'grid' | 'list'
}

export function PostCard({ post, viewMode }: PostCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const cardClasses =
    viewMode === 'grid'
      ? 'border rounded-lg p-6 hover:shadow-lg transition-shadow h-full flex flex-col'
      : 'border rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col sm:flex-row gap-4'

  return (
    <article className={cardClasses}>
      {post.imageUrl && (
        <div className={viewMode === 'grid' ? 'mb-4' : 'sm:w-48 flex-shrink-0'}>
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-48 object-cover rounded-md"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex-1">
        <header className="mb-3">
          <h2 className="text-xl font-semibold mb-2">
            <Link
              to={`/${post.slug}`}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
            >
              {post.title}
            </Link>
          </h2>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>By {post.author}</span>
            <span>•</span>
            <time dateTime={post.published.toISOString()}>
              {formatDate(post.published)}
            </time>
            <span>•</span>
            <span
              className={`px-2 py-1 rounded text-xs ${
                post.status === 'published'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}
            >
              {post.status}
            </span>
          </div>
        </header>

        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
          {post.description}
        </p>

        <Link
          to={`/${post.slug}`}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          Read more →
        </Link>
      </div>
    </article>
  )
}
