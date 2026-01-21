# Contributing to react-native-lighthouse

Thank you for your interest in contributing to react-native-lighthouse! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/react-native-lighthouse.git
   cd react-native-lighthouse
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development

### Building

```bash
npm run build
```

### Running Tests

```bash
npm test

# Watch mode
npm run test:watch
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Code Style

- Use TypeScript for all source code
- Follow the existing code style
- Add JSDoc comments for public APIs
- Write tests for new functionality

## Commit Messages

We follow conventional commits. Each commit message should be structured as follows:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(hook): add support for custom thresholds
fix(scoring): correct interpolation calculation
docs(readme): add analytics integration example
```

## Pull Requests

1. Update the README.md if your changes affect the public API
2. Add tests for any new functionality
3. Ensure all tests pass
4. Update TypeScript types if needed
5. Keep pull requests focused on a single change

## Reporting Issues

When reporting issues, please include:
- Your React Native version
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Any relevant code snippets or error messages

## Questions?

Feel free to open an issue for any questions about contributing!
