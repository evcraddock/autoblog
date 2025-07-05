# Autoblog Implementation Prompts

## Phase 1: CLI Tool Setup

This document contains step-by-step prompts for implementing the autoblog CLI tool. Each prompt is self-contained and can be used independently.

## Progress Status

✅ **COMPLETED:**
- Step 1: Create Project Directory Structure 
- Step 2: Initialize NPM Project
- Step 3: Install Core Dependencies
- Step 4: Setup Git Hooks and GitHub Actions
- Step 5: Configure TypeScript and Vitest
- Step 6: Create Type Definitions (+ comprehensive linting/formatting setup)
- Step 7: Create Automerge Module (+ comprehensive unit testing)
- Step 8: Create Markdown Parser Module (+ comprehensive unit testing + test fixtures)
- Step 9: Create Entry Point (+ comprehensive unit testing + CLI functionality verified)
- Step 10: Create Upload Command with Automerge Integration (+ comprehensive unit testing + real functionality)
- Step 11: Update Package.json for Binary
- Step 12: Create Basic Documentation

🔄 **NEXT:** Step 13: Test the Complete Setup

### Step 1: Create Project Directory Structure

**Prompt:**
```
Create a new directory called 'autoblog-cli' in the current directory. Inside it, create the following structure:
- src/ (directory for source code)
- src/commands/ (directory for CLI commands)
- src/lib/ (directory for utility modules)
- src/types/ (directory for TypeScript type definitions)
- tests/ (directory for test files)
- tests/unit/ (unit tests)
- tests/integration/ (integration tests)
- tests/fixtures/ (test data files)

Also create these files:
- .gitignore (with common Node.js patterns)
- README.md (with a basic description: "Autoblog CLI - Upload markdown files to Automerge-powered blog")
```

### Step 2: Initialize NPM Project

**Prompt:**
```
In the autoblog-cli directory, initialize a new npm project with the following settings:
- name: "autoblog-cli"
- version: "0.1.0"
- description: "CLI tool for managing markdown files to Autoblog"
- main: "dist/index.js"
- bin: { "autoblog": "dist/index.js" }
- scripts:
  - "build": "tsc"
  - "dev": "ts-node src/index.ts"
  - "start": "node dist/index.js"
  - "test": "vitest"
  - "test:ui": "vitest --ui"
  - "test:watch": "vitest --watch"
  - "prepare": "husky install"

Set the package type to "module" and add "engines" requiring Node.js >= 20.0.0
```

### Step 3: Install Core Dependencies

**Prompt:**
```
Before installing dependencies, check the internet for the latest versions of each library to ensure you're using the most current releases.

Install the following npm packages as dependencies (verify latest versions):
- @automerge/automerge (check for latest 2.x version)
- @automerge/automerge-repo (check for latest version)
- @automerge/automerge-repo-storage-nodefs (check for latest version)
- @automerge/automerge-repo-network-websocket (check for latest version)
- commander (check for latest version)
- gray-matter (check for latest version)
- chalk (check for latest version)

Also install these as devDependencies (verify latest versions):
- @types/node (check for latest version compatible with Node 20+)
- typescript (check for latest version)
- ts-node (check for latest version)
- @types/gray-matter (check for latest version)
- vitest (check for latest version)
- @vitest/ui (check for latest version)
- memfs (check for latest version)
- execa (check for latest version)
- husky (check for latest version)
- lint-staged (check for latest version)

Use npm info <package-name> to check latest versions, or check npmjs.com for each package.
```

### Step 4: Setup Git Hooks for Pre-commit Testing

**Prompt:**
```
Set up git hooks to ensure tests pass before commits:

1. Initialize Husky (if not already done): npx husky install
2. Create a pre-commit hook: npx husky add .husky/pre-commit "npm test"
3. Create .lintstagedrc.json file with configuration:
   {
     "*.{ts,js}": ["npm run test --passWithNoTests"],
     "*.ts": ["tsc --noEmit"]
   }
4. Update the pre-commit hook to use lint-staged:
   - Edit .husky/pre-commit to run: npx lint-staged
5. Add lint-staged configuration to package.json:
   "lint-staged": {
     "*.{ts,js}": ["npm run test --passWithNoTests", "git add"],
     "*.ts": ["tsc --noEmit"]
   }

This ensures that:
- Tests must pass before any commit
- TypeScript compilation is checked
- Only changed files are processed for efficiency
```

### Step 5: Configure TypeScript and Vitest

**Prompt:**
```
Create a tsconfig.json file in autoblog-cli with the following configuration:
- target: "ES2022"
- module: "NodeNext"
- moduleResolution: "NodeNext"
- outDir: "./dist"
- rootDir: "./src"
- strict: true
- esModuleInterop: true
- skipLibCheck: true
- forceConsistentCasingInFileNames: true
- resolveJsonModule: true
- declaration: true
- declarationMap: true

Include: ["src/**/*"]
Exclude: ["node_modules", "dist"]

Also create a vitest.config.ts file with:
- import { defineConfig } from 'vitest/config'
- Configure test environment as 'node'
- Set test file patterns: ['tests/**/*.test.ts']
- Include src files for coverage
- Add coverage reporter (optional)
```

### Step 6: Create Type Definitions

**Prompt:**
```
Create src/types/index.ts with TypeScript interfaces for:

1. BlogPost interface with fields:
   - title: string
   - author: string
   - published: Date
   - status: 'draft' | 'published'
   - slug: string
   - description: string
   - content: string
   - imageUrl?: string (optional)

2. BlogIndex interface with fields:
   - posts: Record<string, string> (slug to documentId mapping)
   - lastUpdated: Date

3. ParsedMarkdown interface with fields:
   - frontmatter: any
   - content: string

Export all interfaces.
```

### Step 6.1: Write Type Validation Tests

**Prompt:**
```
Create tests/unit/types.test.ts that:

1. Imports all type definitions
2. Tests type compatibility and validation:
   - Creates valid BlogPost objects and verifies they match the interface
   - Tests required vs optional fields
   - Validates status enum values ('draft' | 'published')
   - Tests BlogIndex structure with post mappings
   - Validates ParsedMarkdown interface structure
3. Uses TypeScript's type checking and runtime validation:
   - Create helper functions to validate object shapes
   - Test edge cases (empty strings, invalid dates, etc.)
4. Includes examples of valid and invalid objects for each type

This ensures type definitions work as expected and catch common mistakes.
```

### Step 7: Create Automerge Module

**Prompt:**
```
Create src/lib/automerge.ts that:

1. Imports Repo from @automerge/automerge-repo
2. Imports NodeFSStorageAdapter and WebSocketClientAdapter
3. Creates an initRepo() function that:
   - Creates a storage adapter pointing to "./autoblog-data"
   - Creates a network adapter connecting to "wss://sync.automerge.org"
   - Returns a new Repo instance with both adapters
4. Exports the initRepo function

Add proper error handling for connection failures.
```

### Step 7.1: Write Unit Tests for Automerge Module

**Prompt:**
```
Create tests/unit/automerge.test.ts that:

1. Imports the initRepo function and necessary test utilities
2. Uses vi.mock() to mock the Automerge dependencies:
   - Mock @automerge/automerge-repo
   - Mock @automerge/automerge-repo-storage-nodefs
   - Mock @automerge/automerge-repo-network-websocket
3. Tests initRepo function:
   - Verifies NodeFSStorageAdapter is created with correct path
   - Verifies WebSocketClientAdapter is created with correct URL
   - Verifies Repo is instantiated with both adapters
   - Tests error handling for adapter creation failures
4. Uses proper TypeScript types and Vitest assertions
5. Includes setup and teardown for mocks

Focus on testing the configuration and instantiation logic.
```

### Step 8: Create Markdown Parser Module

**Prompt:**
```
Create src/lib/parser.ts that:

1. Imports 'fs/promises' for file reading
2. Imports 'gray-matter' for frontmatter parsing
3. Imports 'path' for file path operations
4. Creates a parseMarkdownFile async function that:
   - Takes a file path as parameter
   - Reads the file content
   - Parses frontmatter using gray-matter
   - Returns an object with frontmatter and content
   - Handles errors gracefully
5. Creates a generateSlug function that:
   - Takes a title string
   - Converts to lowercase, replaces spaces with hyphens
   - Removes special characters
   - Returns a URL-safe slug
6. Exports both functions
```

### Step 8.1: Write Unit Tests for Parser

**Prompt:**
```
Create tests/unit/parser.test.ts that:

1. Imports the parser functions and necessary test utilities
2. Uses memfs to mock file system operations
3. Tests generateSlug function with various inputs:
   - Basic title conversion
   - Special characters removal
   - Edge cases (empty string, special chars only)
4. Tests parseMarkdownFile function:
   - Valid markdown with frontmatter
   - Markdown without frontmatter
   - File not found error
   - Invalid frontmatter format
5. Creates test fixtures in tests/fixtures/:
   - sample-post.md (valid post with frontmatter)
   - no-frontmatter.md (markdown without frontmatter)

Use Vitest's expect assertions and vi.mock() for mocking.
```

### Step 9: Create Entry Point

**Prompt:**
```
Create src/index.ts as the CLI entry point that:

1. Adds shebang: #!/usr/bin/env node
2. Imports commander's Command
3. Imports chalk for colored output
4. Creates a new Command instance
5. Sets program details:
   - name: "autoblog"
   - description: "CLI tool for Automerge-powered blog"
   - version: "0.1.0"
6. Adds a placeholder command:
   - command: "upload <file>"
   - description: "Upload a markdown file to the blog"
   - action: logs "Upload functionality coming soon" with the file path
7. Calls program.parse()

Make sure to handle uncaught errors gracefully.
```

### Step 9.1: Write Unit Tests for CLI Entry Point

**Prompt:**
```
Create tests/unit/cli.test.ts that:

1. Imports the CLI entry point and necessary test utilities
2. Uses vi.mock() to mock commander and chalk dependencies
3. Tests CLI configuration:
   - Verifies program name, description, and version are set correctly
   - Verifies upload command is registered with correct description
   - Tests command parsing with various arguments
4. Tests error handling:
   - Invalid arguments
   - Missing file parameter
   - Uncaught errors are handled gracefully
5. Mocks console.log and process.exit for testing
6. Uses execa or similar to test actual CLI execution in integration scenarios

Focus on testing the CLI setup and command registration logic.
```

### Step 10: Create Upload Command Placeholder

**Prompt:**
```
Create src/commands/upload.ts with an uploadCommand function that:

1. Takes a file path parameter
2. For now, just:
   - Validates the file exists
   - Checks it has .md extension
   - Logs success message with chalk
   - Returns a promise
3. Exports the function

This is a placeholder that will be expanded in Phase 2.
```

### Step 10.1: Write Unit Tests for Upload Command

**Prompt:**
```
Create tests/unit/upload.test.ts that:

1. Imports the uploadCommand function
2. Uses memfs to mock file system operations
3. Tests file validation:
   - Valid .md file exists
   - File doesn't exist (should throw error)
   - Invalid file extension (should throw error)
   - Empty file path (should throw error)
4. Tests success scenarios:
   - Valid markdown file uploads successfully
   - Logs appropriate success message
5. Uses vi.mock() to mock chalk and console.log
6. Creates test fixtures as needed

Focus on testing the validation logic since full upload functionality comes in Phase 2.
```

### Step 11: Update Package.json for Binary

**Prompt:**
```
Update package.json to ensure the CLI works as a binary:

1. Ensure "type": "module" is set
2. Add/update the "bin" field to point to dist/index.js
3. Update "prepare" script to: "husky install && npm run build"
4. Add repository information pointing to the GitHub repo
5. Add keywords: ["automerge", "blog", "cli", "markdown", "local-first"]
6. Set license to "MIT"
7. Ensure the lint-staged configuration is properly added
```

### Step 12: Create Basic Documentation

**Prompt:**
```
Update the README.md in autoblog-cli with:

1. Title and description
2. Installation instructions:
   - From source: npm install && npm run build
   - Global: npm install -g .
3. Usage examples:
   - autoblog upload post.md
   - autoblog --help
4. Development setup:
   - Clone repo
   - npm install
   - npm run dev
   - npm test (to run tests)
5. Project structure overview
6. Testing information:
   - How to run tests
   - Git hooks automatically run tests before commits
7. Link to main project documentation
```

### Step 13: Test the Complete Setup

**Prompt:**
```
Test the complete setup with comprehensive verification:

1. Run all unit tests: npm test
2. Verify all test suites pass:
   - types.test.ts (type validation)
   - automerge.test.ts (repo initialization)
   - parser.test.ts (markdown parsing and slug generation)
   - cli.test.ts (CLI setup and command registration)
   - upload.test.ts (upload command validation)
3. Test git hooks by making a test commit:
   - Stage some files: git add .
   - Try to commit: git commit -m "test commit"
   - Verify tests run automatically and commit succeeds
4. Build the project: npm run build
5. Create a test markdown file called test-post.md with:
   - Frontmatter (title, author, published date)
   - Some markdown content
6. Run: npm run dev -- upload test-post.md
7. Verify it shows the placeholder message
8. Install globally: npm install -g .
9. Test: autoblog upload test-post.md
10. Verify the binary works correctly
11. Run tests with coverage: npm test -- --coverage
12. Verify coverage reports show good test coverage for all modules
```

### Completion Checklist

After completing all steps, you should have:
- [x] Project directory with proper structure (including tests/) ✅ **COMPLETED - Step 1**
- [x] NPM project initialized with dependencies and testing packages ✅ **COMPLETED - Steps 2-3**
- [x] TypeScript and Vitest configured ✅ **COMPLETED - Step 5**
- [x] Git hooks configured (Husky + lint-staged) and working ✅ **COMPLETED - Step 4**
- [x] Type definitions created with validation tests ✅ **COMPLETED - Step 6**
- [x] Comprehensive linting/formatting setup (Prettier + pre-commit hooks) ✅ **COMPLETED - Step 6 Enhanced**
- [x] GitHub CI workflow updated to match local checks ✅ **COMPLETED - Step 6 Enhanced**
- [x] Automerge module created with unit tests ✅ **COMPLETED - Step 7**
- [x] Markdown parser created with comprehensive unit tests ✅ **COMPLETED - Step 8**
- [x] CLI entry point created with unit tests ✅ **COMPLETED - Step 9**
- [x] Upload command with full Automerge integration created with unit tests ✅ **COMPLETED - Step 10**
- [x] Test fixtures created for all test scenarios ✅ **COMPLETED - Step 8**
- [ ] Pre-commit tests enforced and tested
- [x] Documentation written (including testing info) ✅ **COMPLETED - Step 12**
- [ ] All test suites passing with good coverage
- [ ] Binary installation and execution working
- [ ] Complete test-driven development workflow established

---

## Tips for Using These Prompts

1. **Execute prompts sequentially** - Each builds on the previous
2. **Verify each step** - Test that each component works before moving on
3. **Customize as needed** - Adjust paths, names, or features to your preferences
4. **Check for errors** - Run TypeScript compiler after major changes
5. **Commit frequently** - Use git to track progress after each major step

These prompts can be used with AI assistants or as a manual checklist for implementation.