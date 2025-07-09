# Autoblog Project Development Instructions

## Development Workflow

### Starting a New Feature

- ALWAYS create a git branch first before starting any new feature or task
- Use descriptive branch names (e.g., `feature/blog-post-validation`, `fix/upload-error-handling`)

### Code Quality Requirements

After finishing the code implementation:

1. Ensure the project builds successfully
2. Run lint checks and fix any issues
3. Run all tests and ensure they pass
4. Only commit code after all checks pass
- ALWAYS run tests and lint checks before comitting

### Pull Request Process

- After committing code, ALWAYS create a pull request
- Wait for the pull request to be merged before proceeding
- After merge, pull latest from main branch before starting next task

## Team Workflow

- Assign pull requests to evcraddock
- Before starting the next prompt ensure that the current git branch is pushed and pull latest from the main branch

## Testing Guidelines

- never test .tsx files unless specifically told to

### Commit and Version Control Guidelines

- NEVER bypass the pre-commit hooks