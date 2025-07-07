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