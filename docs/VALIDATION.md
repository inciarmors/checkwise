# Input Validation & Error Handling

Checkwise v1.0 includes granular validation of action inputs and YAML configuration, providing clear and actionable error messages to facilitate debugging.

## Action Input Validation

### GitHub Token
```yaml
# Valid tokens
github-token: ${{ secrets.GITHUB_TOKEN }}  # Default GitHub token
github-token: ghp_your_personal_token      # Personal access token
github-token: ghs_your_app_token          # GitHub App token  
github-token: github_pat_your_token       # Fine-grained token

# Common errors
github-token: ""                          # Empty token
github-token: "invalid_format"            # Unexpected format (warning)
```

### Config Path
```yaml
# Valid paths
config-path: ".github/checkwise.yml"      # Recommended default
config-path: "custom/rules.yaml"          # Custom path
config-path: ""                           # Use default

# Unsafe paths
config-path: "../../../etc/passwd"        # Directory traversal
config-path: "/absolute/path"              # Absolute path
config-path: "config.txt"                 # Extension warning
```

## YAML Configuration Validation

### Basic Structure
```yaml
# Valid minimal configuration
checklists:
  - when: ["src/**/*.ts"]
    require: ["Test coverage > 90%"]

# Structure errors
{}                                         # Empty YAML
checklists: "not an array"                # Wrong type
checklists: []                            # Empty array
```

### Rule Validation
```yaml
# Valid rule
- when: ["src/**/*.ts", "!**/*.test.ts"]  # Array of patterns
  require: ["Tests", "Code review"]       # Array of strings
  optional: false                         # Optional boolean

# Rule errors
- "not an object"                         # Must be object
- when: "single pattern"                  # when must be array
  require: ["Tests"]
- when: []                                # when cannot be empty
  require: ["Tests"]
- when: ["src/**"]                        # require missing
- when: ["src/**"]
  require: "single item"                  # require must be array
- when: ["src/**"]
  require: []                             # require cannot be empty
```

### Pattern and Item Validation
```yaml
# Valid patterns and items
- when: 
    - "src/**/*.{ts,js}"                  # Valid glob pattern
    - "!node_modules/**"                  # Negation
  require:
    - "Test coverage verified"            # Descriptive string
    - "Checklist item with emoji"         # Unicode supported

# Pattern/item errors
- when: ["valid", 123]                    # Non-string pattern
  require: ["Tests"]
- when: ["valid", "  "]                   # Empty pattern
  require: ["Tests"]
- when: ["src/**"]
  require: ["Valid", 123]                 # Non-string item
- when: ["src/**"]
  require: ["Valid", "   "]               # Empty item
```

### Options Validation
```yaml
# Valid options
options:
  branch_pattern: "feature/*"             # String pattern
  label_filter: ["enhancement", "bug"]    # Array of strings
  comment_header: "Custom Header"         # String

# Options errors
options: "not an object"                  # Must be object
options:
  branch_pattern: 123                     # Must be string
  label_filter: "not array"              # Must be array
  label_filter: ["valid", 123]           # Non-string item
  comment_header: 123                     # Must be string
```

## Detailed Error Messages

### File Errors
```
Configuration file not found: ".github/missing.yml". 
Create the file with your checklist rules or specify a different path with config-path.

YAML parsing error in "config.yml": unexpected token. 
Check the YAML syntax of the configuration file.
```

### Input Errors
```
Input "github-token" is required and cannot be empty

Unsafe config path: "../malicious.yml". 
Use relative paths without ".." or absolute paths.

Config path "config.txt" does not end with .yml/.yaml. 
Make sure it's a YAML file.
```

### GitHub Context Errors
```
Unable to determine Pull Request number. 
Event: "push". Make sure the action is triggered on pull_request events 
(opened, synchronize, edited, etc.).

Incomplete repository context: owner="", repo="test-repo"

Invalid PR number: -1. Must be a positive number.
```

### Configuration Errors
```
Checklist rule #1 in "config.yml": "when" property missing. 
Specify glob patterns for files to match.

Checklist rule #2 in "config.yml": pattern #1 in "when" must be a string. 
Found: number

Config YAML in "config.yml": options.label_filter[1] must be a string. 
Found: number
```

## Debugging and Troubleshooting

### Debug Logging
Checkwise provides detailed logs for debugging:

```yaml
# Workflow with debug enabled
- uses: your-username/checkwise@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
  env:
    ACTIONS_STEP_DEBUG: true  # Enable debug logging
```

### Context Information
In case of error, Checkwise logs useful information:

```javascript
Context: {
  "eventName": "pull_request",
  "repoOwner": "username", 
  "repoName": "repo",
  "prNumber": 42,
  "hasToken": true
}
```

### Automatic Suggestions
Checkwise provides contextual suggestions:

```
Hint: Make sure the workflow is triggered on pull_request events
Hint: Verify that github-token is configured correctly  
Hint: Check that the configuration file exists and is valid
```

## Configuration Testing

### Local Validation
```bash
# Configuration test with Node.js
node -e "
const { loadConfig } = require('./dist/config.js');
try {
  const config = loadConfig('.github/checkwise.yml');
  console.log('Configuration valid!');
  console.log('Rules:', config.checklists.length);
} catch (error) {
  console.error('Error:', error.message);
}
"
```

### Test Cases
See `examples/` directory for:
- `comprehensive-config.yml` - Complete valid configuration
- `invalid-config-examples.yml` - Common error examples
- Validation testing with Jest

## Best Practices

1. **Use default path**: `.github/checkwise.yml` is the recommended path
2. **Validate locally**: Test configuration before committing
3. **Specific patterns**: Use precise glob patterns to avoid unwanted matches
4. **Clear messages**: Write descriptive and actionable checklist items
5. **Incremental testing**: Add rules gradually to test behavior
