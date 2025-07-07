import type * as typeExports from '../index'

describe('types/index', () => {
  it('should import ES module successfully', async () => {
    const moduleImport = await import('../index')
    expect(moduleImport).toBeDefined()
    expect(typeof moduleImport).toBe('object')
  })

  it('should allow TypeScript compilation of interfaces', () => {
    // This test validates that TypeScript can properly compile the types
    // If this compiles without errors, the type exports are working correctly

    // Test BlogPost interface structure
    const mockBlogPost: typeExports.BlogPost = {
      title: 'Test Post',
      author: 'Test Author',
      published: new Date(),
      status: 'published',
      slug: 'test-post',
      description: 'Test description',
      content: 'Test content',
      imageUrl: 'test-image.jpg',
    }

    // Test BlogIndex interface structure
    const mockBlogIndex: typeExports.BlogIndex = {
      posts: { 'test-post': 'doc-id' },
      lastUpdated: new Date(),
    }

    // Test AppConfig interface structure
    const mockAppConfig: typeExports.AppConfig = {
      syncUrl: 'wss://test.com',
      theme: 'light',
    }

    // Test AutomergeState interface structure
    const mockAutomergeState: typeExports.AutomergeState = {
      isLoading: false,
      error: 'Test error',
      posts: [mockBlogPost],
      blogIndex: mockBlogIndex,
    }

    // If these objects can be created without TypeScript errors,
    // the interfaces are properly exported
    expect(mockBlogPost).toBeDefined()
    expect(mockBlogIndex).toBeDefined()
    expect(mockAppConfig).toBeDefined()
    expect(mockAutomergeState).toBeDefined()
  })

  it('should have valid BlogPost interface structure', () => {
    // Test that we can create objects that match the BlogPost interface
    const blogPost: typeExports.BlogPost = {
      title: 'Test',
      author: 'Test Author',
      published: new Date(),
      status: 'draft',
      slug: 'test',
      description: 'Test description',
      content: 'Test content',
    }

    expect(blogPost.title).toBe('Test')
    expect(blogPost.status).toBe('draft')
    expect(blogPost.imageUrl).toBeUndefined() // Optional property
  })

  it('should have valid BlogIndex interface structure', () => {
    // Test that we can create objects that match the BlogIndex interface
    const blogIndex: typeExports.BlogIndex = {
      posts: { slug1: 'doc1', slug2: 'doc2' },
      lastUpdated: new Date(),
    }

    expect(blogIndex.posts).toHaveProperty('slug1')
    expect(blogIndex.lastUpdated).toBeInstanceOf(Date)
  })

  it('should have valid AppConfig interface structure', () => {
    // Test that we can create objects that match the AppConfig interface
    const appConfig: typeExports.AppConfig = {
      syncUrl: 'wss://example.com',
      theme: 'system',
    }

    expect(appConfig.syncUrl).toBe('wss://example.com')
    expect(['light', 'dark', 'system']).toContain(appConfig.theme)
  })

  it('should have valid AutomergeState interface structure', () => {
    // Test that we can create objects that match the AutomergeState interface
    const automergeState: typeExports.AutomergeState = {
      isLoading: true,
      posts: [],
    }

    expect(automergeState.isLoading).toBe(true)
    expect(automergeState.posts).toEqual([])
    expect(automergeState.error).toBeUndefined() // Optional property
    expect(automergeState.blogIndex).toBeUndefined() // Optional property
  })

  it('should support type constraints properly', () => {
    // Test that the type constraints work as expected
    const publishedPost: typeExports.BlogPost = {
      title: 'Published Post',
      author: 'Author',
      published: new Date(),
      status: 'published', // Should only accept 'draft' or 'published'
      slug: 'published-post',
      description: 'Description',
      content: 'Content',
    }

    const draftPost: typeExports.BlogPost = {
      title: 'Draft Post',
      author: 'Author',
      published: new Date(),
      status: 'draft', // Should only accept 'draft' or 'published'
      slug: 'draft-post',
      description: 'Description',
      content: 'Content',
    }

    expect(publishedPost.status).toBe('published')
    expect(draftPost.status).toBe('draft')
  })
})
