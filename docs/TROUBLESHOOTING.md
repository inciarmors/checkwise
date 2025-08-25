# Troubleshooting Guide

## Overview

This guide helps you diagnose and resolve common issues when using CheckWise in your GitHub workflows.

## Common Issues

### 1. Action Not Running

**Symptom**: CheckWise action doesn't execute on pull requests

**Possible Causes & Solutions**:

```yaml
# PROBLEM: Missing trigger events
on:
  pull_request:

# SOLUTION: Add specific trigger events
on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main, develop]
```

```yaml
# PROBLEM: Wrong file permissions
- name: Checkout
  uses: actions/checkout@v4

# SOLUTION: Ensure proper permissions
- name: Checkout
  uses: actions/checkout@v4
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    fetch-depth: 1
```

**Debugging Steps**:
1. Check workflow file syntax with `yaml-lint`
2. Verify trigger conditions in Actions tab
3. Check repository permissions and branch protection rules
4. Review GitHub Actions logs for error messages

### 2. Checklist File Not Found

**Symptom**: Error message "Checklist file not found: .github/CHECKLIST.md"

**Common Causes**:
- File path is incorrect
- File doesn't exist in the branch
- Case sensitivity issues (Linux runners)
- File encoding problems

**Solutions**:

```yaml
# Verify file exists and path is correct
- name: Debug Checklist Path
  run: |
    ls -la .github/
    find . -name "*CHECKLIST*" -type f
    file .github/CHECKLIST.md

# Handle multiple possible locations
- name: Validate Checklist
  uses: inciarmors/checkwise@v1
  with:
    checklist-path: |
      .github/CHECKLIST.md
      docs/CHECKLIST.md
      CHECKLIST.md
```

### 3. Pattern Matching Issues

**Symptom**: Required patterns not being detected correctly

**Common Issues**:

```markdown
<!-- PROBLEM: Inconsistent formatting -->
- [ ]Tests added
- [ ] Documentation updated
- [x]Security review completed

<!-- SOLUTION: Consistent spacing -->
- [ ] Tests added
- [ ] Documentation updated  
- [x] Security review completed
```

```yaml
# PROBLEM: Overly specific patterns
required-patterns: |
  - [x] All unit tests pass with 100% coverage

# SOLUTION: Flexible patterns
required-patterns: |
  - [ ] Unit tests added/updated
  - [ ] Test coverage maintained
```

**Debugging Pattern Matching**:

```yaml
# Add debug mode to see pattern detection
- name: Debug Checklist Patterns
  uses: inciarmors/checkwise@v1
  with:
    checklist-path: .github/CHECKLIST.md
    debug-mode: true  # Shows pattern matching details
    log-level: verbose
```

### 4. GitHub API Rate Limiting

**Symptom**: Error "GitHub API rate limit exceeded"

**Solutions**:

```yaml
# Use GitHub App token for higher limits
- name: Validate Checklist
  uses: inciarmors/checkwise@v1
  with:
    github-token: ${{ secrets.GITHUB_APP_TOKEN }}
    
# Disable API-heavy features if not needed
- name: Validate Checklist
  uses: inciarmors/checkwise@v1
  with:
    validate-links: false
    check-external-urls: false
```

**Rate Limit Management**:
- **Personal tokens**: 5,000 requests/hour
- **GitHub App tokens**: 15,000 requests/hour
- **Enterprise**: Higher limits available

### 5. Performance Issues

**Symptom**: Action takes longer than 5 minutes or times out

**Performance Optimization**:

```yaml
# Add timeouts and optimize configuration
jobs:
  validate-checklist:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Validate Checklist
        uses: inciarmors/checkwise@v1
        timeout-minutes: 3
        with:
          checklist-path: .github/CHECKLIST.md
          strict-mode: false          # Faster validation
          validate-links: false       # Skip link checking
          max-file-size: 5MB         # Limit file size
```

See [Performance Documentation](PERFORMANCE.md) for detailed optimization strategies.

### 6. Permission Errors

**Symptom**: Error "Permission denied" or "403 Forbidden"

**Common Solutions**:

```yaml
# Ensure proper workflow permissions
permissions:
  contents: read
  pull-requests: read
  checks: write

# For private repositories
- name: Checkout
  uses: actions/checkout@v4
  with:
    token: ${{ secrets.PAT_TOKEN }}
```

### 7. Unicode and Encoding Issues

**Symptom**: Checklist items with special characters not recognized

**Solutions**:

```yaml
# Ensure UTF-8 encoding
- name: Validate Checklist
  uses: inciarmors/checkwise@v1
  with:
    encoding: utf-8
    normalize-unicode: true
```

```markdown
<!-- Use standard checkbox formatting -->
- [ ] Standard checkbox
- [x] Completed checkbox

<!-- Avoid special unicode checkboxes -->
- ☐ Unicode empty checkbox
- ☑ Unicode checked checkbox
```

## Debugging Techniques

### 1. Enable Debug Logging

```yaml
- name: Validate Checklist (Debug Mode)
  uses: inciarmors/checkwise@v1
  with:
    checklist-path: .github/CHECKLIST.md
    debug-mode: true
    log-level: debug
  env:
    ACTIONS_RUNNER_DEBUG: true
    ACTIONS_STEP_DEBUG: true
```

### 2. Manual Validation

```bash
# Test checklist locally before CI/CD
npm install -g checkwise-cli
checkwise validate .github/CHECKLIST.md --debug

# Or using Docker
docker run -v $(pwd):/workspace checkwise:latest validate /workspace/.github/CHECKLIST.md
```

### 3. Step-by-Step Debugging

```yaml
- name: Debug - List Files
  run: |
    echo "Repository structure:"
    find . -name "*.md" -type f
    echo "Checklist content:"
    cat .github/CHECKLIST.md || echo "File not found"

- name: Debug - Validate Syntax
  run: |
    echo "Checking markdown syntax:"
    npx markdownlint .github/CHECKLIST.md

- name: Debug - Pattern Testing
  run: |
    echo "Testing pattern matching:"
    grep -n "\- \[ \]" .github/CHECKLIST.md || echo "No unchecked items found"
    grep -n "\- \[x\]" .github/CHECKLIST.md || echo "No checked items found"
```

## Error Messages Reference

### Common Error Messages and Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `Checklist file not found` | File path incorrect | Verify file exists and path is correct |
| `Invalid markdown format` | Syntax errors in checklist | Check markdown formatting |
| `Pattern not found` | Required pattern missing | Add required checklist items |
| `GitHub API rate limit` | Too many API calls | Use GitHub App token or reduce API usage |
| `Permission denied` | Insufficient permissions | Update workflow permissions |
| `Timeout exceeded` | Action running too long | Optimize configuration or increase timeout |
| `Invalid configuration` | YAML syntax error | Validate workflow file syntax |
| `Network error` | Connection issues | Retry or check GitHub status |

### Exit Codes

| Exit Code | Meaning | Action Required |
|-----------|---------|-----------------|
| 0 | Success | None - checklist validation passed |
| 1 | Validation failed | Fix checklist items and re-run |
| 2 | Configuration error | Fix workflow configuration |
| 3 | File not found | Check file paths and permissions |
| 4 | Network error | Retry or check network connectivity |
| 5 | Rate limit exceeded | Wait or use different token |
| 6 | Permission denied | Update repository permissions |
| 7 | Timeout | Optimize performance or increase timeout |

## Advanced Troubleshooting

### 1. Custom Error Handling

```yaml
- name: Validate Checklist with Error Handling
  uses: inciarmors/checkwise@v1
  id: checklist-validation
  continue-on-error: true
  with:
    checklist-path: .github/CHECKLIST.md

- name: Handle Validation Failure
  if: steps.checklist-validation.outcome == 'failure'
  run: |
    echo "Checklist validation failed"
    echo "Exit code: ${{ steps.checklist-validation.outputs.exit-code }}"
    echo "Error details: ${{ steps.checklist-validation.outputs.error-message }}"
    
    # Custom recovery actions
    if [[ "${{ steps.checklist-validation.outputs.exit-code }}" == "3" ]]; then
      echo "Creating default checklist..."
      cp .github/templates/DEFAULT_CHECKLIST.md .github/CHECKLIST.md
    fi
```

### 2. Environment-Specific Issues

```yaml
# Handle different operating systems
- name: Validate Checklist (Cross-platform)
  uses: inciarmors/checkwise@v1
  with:
    checklist-path: ${{ runner.os == 'Windows' && '.github\CHECKLIST.md' || '.github/CHECKLIST.md' }}
    line-endings: ${{ runner.os == 'Windows' && 'crlf' || 'lf' }}
```

### 3. Integration Testing

```yaml
# Test checklist validation in isolation
- name: Integration Test
  run: |
    # Create test checklist
    cat > test-checklist.md << 'EOF'
    # Test Checklist
    - [ ] Test item 1
    - [x] Test item 2
    - [ ] Test item 3
    EOF
    
    # Run validation
    checkwise validate test-checklist.md --strict-mode=false
    
    # Verify results
    echo "Integration test completed"
```

## Getting Help

### 1. GitHub Issues

If you encounter a bug or need help:

1. **Search existing issues**: Check if someone has already reported the problem
2. **Create detailed issue**: Include workflow file, checklist content, and error logs
3. **Use issue templates**: Follow the bug report or feature request templates

### 2. Discussion Forum

For questions and community support:
- Visit [GitHub Discussions](https://github.com/inciarmors/checkwise/discussions)
- Search existing discussions
- Ask questions with detailed context

### 3. Documentation

Additional resources:
- [README.md](../README.md) - Getting started guide
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Development guidelines
- [PERFORMANCE.md](PERFORMANCE.md) - Performance optimization
- [Examples](../examples/) - Configuration examples

### 4. Professional Support

For enterprise users:
- Priority support available
- Custom configuration assistance
- Performance optimization consulting
- Training and onboarding

## Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**Workflow Configuration**
```yaml
# Paste your workflow file here
```

**Checklist Content**
```markdown
# Paste your checklist content here
```

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Error Logs**
```
Paste any error messages or logs here
```

**Environment**
- CheckWise version: [e.g., v1.2.0]
- GitHub Runner: [e.g., ubuntu-latest]
- Repository type: [public/private]
- Organization/personal: [organization/personal]

**Additional Context**
Any other relevant information.
```

### Performance Issues

When reporting performance issues:

1. **Include timing information**: Action duration, timeout settings
2. **Repository size**: Number of files, checklist complexity
3. **Resource usage**: Memory consumption, CPU utilization
4. **Network conditions**: GitHub API response times

### Security Issues

For security vulnerabilities:
- **Do not** create public issues
- Email security concerns to: security@checkwise.dev
- Include detailed reproduction steps
- Allow time for responsible disclosure

## FAQ

### Q: Why is my checklist validation failing intermittently?

**A**: Common causes include:
- Network timeouts to GitHub API
- Rate limiting during peak hours
- File encoding issues on different runners
- Race conditions in parallel workflows

**Solution**: Add retry logic and ensure consistent configuration.

### Q: Can I use CheckWise with private repositories?

**A**: Yes, ensure proper token permissions:
```yaml
- uses: inciarmors/checkwise@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Q: How do I handle multiple checklist formats?

**A**: Use flexible pattern matching:
```yaml
required-patterns: |
  - [\s]*\[[\sx]\][\s]*(Test|test).*
  - [\s]*\[[\sx]\][\s]*(Doc|doc).*
```

### Q: Can I skip checklist validation for certain PRs?

**A**: Yes, use conditional execution:
```yaml
if: |
  !contains(github.event.pull_request.labels.*.name, 'skip-checklist') &&
  !startsWith(github.event.pull_request.title, '[skip-ci]')
```

### Q: How do I validate checklists in multiple languages?

**A**: Configure language-specific patterns:
```yaml
conditional-patterns: |
  "**/*.{en,english}.md":
    - [ ] English documentation updated
  "**/*.{es,spanish}.md":
    - [ ] Spanish documentation updated
```
