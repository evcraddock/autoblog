import { render, screen, waitFor } from '@testing-library/react'
import { AutomergeProvider, useRepo } from '../contexts/AutomergeContext'

// Mock the Automerge modules
vi.mock('@automerge/react', () => ({
  Repo: vi.fn().mockImplementation(() => ({
    peerId: 'test-peer-id',
    find: vi.fn(),
    create: vi.fn(),
  })),
  RepoContext: {
    Provider: ({ children, value }: { children: React.ReactNode; value: any }) => (
      <div data-testid="repo-provider" data-repo={value?.peerId}>
        {children}
      </div>
    ),
  },
  useRepo: vi.fn(),
  WebSocketClientAdapter: vi.fn(),
  IndexedDBStorageAdapter: vi.fn(),
}))

// Mock the cleanup function
vi.mock('../services/automerge', () => ({
  cleanup: vi.fn(),
}))

// Test component that uses the repo
function TestComponent() {
  const repo = useRepo()
  return (
    <div>
      <span data-testid="repo-status">
        {repo ? 'repo-available' : 'no-repo'}
      </span>
      {repo && <span data-testid="peer-id">{repo.peerId}</span>}
    </div>
  )
}

describe('AutomergeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children and provide repo context', async () => {
    render(
      <AutomergeProvider>
        <TestComponent />
      </AutomergeProvider>
    )

    // Check that the provider wrapper is rendered
    expect(screen.getByTestId('repo-provider')).toBeInTheDocument()
    expect(screen.getByTestId('repo-status')).toBeInTheDocument()
  })

  it('should initialize repo with default configuration', async () => {
    const { IndexedDBStorageAdapter, WebSocketClientAdapter, Repo } = await import('@automerge/react')

    render(
      <AutomergeProvider>
        <TestComponent />
      </AutomergeProvider>
    )

    await waitFor(() => {
      expect(IndexedDBStorageAdapter).toHaveBeenCalledWith('autoblog-web')
      expect(WebSocketClientAdapter).toHaveBeenCalledWith('wss://sync.automerge.org')
      expect(Repo).toHaveBeenCalled()
    })
  })

  it('should initialize repo with custom sync URL', async () => {
    const { WebSocketClientAdapter } = await import('@automerge/react')
    const customSyncUrl = 'wss://custom-sync.example.com'

    render(
      <AutomergeProvider config={{ syncUrl: customSyncUrl }}>
        <TestComponent />
      </AutomergeProvider>
    )

    await waitFor(() => {
      expect(WebSocketClientAdapter).toHaveBeenCalledWith(customSyncUrl)
    })
  })

  it('should initialize repo without network adapter when no sync URL provided', async () => {
    const { WebSocketClientAdapter, Repo } = await import('@automerge/react')

    render(
      <AutomergeProvider config={{ syncUrl: '' }}>
        <TestComponent />
      </AutomergeProvider>
    )

    await waitFor(() => {
      expect(WebSocketClientAdapter).not.toHaveBeenCalled()
      expect(Repo).toHaveBeenCalled()
    })
  })

  it('should handle repo initialization errors gracefully', async () => {
    const { Repo } = await import('@automerge/react')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock Repo constructor to throw
    ;(Repo as any).mockImplementationOnce(() => {
      throw new Error('Initialization failed')
    })

    render(
      <AutomergeProvider>
        <TestComponent />
      </AutomergeProvider>
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Automerge initialization error:',
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })

  it('should call cleanup on unmount', async () => {
    const { cleanup } = await import('../services/automerge')
    
    const { unmount } = render(
      <AutomergeProvider>
        <TestComponent />
      </AutomergeProvider>
    )

    unmount()

    expect(cleanup).toHaveBeenCalled()
  })
})