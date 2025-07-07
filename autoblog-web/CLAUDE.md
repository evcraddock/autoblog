# Autoblog Web Viewer

## Development Instructions

### Starting the Application in Watch Mode

To start the development server with hot module replacement (HMR) for testing in the browser:

```bash
npm run dev
```

This will start the Vite development server, typically on `http://localhost:5173`. The application will automatically reload when you make changes to the source files.

### Testing Requirements

**IMPORTANT**: Always ensure all tests pass before committing code.

Before committing any changes, run:

```bash
npm test
```

This will run the test suite using Vitest. All tests must pass before code can be committed to the repository.

For continuous testing during development, you can run tests in watch mode:

```bash
npm run test:watch
```

### Pre-commit Checklist

1. Run `npm test` - All tests must pass
2. Run `npm run build` - Ensure the build completes without errors
3. Run `npm run lint` (if configured) - Fix any linting issues
4. Verify your changes work correctly in the browser using `npm run dev`

### Testing Policy

**IMPORTANT**: Do not create or maintain `.tsx` test files unless specifically requested. The project excludes React component tests to focus on TypeScript logic testing only.

- ✅ Test `.ts` files (utilities, hooks, services, types)
- ❌ Avoid `.tsx` test files (React components)
- 🧹 Remove empty `__tests__` directories when they become unused

### Post List Feature Implementation

The comprehensive post list view has been implemented with the following capabilities:

#### Core Features

- Real-time search across post titles, descriptions, content, and authors
- Advanced filtering by publication status (all/published/draft)
- Multi-field sorting by date, title, and author with direction indicators
- Responsive grid/list view toggle with proper breakpoints
- Seamless integration with Automerge CRDT for real-time data sync

#### UI Components

- `PostCard`: Individual post display with metadata and responsive layout
- `PostList`: Main container with comprehensive search, filter, and sort controls
- Enhanced `HomePage`: Connected to real blog post data via Automerge hooks
- Enhanced `PostPage`: Full post display with loading states and error handling

#### Technical Integration

- AutomergeProvider integration in App.tsx for CRDT synchronization
- Enhanced AutomergeContext with proper initialization and loading states
- ES2022 build target configuration for Automerge WASM compatibility
- Comprehensive empty states, loading skeletons, and error handling
- Accessibility features with proper ARIA labels and keyboard navigation

All acceptance criteria from Feature 5 specification have been met and thoroughly tested.
