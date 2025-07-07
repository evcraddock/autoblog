# Autoblog Web Viewer

[![Web CI](https://github.com/evcraddock/autoblog/actions/workflows/web-ci.yml/badge.svg)](https://github.com/evcraddock/autoblog/actions/workflows/web-ci.yml)
[![Web Quality](https://github.com/evcraddock/autoblog/actions/workflows/web-quality.yml/badge.svg)](https://github.com/evcraddock/autoblog/actions/workflows/web-quality.yml)

A modern web viewer for the Autoblog platform, providing a responsive interface for reading and exploring blog posts synchronized via Automerge CRDT.

## 🚀 Features

- **Local-First Architecture**: Works offline with automatic synchronization when connected
- **Real-Time Sync**: Changes propagate instantly across all connected devices
- **Dark Mode Support**: Automatic theme switching with system preference detection
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Fast Performance**: Built with Vite for instant HMR and optimized production builds

## 🛠️ Technology Stack

- **React 18** - Modern UI library with concurrent features
- **TypeScript** - Type-safe development with strict mode
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS with custom design system
- **Automerge 2.0** - CRDT for distributed data synchronization
- **Vitest** - Fast unit testing with React Testing Library

## 📦 Installation

```bash
# From the repository root
cd autoblog-web

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🧪 Development

### Available Scripts

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Type checking
npm run type-check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Project Structure

```
autoblog-web/
├── src/
│   ├── components/     # React components
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   ├── styles/         # Global styles and Tailwind config
│   ├── __tests__/      # Test files
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── public/             # Static assets
├── index.html          # HTML template
└── [config files]      # Various configuration files
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for local development:

```env
# Automerge sync server URL (optional - defaults to public server)
VITE_SYNC_URL=wss://sync.automerge.org
```

### Build Configuration

The project uses Vite for building and bundling:

- **Development**: Fast HMR with source maps
- **Production**: Optimized build with code splitting and tree shaking
- **WASM Support**: Configured for Automerge WASM modules

## 🧑‍💻 Code Quality

### Pre-commit Hooks

The project uses Husky and lint-staged for automated code quality checks:

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type checking

### Testing

- Unit tests with Vitest and React Testing Library
- Coverage reporting with c8
- Component testing utilities included

## 🚀 Deployment

Build the application for production:

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## 📝 Contributing

1. Create a feature branch from `main`
2. Make your changes with appropriate tests
3. Ensure all checks pass: `npm run lint && npm run type-check && npm test`
4. Submit a pull request

## 🔗 Related

- [Autoblog CLI](../autoblog-cli/) - Command-line tool for managing blog posts
- [Main Documentation](../README.md) - Project overview and architecture
- [Automerge](https://automerge.org/) - CRDT library documentation

## 📄 License

MIT
