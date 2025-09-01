# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.0   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Checkwise, please report it privately to maintain the security of our users.

### How to Report

1. **GitHub Security Advisories**: Use [GitHub's private vulnerability reporting](https://github.com/inciarmors/checkwise/security/advisories/new)
2. **Email**: Contact the maintainer through GitHub for private communication
3. **Issue**: For non-critical security concerns, you may create a public issue

### What to Include

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested fix (if any)
- Your contact information for follow-up

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Updates**: Every 72 hours until resolved
- **Resolution**: Critical issues within 7 days, others within 30 days

### Disclosure Policy

We follow responsible disclosure practices. Please allow us time to address the issue before public disclosure. We will coordinate with you on the disclosure timeline.

## Security Considerations

Checkwise handles sensitive information and operates in security-critical environments:

### Data Handled
- GitHub tokens (read-only repository access)
- YAML configuration files
- GitHub API interactions
- File path information

### Security Measures
- **Input Validation**: Comprehensive validation of all inputs
- **Path Traversal Prevention**: Blocks `../` patterns and absolute paths
- **Token Security**: Secure token handling without logging
- **YAML Safety**: Safe YAML parsing preventing code injection
- **API Security**: Proper GitHub API authentication and rate limiting

### Best Practices for Users

1. **Token Permissions**: Use minimal required permissions for GitHub tokens
2. **Token Storage**: Store tokens securely in GitHub Secrets, never in code
3. **Regular Updates**: Keep the action updated to the latest version
4. **Configuration Review**: Regularly audit your configuration files
5. **Access Control**: Limit who can modify workflow files and configurations

### Threat Model

#### Assets Protected
- Repository code and metadata
- GitHub tokens and authentication
- Configuration data
- CI/CD pipeline integrity

#### Potential Threats
- Malicious configuration injection
- Token exposure or misuse
- Path traversal attacks
- YAML injection attacks
- Denial of service through resource exhaustion

#### Mitigations
- Strict input validation and sanitization
- Secure defaults and fail-safe behaviors
- Comprehensive error handling
- Rate limiting and resource management
- Security-focused code review and testing

## Security Updates

Security updates will be released as patch versions and will be clearly marked in the changelog. Critical security updates may be released outside the normal release schedule.

### Notification Channels
- GitHub Security Advisories
- Release notes and changelog
- Repository discussions for major security updates

## Security Testing

Checkwise undergoes regular security testing including:
- Static code analysis for security vulnerabilities
- Dependency vulnerability scanning
- Input validation testing
- Authentication and authorization testing

## Compliance

Checkwise is designed to support organizations with security and compliance requirements:
- No sensitive data logging
- Minimal privilege requirements
- Audit trail through GitHub Actions logs
- Transparent operation and source code availability
