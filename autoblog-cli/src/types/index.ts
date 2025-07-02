export interface BlogPost {
  title: string;
  author: string;
  published: Date;
  status: 'draft' | 'published';
  slug: string;
  description: string;
  content: string;
  imageUrl?: string;
}

export interface BlogIndex {
  posts: Record<string, string>;
  lastUpdated: Date;
}

export interface ParsedMarkdown {
  frontmatter: any;
  content: string;
}
