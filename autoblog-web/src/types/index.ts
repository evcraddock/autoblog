export interface BlogPost {
  id: string
  title: string
  author: string
  publishedAt: string
  status: 'draft' | 'published'
  slug: string
  description?: string
  content: string
  imageUrl?: string
}

export interface BlogIndex {
  [slug: string]: string // slug -> document ID mapping
}

export interface AppConfig {
  syncUrl: string
  theme: 'light' | 'dark' | 'system'
}
