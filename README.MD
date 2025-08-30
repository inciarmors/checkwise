# CheckWise

**Dynamic Pull Request checklists based on changed file paths**

[![GitHub Action](https://img.shields.io/badge/GitHub-Action-blue?logo=github-actions)](https://github.com/marketplace/actions/checkwise)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-129%20passed-green)](https://github.com/inciarmors/checkwise/actions)
[![Coverage](https://img.shields.io/badge/Coverage-79.3%25-brightgreen)](https://github.com/inciarmors/checkwise/actions)
[![Self-Validation](https://img.shields.io/badge/Self--Validation-✅%20Active-success)](https://github.com/inciarmors/checkwise/actions/workflows/self-validation.yml)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Bundle Size](https://img.shields.io/badge/Bundle%20Size-690KB-orange)](https://github.com/inciarmors/checkwise)
[![Node Version](https://img.shields.io/badge/Node-20+-brightgreen)](https://nodejs.org/)

---

## Executive Summary

CheckWise is a production-ready GitHub Action that implements intelligent PR checklist automation through file-path-based rule engines. Designed for enterprise-scale development workflows, it eliminates manual checklist maintenance while providing enforcement mechanisms through GitHub Status Checks integration.

**Architecture**: Event-driven TypeScript application with modular components for configuration parsing, pattern matching, GitHub API integration, and markdown generation.

**Performance**: Sub-second execution, 690KB bundled size, optimized glob matching with micromatch, paginated API handling for large PRs.

**Reliability**: 79.3% test coverage, 129 automated tests, comprehensive error handling, network resilience, rate limiting protection.

### Technical Differentiators

- **Zero-JavaScript Configuration**: Pure YAML declarative syntax eliminates code maintenance overhead
- **Multi-Config Architecture**: Native support for team-specific, layered configuration files  
- **Idempotent Operations**: Single comment updates prevent notification spam
- **Enterprise Security**: Path traversal protection, input sanitization, secure token handling
- **Status Check Integration**: Automatic merge protection with completion enforcement
- **Schema-Driven Validation**: JSON Schema provides IDE autocompletion and real-time validation

### Key Features

- **Path-based precision**: Matches file paths, not content - eliminating false positives
- **Zero-code configuration**: Pure YAML declarative rules, no JavaScript required  
- **Idempotent updates**: Single comment that updates cleanly, never spam
- **Multiple config files**: Support for team-specific or layered configuration files
- **GitHub Status Checks**: Automatic merge blocking until checklist completion
- **JSON Schema support**: Editor autocompletion and validation for configuration files
- **Enterprise-grade validation**: Comprehensive input validation with actionable error messages
- **High performance**: Fast glob matching vs. expensive content scanning

---

## Implementation Guide

### Minimal Setup (< 2 minutes)
```yaml
# .github/workflows/checkwise.yml
name: CheckWise PR Automation
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  checklist:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write    # Comment permissions
      statuses: write         # Status check permissions
    steps:
      - uses: actions/checkout@v4
      - uses: inciarmors/checkwise@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          config-path: .github/checkwise.yml
          create-status-check: true
```

### Configuration Schema (JSON Schema Validated)
```yaml
# .github/checkwise.yml - Esempio con template markdown custom
checklists:
  # Backend Service Layer
  - when: ['src/api/**/*.{ts,js}', 'src/services/**/*.{ts,js}', 'src/database/**']
    require:
      - 'OpenAPI/Swagger documentation updated'
      - 'Database migration scripts reviewed'
      - 'Unit tests achieve >80% coverage'
      - 'Integration tests include error scenarios'
      - 'Security implications documented'
      - 'Performance impact measured (APM/profiling)'
      - 'Backward compatibility verified'
    priority: 1
    template: |
      ### 🚀 {{ruleTitle}} (Backend)
      {{items}}

  # Frontend Component Layer
  - when: ['src/components/**/*.{tsx,jsx,vue}', 'src/pages/**/*.{tsx,jsx,vue}', 'src/styles/**']
    require:
      - 'Visual regression tests added/updated'
      - 'Accessibility compliance verified (WCAG 2.1 AA)'
      - 'Cross-browser testing completed (Chrome, Firefox, Safari)'
      - 'Mobile responsiveness validated (320px-1920px)'
      - 'Bundle size impact assessed (<5% increase)'
      - 'Loading states and error boundaries implemented'
    priority: 2

options:
  template: |
    ## 📝 Custom Global Checklist
    {{items}}
```

### Enterprise Multi-Config Architecture
```yaml
# .github/checkwise.yml - Main configuration
checklists:
  # Include team-specific configurations
  $include:
    - teams/backend-team.yml
    - teams/frontend-team.yml
    - teams/devops-team.yml
    - teams/security-team.yml
  
  # Global mandatory checks
  mandatory:
    patterns: ['**/*']
    items:
      - 'Issue/ticket reference included in PR description'
      - 'Breaking changes documented in CHANGELOG.md'
      - 'Documentation updated (if applicable)'

# teams/backend-team.yml
checklists:
  microservices:
    patterns: ['services/**', 'api/**']
    items:
      - 'Circuit breaker patterns implemented'
      - 'Distributed tracing correlation IDs added'
      - 'Health check endpoints updated'
```

### Status Check Integration
```yaml
# Enable merge protection with completion enforcement
- uses: inciarmors/checkwise@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    config-path: .github/checkwise.yml
    create-status-check: true        # Creates "CheckWise" status check
    status-check-name: "PR-Checklist" # Custom status check name
    comment-title: "🔍 Code Review Checklist" # Custom comment title
```

**Result**: PRs cannot be merged until all checklist items are manually checked off. The GitHub Status Check automatically updates from `failure` → `success` when completion is detected.

---

## Advanced Configuration

### Multiple Config Files

You can specify multiple YAML config files for team-specific or layered rules. To do this, set the `config-path` input as a comma-separated list of files:

```yaml
      - uses: inciarmors/checkwise@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          config-path: .github/checkwise.yml,team/checkwise-backend.yml,team/checkwise-frontend.yml
```

**How it works:**
- All `checklists` from all files are combined.
- `options` from later files override earlier ones if there are conflicts.
- If any file is missing or invalid, the action fails with a clear error message.

This allows you to keep team, domain, or project-specific rules in separate files and combine them as needed.

**Example structure:**
```
.github/checkwise.yml          # Base rules for all teams
team/checkwise-backend.yml     # Backend-specific rules
team/checkwise-frontend.yml    # Frontend-specific rules
team/checkwise-devops.yml      # DevOps-specific rules
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
PR Event → Validate Inputs → Load Config(s) → Get Changed Files → Match Patterns → Generate Checklist → Update Comment → Publish Status Check
```

### Input Validation Pipeline

1. **GitHub Token Validation**: Format verification, security checks
2. **Config Path Security**: Path traversal prevention, file existence validation
3. **Multi-file Loading**: Comma-separated config file processing and merging
4. **YAML Structure Validation**: 25+ granular validation rules with detailed error messages
5. **GitHub Context Verification**: PR number, repository context validation
6. **Error Handling**: Contextual messages with debugging hints and troubleshooting tips

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

### Config Path Options

| Input Method | Description | Example |
|--------------|-------------|---------|
| Single file | Default configuration | `.github/checkwise.yml` |
| Multiple files | Comma-separated paths | `.github/checkwise.yml,team/backend.yml,team/frontend.yml` |
| Custom path | Any valid YAML file | `config/pr-rules.yml` |

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

CheckWise provides comprehensive validation with specific, actionable error messages:

```bash
# Configuration validation
Error: Configuration file not found: "team/missing.yml". Create the file with your checklist rules or specify a different path with config-path.

# YAML structure validation  
Error: Rule #2 in "config.yml": pattern #1 in "when" must be a string. Found: number

# Options validation
Error: Config YAML in "config.yml": options.label_filter[1] must be a string. Found: number

# Multi-file validation
Error: No valid checklists found in any config file.
```

**Validation categories:**
- File existence and accessibility  
- YAML syntax and structure
- Rule object validation (when, require, optional)
- Global options validation
- Multi-file merging validation

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
| **Configuration** | YAML declarative | JavaScript custom | Markdown static | Mixed approaches |
| **File-based Logic** | Path matching | Programmable | Always same | Content scanning |
| **Dynamic Checklists** | Based on files changed | Programmable | Static | Keyword-based |
| **Multi-file Config** | ✅ Native support | ❌ Manual setup | ❌ Not supported | ❌ Not supported |
| **Status Checks** | ✅ Built-in | ✅ Custom code | ❌ Not supported | ⚠️ Varies |
| **Idempotent Updates** | ✅ Single comment | ❌ Multiple comments | N/A | ⚠️ Varies |
| **Maintenance Overhead** | ⭐ Zero-code | ⚠️ JavaScript maintenance | ⭐ Minimal | ❌ Complex config |
| **Performance** | ⭐ Fast path matching | ⚠️ Code execution | N/A | ❌ Slow content scan |
| **False Positives** | ⭐ Precise on files | ⚠️ Depends on code | ❌ Always present | ❌ Keyword ambiguity |

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
npm test             # Run test suite (129 tests)
npm run test:watch   # Watch mode testing
npm run build        # Production build with ncc bundling
```

### Project Structure

```
checkwise/
├── src/                    # TypeScript source code
│   ├── main.ts            # Action entry point & orchestration
│   ├── config.ts          # Multi-file YAML configuration loader
│   ├── matcher.ts         # File path pattern matching (micromatch)
│   ├── github.ts          # GitHub API integration & status checks
│   └── checklist.ts       # Markdown checklist generation
├── __tests__/             # Jest test suite (129 tests, 79.3% coverage)
├── schemas/               # JSON Schema for YAML autocompletion
├── dist/                  # Compiled JavaScript (committed for GitHub Actions)
├── examples/              # Configuration examples
├── docs/                  # Additional documentation
├── action.yml             # GitHub Action metadata
├── package.json           # Dependencies & scripts
└── tsconfig.json          # TypeScript configuration
```

### Testing

The project maintains **79.3% test coverage** with comprehensive validation across all components:

```bash
# Test statistics
Test Suites: 9 passed, 9 total
Tests:       129 passed, 129 total
Coverage:    79.3% statements, 77.3% branches, 66.7% functions
```

Key test areas:
- **Input validation**: 35+ test cases covering all validation scenarios
- **YAML configuration parsing**: 40+ test cases with multi-file support
- **GitHub API integration**: 25+ test cases with error handling
- **File pattern matching**: 15+ test cases with complex glob patterns  
- **Error handling scenarios**: 20+ test cases for robust failure handling

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

- **Test Coverage**: Maintain >79% coverage (129 tests)
- **TypeScript**: Strict mode with full type safety
- **Linting**: ESLint with recommended rules
- **Documentation**: Comprehensive JSDoc comments
- **Self-Validation**: CheckWise validates its own Pull Requests

### Self-Validation (Meta-Testing)

CheckWise practices what it preaches - every Pull Request to this repository is validated by CheckWise itself using the configuration in [`.github/checkwise.yml`](.github/checkwise.yml). This ensures:

- **Real-world testing**: Every feature is tested in production-like conditions
- **Configuration validation**: Our example configs are battle-tested
- **User experience verification**: We experience the same workflow as our users
- **Quality assurance**: Critical changes are reviewed with appropriate checklists

You can see CheckWise in action on our own PRs, demonstrating the exact experience you'll get when using it in your projects.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/inciarmors/checkwise/issues)
- **Discussions**: [GitHub Discussions](https://github.com/inciarmors/checkwise/discussions)  
- **Documentation**: [Wiki](https://github.com/inciarmors/checkwise/wiki)

---

## Acknowledgments

- [GitHub Actions Toolkit](https://github.com/actions/toolkit) - Robust GitHub Actions foundation
- [Micromatch](https://github.com/micromatch/micromatch) - Fast and powerful glob matching
- [js-yaml](https://github.com/nodeca/js-yaml) - Reliable YAML parsing
- Community contributors and early adopters

---

**Built for developers, by developers**

*Streamline your code review process with intelligent, contextual checklists.*