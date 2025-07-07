import { useBlogPosts } from '../hooks/useAutomerge'
import { PostList } from '../components/PostList'

export function HomePage() {
  const { posts, isLoading } = useBlogPosts({ status: 'published' })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>
      <PostList posts={posts} isLoading={isLoading} />
    </div>
  )
}
