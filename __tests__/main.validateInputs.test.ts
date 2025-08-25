import * as core from '@actions/core';
import * as github from '@actions/github';

jest.mock('@actions/core');
jest.mock('@actions/github');

describe('validateInputs', () => {
  let validateInputs: any;

  beforeEach(async () => {
    jest.clearAllMocks();
  // Import after mocking dependencies
    validateInputs = (await import('../src/main')).validateInputs;
  });

  describe('GitHub token validation', () => {
    it('should accept valid GitHub tokens', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
      if (name === 'github-token') return 'ghp_validtoken123';
      if (name === 'config-path') return '.github/checkwise.yml';
      return '';
      });

      const result = validateInputs();
      expect(result.token).toBe('ghp_validtoken123');
    });

    it('should accept GitHub App tokens', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
      if (name === 'github-token') return 'ghs_apptoken123';
      if (name === 'config-path') return '.github/checkwise.yml';
      return '';
      });

      const result = validateInputs();
      expect(result.token).toBe('ghs_apptoken123');
    });

    it('should accept fine-grained personal access tokens', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
      if (name === 'github-token') return 'github_pat_validtoken123';
      if (name === 'config-path') return '.github/checkwise.yml';
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

  expect(() => validateInputs()).toThrow('Input "github-token" is required and cannot be empty');
    });

    it('should throw error for whitespace-only token', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return '   ';
        return '';
      });

  expect(() => validateInputs()).toThrow('Input "github-token" is required and cannot be empty');
    });

    it('should warn for unexpected token format', () => {
        (core.getInput as jest.Mock).mockImplementation((name: string) => {
          if (name === 'github-token') return 'invalid_format_token';
          if (name === 'config-path') return '.github/checkwise.yml';
          return '';
        });
      (core.warning as jest.Mock).mockImplementation(() => {});

      validateInputs();
      expect(core.warning).toHaveBeenCalledWith(
        'Unexpected GitHub token format. Make sure you are using a valid token.'
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
        expect(result.configPath).toBe('.github/checkwise.yml');
        expect(core.info).toHaveBeenCalledWith(
          'No config-path specified, using default: .github/checkwise.yml'
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
        'Unsafe config path: "../malicious/config.yml". Use relative paths without ".." or absolute paths.'
      );
    });

    it('should reject absolute paths starting with /', () => {
      (core.getInput as jest.Mock).mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken123';
        if (name === 'config-path') return '/etc/passwd';
        return '';
      });

      expect(() => validateInputs()).toThrow(
        'Unsafe config path: "/etc/passwd". Use relative paths without ".." or absolute paths.'
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
        'Config path "config.txt" does not end with .yml/.yaml. Make sure it is a YAML file.'
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
          if (name === 'config-path') return '.github/checkwise.yml';
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
