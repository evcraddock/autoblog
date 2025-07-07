import { useParams, Link } from 'react-router-dom'
import MarkdownRenderer from '../components/MarkdownRenderer'

export function PostPage() {
  const { slug } = useParams<{ slug: string }>()

  const sampleContent = `# Sample Blog Post

This is a sample blog post for the slug: **${slug}**

## Features

- Dynamic routing based on URL slug
- Hash-based routing for SPA navigation
- Browser back/forward button support

## Implementation

This page demonstrates how the routing system extracts parameters from the URL and displays content accordingly.

In a real implementation, this would:
1. Fetch the blog post data based on the slug
2. Handle loading states
3. Handle errors for non-existent posts
4. Display the actual post content
`

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
      <article className="prose prose-lg dark:prose-invert max-w-none">
        <MarkdownRenderer content={sampleContent} />
      </article>
    </div>
  )
}
