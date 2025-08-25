# Checkwise

**Dynamic Pull Request checklists based on changed file paths**

[![GitHub Action](https://img.shields.io/badge/GitHub-Action-blue?logo=github-actions)](https://github.com/marketplace/actions/checkwise)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-78%20passed-green)](https://github.com/inciarmors/CheckWise/actions)
[![Coverage](https://img.shields.io/badge/Coverage-98.8%25-brightgreen)](https://github.com/inciarmors/CheckWise/actions)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

---

## Overview

Checkwise is a GitHub Action that automatically generates contextual checklists for Pull Requests based on **file path patterns**. Unlike static PR templates or content-scanning tools, Checkwise uses declarative YAML configuration to match file paths with glob patterns, providing precise, zero-maintenance automation for code review workflows.

### Key Features

- **Path-based precision**: Matches file paths, not content - eliminating false positives
- **Zero-code configuration**: Pure YAML declarative rules, no JavaScript required  
- **Idempotent updates**: Single comment that updates cleanly, never spam
- **Enterprise-grade validation**: Comprehensive input validation with actionable error messages
- **High performance**: Fast glob matching vs. expensive content scanning

---

## Quick Start

### 1. Create GitHub Workflow

`.github/workflows/checkwise.yml`:

```yaml
name: Checkwise
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  checkwise:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: inciarmors/checkwise@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Configure Checklist Rules

`.github/checkwise.yml`:

```yaml
checklists:
  # Frontend changes
  - when: ["src/**/*.{tsx,jsx,vue}", "components/**", "styles/**"]
    require:
      - "Screenshots attached (before/after)"
      - "Accessibility tests performed (ARIA, contrast)"
      - "Tested on mobile and desktop"
      - "Issue/ticket linked in description"

  # Backend API changes  
  - when: ["api/**/*.ts", "src/routes/**", "**/*api*.ts"]
    require:
      - "API documentation updated"
      - "Backward compatibility verified"
      - "Rate limiting considered"
      - "Load testing performed if needed"

  # Database migrations
  - when: ["db/migrations/**", "prisma/**", "**/*.sql"]
    require:
      - "Rollback plan documented"
      - "Data migration strategy defined"
      - "Tested on staging dataset"
      - "DBA review requested (@db-team)"

  # Infrastructure as Code
  - when: ["terraform/**", "k8s/**/*.yaml", "infra/**"]
    require:
      - "terraform plan output attached"
      - "Cost impact estimated"
      - "Security review completed"
      - "DevOps approval (@devops-team)"
```

### 3. Result

When you open a PR modifying `src/components/LoginForm.tsx`, Checkwise automatically comments:

```markdown
## Checkwise Checklist

Based on files modified in this PR:

**Frontend Changes** (`src/components/LoginForm.tsx`):
- [ ] Screenshots attached (before/after)
- [ ] Accessibility tests performed (ARIA, contrast)
- [ ] Tested on mobile and desktop
- [ ] Issue/ticket linked in description

Check all boxes to complete merge requirements.
```

---

## Architecture

### Core Components

```
src/
├── main.ts          # Action entry point & orchestration
├── config.ts        # YAML configuration parser & validation
├── matcher.ts       # File path pattern matching (micromatch)
├── github.ts        # GitHub API integration & error handling
└── checklist.ts     # Markdown checklist generation
```

### Data Flow

```
PR Event → Load Config → Get Changed Files → Match Patterns → Generate Checklist → Update Comment
```

### Input Validation Pipeline

1. **GitHub Token Validation**: Format verification, security checks
2. **Config Path Security**: Path traversal prevention, file existence
3. **YAML Structure Validation**: 20+ granular validation rules
4. **GitHub Context Verification**: PR number, repository context
5. **Error Handling**: Contextual messages with debugging hints

---

## Configuration Reference

### Basic Structure

```yaml
checklists:
  - when: ["<glob-patterns>"]     # File path patterns to match
    require: ["<checklist-items>"] # Required checklist items
    optional: boolean              # Optional: default false

options:                          # Global options (optional)
  branch_pattern: "feature/*"     # Only apply to specific branches
  label_filter: ["enhancement"]   # Filter by PR labels
  comment_header: "Custom Header" # Customize comment header
```

### Advanced Glob Patterns

```yaml
checklists:
  # Multiple file types
  - when: ["**/*.{js,ts,jsx,tsx}"]
    require: ["JavaScript/TypeScript standards followed"]
    
  # Negation patterns
  - when: ["src/**/*.ts", "!**/*.test.ts", "!**/*.spec.ts"]
    require: ["Production TypeScript code reviewed"]
    
  # Nested directory matching
  - when: ["src/components/**/*.tsx", "src/pages/**/*.tsx"]
    require: ["React component guidelines followed"]
    
  # Exact file matching
  - when: ["package.json", "package-lock.json"]
    require: ["Dependency security audit completed"]
```

### Error Messages & Validation

All configuration errors provide specific, actionable messages:

```bash
Error: Rule #2 in "config.yml": pattern #1 in "when" must be a string. Found: number
Error: Config YAML in "config.yml": options.label_filter[1] must be a string. Found: number
Hint: Check that the configuration file exists and is valid
```

---

## Use Cases

### Frontend Development
```yaml
- when: ["src/**/*.{tsx,jsx}", "components/**", "styles/**"]
  require:
    - "Visual regression tests passed"
    - "Performance impact assessed"
    - "Browser compatibility verified"
    - "Accessibility standards met"
```

### Infrastructure as Code
```yaml
- when: ["terraform/**", "k8s/**/*.yaml", "infra/**"]
  require:
    - "Cost impact analysis completed"
    - "Security review passed"
    - "Rollback procedure documented"
    - "Resource limits configured"
```

### Database Operations
```yaml
- when: ["migrations/**", "schema/**", "**/*.sql"]
  require:
    - "Migration tested on staging"
    - "Performance impact assessed"
    - "Rollback strategy defined"
    - "DBA approval obtained"
```

### API Development
```yaml
- when: ["api/**", "routes/**", "**/*api*.ts"]
  require:
    - "OpenAPI specification updated"
    - "Rate limiting configured"
    - "Authentication tested"
    - "Documentation published"
```

---

## Comparison with Alternatives

| Feature | Checkwise | Danger.js | PR Templates | Keyword-based Tools |
|---------|-----------|-----------|--------------|-------------------|
| Configuration | YAML declarative | JavaScript custom | Markdown static | Mixed approaches |
| File-based Logic | Path matching | Programmable | Always same | Content scanning |
| Dynamic Checklists | Based on files changed | Programmable | Static | Keyword-based |
| Idempotent Updates | Single comment | Multiple comments | N/A | Varies |
| Maintenance Overhead | Zero-code | JavaScript maintenance | Minimal | Complex config |
| Performance | Fast path matching | Code execution | N/A | Slow content scan |
| False Positives | Precise on files | Depends on code | Always present | Keyword ambiguity |

---

## Security & Error Handling

### Input Validation
- **Path traversal prevention**: Blocks `../` patterns in config paths
- **Token format validation**: Validates GitHub token formats
- **YAML injection protection**: Safe YAML parsing with js-yaml
- **Repository context verification**: Ensures valid GitHub context

### Error Handling
- **Graceful degradation**: Continues operation on non-critical errors
- **Rate limiting**: Built-in GitHub API rate limit handling
- **Network resilience**: Automatic retry with exponential backoff
- **Detailed logging**: Comprehensive debug information for troubleshooting

### GitHub API Security
```typescript
// Safe API calls with retry logic
async function safeApiCall<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  // Rate limit detection and handling
  // Network error recovery
  // Comprehensive error context
}
```

---

## Development

### Prerequisites

- Node.js 20+
- TypeScript 5.9+
- Jest 30+ (for testing)

### Setup

```bash
git clone https://github.com/inciarmors/checkwise
cd checkwise
npm install
```

### Commands

```bash
npm run dev          # TypeScript watch mode
npm test             # Run test suite (78 tests)
npm run test:watch   # Watch mode testing
npm run build        # Production build with ncc bundling
```

### Project Structure

```
checkwise/
├── src/                    # TypeScript source code
├── __tests__/             # Jest test suite (98.8% coverage)
├── dist/                  # Compiled JavaScript (committed for GitHub Actions)
├── examples/              # Configuration examples
├── docs/                  # Additional documentation
├── action.yml             # GitHub Action metadata
├── package.json           # Dependencies & scripts
└── tsconfig.json          # TypeScript configuration
```

### Testing

The project maintains **98.8% test coverage** with comprehensive validation:

```bash
# Test statistics
Test Suites: 7 passed, 7 total
Tests:       78 passed, 78 total
Coverage:    98.8% statements, 93% branches, 79% functions
```

Key test areas:
- Input validation (25 test cases)
- YAML configuration parsing (34 test cases) 
- GitHub API integration (12 test cases)
- File pattern matching (8 test cases)
- Error handling scenarios (15+ test cases)

---

## Documentation

- **[Validation Guide](docs/VALIDATION.md)**: Comprehensive input validation reference
- **[Configuration Examples](examples/)**: Real-world configuration patterns
- **[API Reference](src/)**: TypeScript source code with full documentation

---

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Test thoroughly (`npm test`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

### Code Quality Standards

- **Test Coverage**: Maintain >95% coverage
- **TypeScript**: Strict mode with full type safety
- **Linting**: ESLint with recommended rules
- **Documentation**: Comprehensive JSDoc comments

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/inciarmors/CheckWise/issues)
- **Discussions**: [GitHub Discussions](https://github.com/inciarmors/CheckWise/discussions)  
- **Documentation**: [Wiki](https://github.com/inciarmors/CheckWise/wiki)

---

## Acknowledgments

- [GitHub Actions Toolkit](https://github.com/actions/toolkit) - Robust GitHub Actions foundation
- [Micromatch](https://github.com/micromatch/micromatch) - Fast and powerful glob matching
- [js-yaml](https://github.com/nodeca/js-yaml) - Reliable YAML parsing
- Community contributors and early adopters

---

**Built for developers, by developers**

*Streamline your code review process with intelligent, contextual checklists.*