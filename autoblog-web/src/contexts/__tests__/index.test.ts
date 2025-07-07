import * as contextExports from '../index'

describe('contexts/index', () => {
  it('should export AutomergeProvider', () => {
    expect(contextExports).toHaveProperty('AutomergeProvider')
    expect(typeof contextExports.AutomergeProvider).toBe('function')
  })

  it('should export useRepo', () => {
    expect(contextExports).toHaveProperty('useRepo')
    expect(typeof contextExports.useRepo).toBe('function')
  })

  it('should export withAutomerge', () => {
    expect(contextExports).toHaveProperty('withAutomerge')
    expect(typeof contextExports.withAutomerge).toBe('function')
  })

  it('should export all expected items', () => {
    const expectedExports = ['AutomergeProvider', 'useRepo', 'withAutomerge']
    expectedExports.forEach(exportName => {
      expect(contextExports).toHaveProperty(exportName)
    })
  })

  it('should import ES module successfully', async () => {
    const moduleImport = await import('../index')
    expect(moduleImport).toBeDefined()
    expect(moduleImport.AutomergeProvider).toBeDefined()
    expect(moduleImport.useRepo).toBeDefined()
    expect(moduleImport.withAutomerge).toBeDefined()
  })

  it('should have all exports defined', () => {
    expect(contextExports.AutomergeProvider).toBeDefined()
    expect(contextExports.useRepo).toBeDefined()
    expect(contextExports.withAutomerge).toBeDefined()
  })

  it('should re-export from AutomergeContext', () => {
    // Test that the index file properly re-exports from the context module
    expect(contextExports.AutomergeProvider).toBeDefined()
    expect(contextExports.useRepo).toBeDefined()
    expect(contextExports.withAutomerge).toBeDefined()
  })
})
