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
        'File di configurazione non trovato: "missing.yml". Crea il file con le tue regole checklist o specifica un path diverso con config-path.'
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
      
      expect(errorMessage).toContain('Errore di parsing YAML in');
      expect(errorMessage).toContain('invalid.yml');
      expect(errorMessage).toContain('Controlla la sintassi YAML del file di configurazione');
    });

    it('should handle generic file read errors', () => {
      const error = new Error('Permission denied');
      mockReadFileSync.mockImplementation(() => { throw error; });

      expect(() => loadConfig('forbidden.yml')).toThrow(
        'Impossibile leggere config YAML "forbidden.yml": Permission denied'
      );
    });
  });

  describe('Basic structure validation', () => {
    it('should reject empty/null config', () => {
      mockReadFileSync.mockReturnValue('');
      
      expect(() => loadConfig('empty.yml')).toThrow(
        'Config YAML vuoto o non valido in "empty.yml". Il file deve contenere un oggetto YAML.'
      );
    });

    it('should reject non-object config', () => {
      mockReadFileSync.mockReturnValue('just a string');
      
      expect(() => loadConfig('string.yml')).toThrow(
        'Config YAML vuoto o non valido in "string.yml". Il file deve contenere un oggetto YAML.'
      );
    });

    it('should require checklists property', () => {
      mockReadFileSync.mockReturnValue('{}');
      
      expect(() => loadConfig('no-checklists.yml')).toThrow(
        /proprietà "checklists" mancante.*Esempio:/
      );
    });

    it('should require checklists to be an array', () => {
      mockReadFileSync.mockReturnValue('checklists: "not an array"');
      
      expect(() => loadConfig('bad-checklists.yml')).toThrow(
        '"checklists" deve essere un array. Trovato: string'
      );
    });

    it('should reject empty checklists array', () => {
      mockReadFileSync.mockReturnValue('checklists: []');
      
      expect(() => loadConfig('empty-checklists.yml')).toThrow(
        'array "checklists" è vuoto. Aggiungi almeno una regola.'
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
        'Regola checklist #1 in "bad-rule.yml": deve essere un oggetto. Trovato: string'
      );
    });

    it('should require when property', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - require: ["Test"]
`);
      
      expect(() => loadConfig('no-when.yml')).toThrow(
        'Regola checklist #1 in "no-when.yml": proprietà "when" mancante. Specifica i pattern glob dei file da matchare.'
      );
    });

    it('should require when to be an array', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: "not an array"
    require: ["Test"]
`);
      
      expect(() => loadConfig('bad-when.yml')).toThrow(
        'Regola checklist #1 in "bad-when.yml": "when" deve essere un array di pattern glob. Trovato: string'
      );
    });

    it('should reject empty when array', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: []
    require: ["Test"]
`);
      
      expect(() => loadConfig('empty-when.yml')).toThrow(
        'Regola checklist #1 in "empty-when.yml": array "when" è vuoto. Specifica almeno un pattern glob.'
      );
    });

    it('should validate when pattern types', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["valid", 123]
    require: ["Test"]
`);
      
      expect(() => loadConfig('bad-pattern.yml')).toThrow(
        'Regola checklist #1 in "bad-pattern.yml": pattern #2 in "when" deve essere una stringa. Trovato: number'
      );
    });

    it('should reject empty patterns', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["valid", "  "]
    require: ["Test"]
`);
      
      expect(() => loadConfig('empty-pattern.yml')).toThrow(
        'Regola checklist #1 in "empty-pattern.yml": pattern #2 in "when" è vuoto.'
      );
    });

    it('should require require property', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
`);
      
      expect(() => loadConfig('no-require.yml')).toThrow(
        'Regola checklist #1 in "no-require.yml": proprietà "require" mancante. Specifica gli item della checklist.'
      );
    });

    it('should require require to be an array', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: "not an array"
`);
      
      expect(() => loadConfig('bad-require.yml')).toThrow(
        'Regola checklist #1 in "bad-require.yml": "require" deve essere un array di stringhe. Trovato: string'
      );
    });

    it('should reject empty require array', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: []
`);
      
      expect(() => loadConfig('empty-require.yml')).toThrow(
        'Regola checklist #1 in "empty-require.yml": array "require" è vuoto. Specifica almeno un item della checklist.'
      );
    });

    it('should validate require item types', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Valid", 123]
`);
      
      expect(() => loadConfig('bad-item.yml')).toThrow(
        'Regola checklist #1 in "bad-item.yml": item #2 in "require" deve essere una stringa. Trovato: number'
      );
    });

    it('should reject empty require items', () => {
      mockReadFileSync.mockReturnValue(`
checklists:
  - when: ["src/**"]
    require: ["Valid", "   "]
`);
      
      expect(() => loadConfig('empty-item.yml')).toThrow(
        'Regola checklist #1 in "empty-item.yml": item #2 in "require" è vuoto.'
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
        'Regola checklist #1 in "bad-optional.yml": "optional" deve essere true/false. Trovato: string'
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
        '"options" deve essere un oggetto. Trovato: string'
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
        'options.label_filter deve essere un array. Trovato: string'
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
        'options.label_filter[1] deve essere una stringa. Trovato: number'
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
        'options.branch_pattern deve essere una stringa. Trovato: number'
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
        'options.comment_header deve essere una stringa. Trovato: number'
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
        'Regola checklist #2 in "multi-rules.yml": item #1 in "require" deve essere una stringa. Trovato: number'
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
        'Config YAML vuoto o non valido in "null.yml". Il file deve contenere un oggetto YAML.'
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
      expect(mockReadFileSync).toHaveBeenCalledWith('.github/scope-mate.yml', 'utf8');
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
});