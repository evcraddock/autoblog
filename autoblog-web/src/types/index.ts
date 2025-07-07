export interface BlogPost {
  title: string
  author: string
  published: Date
  status: 'draft' | 'published'
  slug: string
  description: string
  content: string
  imageUrl?: string
}

export interface BlogIndex {
  posts: Record<string, string>
  lastUpdated: Date
}

export interface AppConfig {
  syncUrl: string
  theme: 'light' | 'dark' | 'system'
}

export interface AutomergeState {
  isLoading: boolean
  error?: string
  posts: BlogPost[]
  blogIndex?: BlogIndex
}
