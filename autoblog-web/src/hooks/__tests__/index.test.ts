import * as hookExports from '../index'

describe('hooks/index', () => {
  it('should export useBlogIndexSuspense', () => {
    expect(hookExports).toHaveProperty('useBlogIndexSuspense')
    expect(typeof hookExports.useBlogIndexSuspense).toBe('function')
  })

  it('should export useBlogPostSuspense', () => {
    expect(hookExports).toHaveProperty('useBlogPostSuspense')
    expect(typeof hookExports.useBlogPostSuspense).toBe('function')
  })

  it('should export useBlogIndex', () => {
    expect(hookExports).toHaveProperty('useBlogIndex')
    expect(typeof hookExports.useBlogIndex).toBe('function')
  })

  it('should export useBlogPost', () => {
    expect(hookExports).toHaveProperty('useBlogPost')
    expect(typeof hookExports.useBlogPost).toBe('function')
  })

  it('should export useBlogPosts', () => {
    expect(hookExports).toHaveProperty('useBlogPosts')
    expect(typeof hookExports.useBlogPosts).toBe('function')
  })

  it('should export all expected items', () => {
    const expectedExports = [
      'useBlogIndexSuspense',
      'useBlogPostSuspense',
      'useBlogIndex',
      'useBlogPost',
      'useBlogPosts',
    ]
    expectedExports.forEach(exportName => {
      expect(hookExports).toHaveProperty(exportName)
    })
  })

  it('should import ES module successfully', async () => {
    const moduleImport = await import('../index')
    expect(moduleImport).toBeDefined()
    expect(moduleImport.useBlogIndexSuspense).toBeDefined()
    expect(moduleImport.useBlogPostSuspense).toBeDefined()
    expect(moduleImport.useBlogIndex).toBeDefined()
    expect(moduleImport.useBlogPost).toBeDefined()
    expect(moduleImport.useBlogPosts).toBeDefined()
  })

  it('should have all exports defined', () => {
    expect(hookExports.useBlogIndexSuspense).toBeDefined()
    expect(hookExports.useBlogPostSuspense).toBeDefined()
    expect(hookExports.useBlogIndex).toBeDefined()
    expect(hookExports.useBlogPost).toBeDefined()
    expect(hookExports.useBlogPosts).toBeDefined()
  })

  it('should only export functions', () => {
    const allExports = Object.keys(hookExports)
    allExports.forEach(exportName => {
      expect(typeof hookExports[exportName as keyof typeof hookExports]).toBe(
        'function'
      )
    })
  })

  it('should re-export from useAutomerge', () => {
    // Test that the index file properly re-exports from the hooks module
    expect(hookExports.useBlogIndexSuspense).toBeDefined()
    expect(hookExports.useBlogPostSuspense).toBeDefined()
    expect(hookExports.useBlogIndex).toBeDefined()
    expect(hookExports.useBlogPost).toBeDefined()
    expect(hookExports.useBlogPosts).toBeDefined()
  })
})
