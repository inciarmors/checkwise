import * as core from '@actions/core';
import * as github from '@actions/github';

jest.mock('@actions/core');
jest.mock('@actions/github');

describe('validateInputs', () => {
  let validateInputs: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Import dopo aver mockato le dipendenze
    validateInputs = (await import('../src/main')).validateInputs;
  });

  describe('GitHub token validation', () => {
    it('should accept valid GitHub tokens', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken123';
        if (name === 'config-path') return '.github/scope-mate.yml';
        return '';
      });

      const result = validateInputs();
      expect(result.token).toBe('ghp_validtoken123');
    });

    it('should accept GitHub App tokens', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghs_apptoken123';
        if (name === 'config-path') return '.github/scope-mate.yml';
        return '';
      });

      const result = validateInputs();
      expect(result.token).toBe('ghs_apptoken123');
    });

    it('should accept fine-grained personal access tokens', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return 'github_pat_validtoken123';
        if (name === 'config-path') return '.github/scope-mate.yml';
        return '';
      });

      const result = validateInputs();
      expect(result.token).toBe('github_pat_validtoken123');
    });

    it('should throw error for empty token', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return '';
        return '';
      });

      expect(() => validateInputs()).toThrow('Input "github-token" è richiesto e non può essere vuoto');
    });

    it('should throw error for whitespace-only token', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return '   ';
        return '';
      });

      expect(() => validateInputs()).toThrow('Input "github-token" è richiesto e non può essere vuoto');
    });

    it('should warn for unexpected token format', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return 'invalid_format_token';
        if (name === 'config-path') return '.github/scope-mate.yml';
        return '';
      });
      (core.warning as jest.Mock).mockImplementation(() => {});

      validateInputs();
      expect(core.warning).toHaveBeenCalledWith(
        'GitHub token format inaspettato. Assicurati di usare un token valido.'
      );
    });
  });

  describe('Config path validation', () => {
    beforeEach(() => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken123';
        return '';
      });
    });

    it('should use default config path when none provided', () => {
      (core.info as jest.Mock).mockImplementation(() => {});

      const result = validateInputs();
      expect(result.configPath).toBe('.github/scope-mate.yml');
      expect(core.info).toHaveBeenCalledWith(
        'Nessun config-path specificato, usando default: .github/scope-mate.yml'
      );
    });

    it('should use provided config path', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken123';
        if (name === 'config-path') return 'custom/config.yml';
        return '';
      });

      const result = validateInputs();
      expect(result.configPath).toBe('custom/config.yml');
    });

    it('should trim whitespace from config path', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken123';
        if (name === 'config-path') return '  .github/custom.yml  ';
        return '';
      });

      const result = validateInputs();
      expect(result.configPath).toBe('.github/custom.yml');
    });

    it('should reject paths with .. (directory traversal)', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken123';
        if (name === 'config-path') return '../malicious/config.yml';
        return '';
      });

      expect(() => validateInputs()).toThrow(
        'Config path non sicuro: "../malicious/config.yml". Usa path relativi senza ".." o path assoluti.'
      );
    });

    it('should reject absolute paths starting with /', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken123';
        if (name === 'config-path') return '/etc/passwd';
        return '';
      });

      expect(() => validateInputs()).toThrow(
        'Config path non sicuro: "/etc/passwd". Usa path relativi senza ".." o path assoluti.'
      );
    });

    it('should warn for non-YAML extensions', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken123';
        if (name === 'config-path') return 'config.txt';
        return '';
      });
      (core.warning as jest.Mock).mockImplementation(() => {});

      validateInputs();
      expect(core.warning).toHaveBeenCalledWith(
        'Config path "config.txt" non termina con .yml/.yaml. Assicurati che sia un file YAML.'
      );
    });

    it('should accept .yaml extension', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken123';
        if (name === 'config-path') return 'config.yaml';
        return '';
      });
      (core.warning as jest.Mock).mockImplementation(() => {});

      const result = validateInputs();
      expect(result.configPath).toBe('config.yaml');
      expect(core.warning).not.toHaveBeenCalled();
    });
  });

  describe('Marker validation', () => {
    it('should return the default marker', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken123';
        if (name === 'config-path') return '.github/scope-mate.yml';
        return '';
      });

      const result = validateInputs();
      expect(result.marker).toBe('<!-- checkwise-marker -->');
    });
  });

  describe('Complete validation flow', () => {
    it('should return all validated inputs for valid configuration', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken123';
        if (name === 'config-path') return 'custom/config.yml';
        return '';
      });

      const result = validateInputs();
      expect(result).toEqual({
        token: 'ghp_validtoken123',
        configPath: 'custom/config.yml',
        marker: '<!-- checkwise-marker -->'
      });
    });
  });
});
