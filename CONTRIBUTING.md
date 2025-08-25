# Contributing to Checkwise

We love your input! We want to make contributing to Checkwise as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### 1. Fork the Repository

1. Fork the repo and create your branch from `main`
2. Clone your fork locally
3. Set up the development environment

```bash
git clone https://github.com/yourusername/checkwise
cd checkwise
npm install
```

### 2. Development Setup

#### Prerequisites
- Node.js 18+ or 20+
- npm 9+
- Git

#### Install Dependencies
```bash
npm install
```

#### Development Commands
```bash
# Run tests (do this frequently!)
npm test

# Run tests in watch mode
npm run test:watch

# Build the action
npm run build

# Type checking
npm run lint

# Development mode with TypeScript watching
npm run dev
```

#### Project Structure
```
checkwise/
├── src/                    # TypeScript source code
│   ├── main.ts            # Entry point
│   ├── config.ts          # Configuration parsing
│   ├── github.ts          # GitHub API integration
│   ├── matcher.ts         # File pattern matching
│   └── checklist.ts       # Checklist generation
├── __tests__/             # Jest test suite
├── dist/                  # Compiled JavaScript (committed)
├── examples/              # Configuration examples
├── docs/                  # Documentation
└── .github/               # GitHub templates and workflows
```

### 3. Making Changes

#### Code Guidelines
- **TypeScript**: Use strict TypeScript with proper typing
- **Testing**: Write tests for all new functionality
- **Documentation**: Update docs for any API changes
- **Commits**: Use conventional commit messages

#### Testing Guidelines
- Maintain test coverage above 95%
- Test both success and failure scenarios
- Include integration tests for GitHub API interactions
- Mock external dependencies appropriately

```bash
# Run full test suite
npm test

# Check coverage
npm test -- --coverage

# Test specific file
npm test -- config.test.ts
```

#### Code Style
- Use TypeScript strict mode
- Follow existing code patterns and conventions
- Add JSDoc comments for public functions
- Use meaningful variable and function names
- Keep functions small and focused

### 4. Submitting Changes

#### Before Submitting
1. **Test thoroughly**: Ensure all tests pass
2. **Build successfully**: Run `npm run build`
3. **Update documentation**: If you've changed APIs or added features
4. **Add tests**: For new functionality
5. **Follow commit conventions**: Use clear, descriptive commit messages

#### Pull Request Process
1. **Create a descriptive PR title**: Follow conventional commits format
2. **Fill out the PR template**: Don't skip sections
3. **Link related issues**: Use "Closes #123" or "Relates to #123"
4. **Request review**: Wait for maintainer review
5. **Address feedback**: Make requested changes promptly

#### Commit Message Format
```
type(scope): brief description

Detailed explanation of what changed and why.

- List any breaking changes
- Reference issues: Closes #123
```

Examples:
```
feat(config): add support for branch pattern filtering

Add new `branch_pattern` option to configuration that allows
users to apply checklists only to specific branch patterns.

Closes #45

fix(github): handle rate limiting gracefully

Implement exponential backoff for GitHub API calls to prevent
failures when rate limits are hit.

Fixes #67
```

## Types of Contributions

### 🐛 Bug Reports
Use the bug report template and include:
- Clear description of the issue
- Steps to reproduce
- Your configuration file
- Relevant log output
- Expected vs actual behavior

### ✨ Feature Requests
Use the feature request template and include:
- Clear description of the problem you're solving
- Proposed solution with examples
- Alternative solutions considered
- Use cases and benefits

### 📚 Documentation
Documentation improvements are always welcome:
- Fix typos or improve clarity
- Add examples for complex configurations
- Improve API documentation
- Add troubleshooting guides

### 🧪 Testing
Help improve test coverage:
- Add tests for edge cases
- Improve integration tests
- Add performance tests
- Test with different repository structures

## Development Guidelines

### Architecture Principles
- **Modularity**: Each module has a single responsibility
- **Testability**: Write code that's easy to test
- **Security**: Validate all inputs and handle errors gracefully
- **Performance**: Consider GitHub API rate limits and large repositories

### Security Considerations
- Never log sensitive information (tokens, file contents)
- Validate and sanitize all user inputs
- Use secure defaults
- Follow principle of least privilege

### Performance Guidelines
- Minimize GitHub API calls
- Use efficient glob patterns
- Handle large file lists gracefully
- Cache results when appropriate

## Code Review Process

### For Contributors
- Respond to feedback promptly
- Ask questions if feedback is unclear
- Make requested changes in separate commits
- Keep the discussion focused on the code

### For Reviewers
- Be constructive and specific in feedback
- Explain the reasoning behind suggestions
- Approve when ready, request changes if needed
- Focus on functionality, security, and maintainability

## Release Process

### Versioning
We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] GitHub release published

## Community Guidelines

### Code of Conduct
Please follow our Code of Conduct in all interactions:
- Be respectful and inclusive
- Focus on what's best for the community
- Show empathy towards other community members
- Accept constructive criticism gracefully

### Communication Channels
- **Issues**: Bug reports and feature requests
- **Discussions**: General questions and community chat
- **Pull Requests**: Code contributions
- **Security**: Private vulnerability reporting

### Getting Help
- Check existing documentation first
- Search existing issues and discussions
- Ask specific questions with context
- Provide minimal reproduction cases

## Recognition

Contributors who make significant contributions will be:
- Added to the README.md contributors section
- Mentioned in release notes
- Given credit in commit messages

## Questions?

Feel free to open a discussion or issue for any questions about contributing. We're here to help!

---

Thank you for contributing to Checkwise! 🚀
