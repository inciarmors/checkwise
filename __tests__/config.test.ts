import * as fs from 'fs';
import { loadConfig } from '../src/config';

jest.mock('fs');

describe('Config Loading and Validation', () => {
  const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('File reading', () => {
    it('should handle missing config file with helpful error', () => {
      const error = new Error('ENOENT: no such file or directory') as any;
      error.code = 'ENOENT';
      mockReadFileSync.mockImplementation(() => { throw error; });

      expect(() => loadConfig('missing.yml')).toThrow(
        'Configuration file not found: "missing.yml". Create the file with your checklist rules or specify a different path with config-path.'
      );
    });

    it('should handle YAML parsing errors with helpful context', () => {
      mockReadFileSync.mockReturnValue('invalid: yaml: content: [');
      
      let errorMessage = '';
      try {
        loadConfig('invalid.yml');
      } catch (error: any) {
        errorMessage = error.message;
      }
      
  expect(errorMessage).toContain('YAML parsing error in');
  expect(errorMessage).toContain('invalid.yml');
  expect(errorMessage).toContain('Check the YAML syntax of the configuration file');
    });

    it('should handle generic file read errors', () => {
      const error = new Error('Permission denied');
      mockReadFileSync.mockImplementation(() => { throw error; });

      expect(() => loadConfig('forbidden.yml')).toThrow(
        'Unable to read config YAML "forbidden.yml": Permission denied'
      );
    });
  });

  describe('Basic structure validation', () => {
    it('should reject empty/null config', () => {
      mockReadFileSync.mockReturnValue('');
      
      expect(() => loadConfig('empty.yml')).toThrow(
        'Empty or invalid YAML config in "empty.yml". The file must contain a YAML object.'
      );
    });

    it('should reject non-object config', () => {
      mockReadFileSync.mockReturnValue('just a string');
      
      expect(() => loadConfig('string.yml')).toThrow(
        'Empty or invalid YAML config in "string.yml". The file must contain a YAML object.'
      );
    });

    it('should require checklists property', () => {
      mockReadFileSync.mockReturnValue('{}');
      
      expect(() => loadConfig('no-checklists.yml')).toThrow(
        /missing "checklists" property.*Example:/
      );
    });

    it('should require checklists to be an array', () => {
      mockReadFileSync.mockReturnValue('checklists: "not an array"');
      
      expect(() => loadConfig('bad-checklists.yml')).toThrow(
        '"checklists" must be an array. Found: string'
      );
    });

    it('should reject empty checklists array', () => {
      mockReadFileSync.mockReturnValue('checklists: []');
      
      expect(() => loadConfig('empty-checklists.yml')).toThrow(
        'The "checklists" array is empty. Add at least one rule.'
      );
    });
  });

  describe('Rule validation', () => {
    it('should reject non-object rules', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - "not an object"
`);
      
      expect(() => loadConfig('bad-rule.yml')).toThrow(
        'Checklist rule #1 in "bad-rule.yml": must be an object. Found: string'
      );
    });

    it('should require when property', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - require: ["Test"]
`);
      
      expect(() => loadConfig('no-when.yml')).toThrow(
        'Checklist rule #1 in "no-when.yml": missing "when" property. Specify the glob patterns of the files to match.'
      );
    });

    it('should require when to be an array', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: "not an array"
    require: ["Test"]
`);
      
      expect(() => loadConfig('bad-when.yml')).toThrow(
        'Checklist rule #1 in "bad-when.yml": "when" must be an array of glob patterns. Found: string'
      );
    });

    it('should reject empty when array', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: []
    require: ["Test"]
`);
      
      expect(() => loadConfig('empty-when.yml')).toThrow(
        'Checklist rule #1 in "empty-when.yml": "when" array is empty. Specify at least one glob pattern.'
      );
    });

    it('should validate when pattern types', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["valid", 123]
    require: ["Test"]
`);
      
      expect(() => loadConfig('bad-pattern.yml')).toThrow(
        'Checklist rule #1 in "bad-pattern.yml": pattern #2 in "when" must be a string. Found: number'
      );
    });

    it('should reject empty patterns', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["valid", "  "]
    require: ["Test"]
`);
      
      expect(() => loadConfig('empty-pattern.yml')).toThrow(
        'Checklist rule #1 in "empty-pattern.yml": pattern #2 in "when" is empty.'
      );
    });

    it('should require require property', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
`);
      
      expect(() => loadConfig('no-require.yml')).toThrow(
        'Checklist rule #1 in "no-require.yml": missing "require" property. Specify the checklist items.'
      );
    });

    it('should require require to be an array', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: "not an array"
`);
      
      expect(() => loadConfig('bad-require.yml')).toThrow(
        'Checklist rule #1 in "bad-require.yml": "require" must be an array of strings. Found: string'
      );
    });

    it('should reject empty require array', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: []
`);
      
      expect(() => loadConfig('empty-require.yml')).toThrow(
        'Checklist rule #1 in "empty-require.yml": "require" array is empty. Specify at least one checklist item.'
      );
    });

    it('should validate require item types', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Valid", 123]
`);
      
      expect(() => loadConfig('bad-item.yml')).toThrow(
        'Checklist rule #1 in "bad-item.yml": item #2 in "require" must be a string. Found: number'
      );
    });

    it('should reject empty require items', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Valid", "   "]
`);
      
      expect(() => loadConfig('empty-item.yml')).toThrow(
        'Checklist rule #1 in "empty-item.yml": item #2 in "require" is empty.'
      );
    });

    it('should validate optional property type', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Test"]
    optional: "not a boolean"
`);
      
      expect(() => loadConfig('bad-optional.yml')).toThrow(
        'Checklist rule #1 in "bad-optional.yml": "optional" must be true/false. Found: string'
      );
    });

    it('should accept valid optional property', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Test"]
    optional: true
`);
      
      const config = loadConfig('valid-optional.yml');
      expect(config.checklists[0].optional).toBe(true);
    });
  });

  describe('Options validation', () => {
    it('should validate options type', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Test"]
options: "not an object"
`);
      
      expect(() => loadConfig('bad-options.yml')).toThrow(
        '"options" must be an object. Found: string'
      );
    });

    it('should validate label_filter type', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Test"]
options:
  label_filter: "not an array"
`);
      
      expect(() => loadConfig('bad-label-filter.yml')).toThrow(
        'options.label_filter must be an array. Found: string'
      );
    });

    it('should validate label_filter item types', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Test"]
options:
  label_filter: ["valid", 123]
`);
      
      expect(() => loadConfig('bad-label-item.yml')).toThrow(
        'options.label_filter[1] must be a string. Found: number'
      );
    });

    it('should validate branch_pattern type', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Test"]
options:
  branch_pattern: 123
`);
      
      expect(() => loadConfig('bad-branch.yml')).toThrow(
        'options.branch_pattern must be a string. Found: number'
      );
    });

    it('should validate comment_header type', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Test"]
options:
  comment_header: 123
`);
      
      expect(() => loadConfig('bad-header.yml')).toThrow(
        'options.comment_header must be a string. Found: number'
      );
    });

    it('should accept valid options', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Test"]
options:
  label_filter: ["enhancement", "bugfix"]
  branch_pattern: "feature/*"
  comment_header: "Custom Header"
`);
      
      const config = loadConfig('valid-options.yml');
      expect(config.options).toEqual({
        label_filter: ['enhancement', 'bugfix'],
        branch_pattern: 'feature/*',
        comment_header: 'Custom Header'
      });
    });
  });

  describe('Multiple rules validation', () => {
    it('should validate multiple rules with detailed error context', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Valid rule"]
  - when: ["docs/**"]
    require: [123]  # Invalid item in second rule
`);
      
      expect(() => loadConfig('multi-rules.yml')).toThrow(
        'Checklist rule #2 in "multi-rules.yml": item #1 in "require" must be a string. Found: number'
      );
    });

    it('should process all rules when valid', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**/*.ts", "!**/*.test.ts"]
    require: ["Tests passing", "Code reviewed"]
    optional: false
  - when: ["docs/**"]
    require: ["Documentation updated"]
    optional: true
`);
      
      const config = loadConfig('multi-valid.yml');
      expect(config.checklists).toHaveLength(2);
      expect(config.checklists[0].when).toEqual(['src/**/*.ts', '!**/*.test.ts']);
      expect(config.checklists[1].optional).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle null YAML parsing result', () => {
      mockReadFileSync.mockReturnValue('null');
      
      expect(() => loadConfig('null.yml')).toThrow(
        'Empty or invalid YAML config in "null.yml". The file must contain a YAML object.'
      );
    });

    it('should handle undefined options properties', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Test"]
options:
  some_other_property: "ignored"
`);
      
      const config = loadConfig('partial-options.yml');
      expect(config.options).toEqual({
        some_other_property: 'ignored'
      });
    });

    it('should use default path when none provided', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Test"]
`);
      
      const config = loadConfig(); // No path provided
  expect(config.checklists).toHaveLength(1);
  expect(mockReadFileSync).toHaveBeenCalledWith('.github/checkwise.yml', 'utf8');
    });
  });

  describe('Successful loading', () => {
    it('should load valid minimal config', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**/*.ts"]
    require: ["Tests passing"]
`);

      const config = loadConfig('valid.yml');
      expect(config).toEqual({
        checklists: [
          {
            when: ['src/**/*.ts'],
            require: ['Tests passing']
          }
        ]
      });
    });

    it('should load valid complex config', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**/*.ts", "!**/*.test.ts"]
    require: ["Tests passing", "Code reviewed"]
    optional: false
  - when: ["docs/**"]
    require: ["Documentation updated"]
    optional: true
options:
  label_filter: ["enhancement", "bugfix"]
  branch_pattern: "feature/*"
  comment_header: "Custom Header"
`);

      const config = loadConfig('complex.yml');
      expect(config).toEqual({
        checklists: [
          {
            when: ['src/**/*.ts', '!**/*.test.ts'],
            require: ['Tests passing', 'Code reviewed'],
            optional: false
          },
          {
            when: ['docs/**'],
            require: ['Documentation updated'],
            optional: true
          }
        ],
        options: {
          label_filter: ['enhancement', 'bugfix'],
          branch_pattern: 'feature/*',
          comment_header: 'Custom Header'
        }
      });
    });
  });

  describe('Priority and template validation', () => {
    it('should reject non-integer priority', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Test"]
    priority: 1.5
`);
      expect(() => loadConfig('bad-priority.yml')).toThrow(
        'Checklist rule #1 in "bad-priority.yml": "priority" must be an integer >= 0. Found: 1.5'
      );
    });
    it('should reject negative priority', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Test"]
    priority: -1
`);
      expect(() => loadConfig('neg-priority.yml')).toThrow(
        'Checklist rule #1 in "neg-priority.yml": "priority" must be an integer >= 0. Found: -1'
      );
    });
    it('should reject non-string template in rule', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Test"]
    template: 123
`);
      expect(() => loadConfig('bad-template.yml')).toThrow(
        'Checklist rule #1 in "bad-template.yml": "template" must be a string if provided.'
      );
    });
    it('should reject non-string template in options', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Test"]
options:
  template: 123
`);
      expect(() => loadConfig('bad-opt-template.yml')).toThrow(
        'Config YAML in "bad-opt-template.yml": options.template must be a string if provided.'
      );
    });
  });
});