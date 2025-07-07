import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>
      <div className="space-y-4">
        <article className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold mb-2">
            <Link
              to="/sample-post"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sample Blog Post
            </Link>
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This is a placeholder for blog post listing. In a real
            implementation, this would fetch and display actual blog posts.
          </p>
        </article>
      </div>
    </div>
  )
}
