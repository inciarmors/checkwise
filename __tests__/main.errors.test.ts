import * as core from '@actions/core';
import * as github from '@actions/github';

describe('main.ts error handling', () => {
  let run: any;
  beforeEach(async () => {
    jest.clearAllMocks();
    run = (await import('../src/main')).run;
  });

  it('should fail if github context.repo is missing', async () => {
    (github as any).context = { repo: undefined, payload: { pull_request: { number: 1 } }, eventName: 'pull_request' };
    jest.spyOn(core, 'getInput').mockImplementation((name: string) => 'ghp_token');
    jest.spyOn(core, 'setFailed').mockImplementation(() => {});
    await run();
  expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('GitHub context not available'));
  });

  it('should fail if owner or repo is missing', async () => {
    (github as any).context = { repo: { owner: '', repo: '' }, payload: { pull_request: { number: 1 } }, eventName: 'pull_request' };
    jest.spyOn(core, 'getInput').mockImplementation((name: string) => 'ghp_token');
    jest.spyOn(core, 'setFailed').mockImplementation(() => {});
    await run();
  expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Repository context is incomplete'));
  });

  it('should fail if PR number is missing', async () => {
    (github as any).context = { repo: { owner: 'a', repo: 'b' }, payload: {}, eventName: 'pull_request' };
    jest.spyOn(core, 'getInput').mockImplementation((name: string) => 'ghp_token');
    jest.spyOn(core, 'setFailed').mockImplementation(() => {});
    await run();
  expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Unable to determine the Pull Request number'));
  });

  it('should fail if PR number is invalid (0)', async () => {
    (github as any).context = { repo: { owner: 'a', repo: 'b' }, payload: { pull_request: { number: 0 } }, eventName: 'pull_request' };
    jest.spyOn(core, 'getInput').mockImplementation((name: string) => 'ghp_token');
    jest.spyOn(core, 'setFailed').mockImplementation(() => {});
    await run();
  expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Unable to determine the Pull Request number'));
  });

  // Test for specific branches of validateInputs
  describe('validateInputs edge cases', () => {
    let originalConsoleError: any;
    let validateInputs: any;

    beforeEach(async () => {
      originalConsoleError = console.error;
      console.error = jest.fn();
      validateInputs = (await import('../src/main')).validateInputs;
    });

    afterEach(() => {
      console.error = originalConsoleError;
    });

    it('should warn on non-standard token format', () => {
      jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
        if (name === 'github-token') return 'invalid_token_format';
        return '';
      });
      jest.spyOn(core, 'warning').mockImplementation(() => {});
      jest.spyOn(core, 'info').mockImplementation(() => {});

      const result = validateInputs();
  expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Unexpected GitHub token format'));
      expect(result.token).toBe('invalid_token_format');
    });

    it('should handle path traversal in config-path', () => {
      jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken';
        if (name === 'config-path') return '../../../etc/passwd';
        return '';
      });

  expect(() => validateInputs()).toThrow(/Unsafe config path/);
    });

    it('should handle absolute path in config-path', () => {
      jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken';
        if (name === 'config-path') return '/etc/passwd';
        return '';
      });

  expect(() => validateInputs()).toThrow(/Unsafe config path/);
    });

    it('should warn for non-yaml config extension', () => {
      jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken';
        if (name === 'config-path') return 'config.json';
        return '';
      });
      jest.spyOn(core, 'warning').mockImplementation(() => {});
      jest.spyOn(core, 'info').mockImplementation(() => {});

      const result = validateInputs();
  expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('does not end with .yml/.yaml'));
      expect(result.configPath).toBe('config.json');
    });

    it('should use default config path when input is empty', () => {
      jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
        if (name === 'github-token') return 'ghp_validtoken';
        if (name === 'config-path') return '';
        return '';
      });
      jest.spyOn(core, 'info').mockImplementation(() => {});

      const result = validateInputs();
  expect(core.info).toHaveBeenCalledWith(expect.stringContaining('using default: .github/checkwise.yml'));
      expect(result.configPath).toBe('.github/checkwise.yml');
    });
  });

  //  Test for different error types in run()
  describe('run() error context logging', () => {
    it('should provide pull request suggestion for PR-related errors', async () => {
      (github as any).context = { repo: { owner: 'a', repo: 'b' }, payload: {}, eventName: 'push' };
      jest.spyOn(core, 'getInput').mockImplementation((name: string) => 'ghp_token');
      jest.spyOn(core, 'setFailed').mockImplementation(() => {});
      jest.spyOn(core, 'error').mockImplementation(() => {});
      jest.spyOn(core, 'debug').mockImplementation(() => {});

      await run();
      
  expect(core.error).toHaveBeenCalledWith(expect.stringContaining('Tip: Make sure the workflow is triggered on pull_request events'));
    });

    it('should provide token suggestion for token-related errors', async () => {
      (github as any).context = { repo: { owner: 'a', repo: 'b' }, payload: { pull_request: { number: 1 } }, eventName: 'pull_request' };
      jest.spyOn(core, 'getInput').mockImplementation((name: string) => '');
      jest.spyOn(core, 'setFailed').mockImplementation(() => {});
      jest.spyOn(core, 'error').mockImplementation(() => {});
      jest.spyOn(core, 'debug').mockImplementation(() => {});

      await run();
      
  expect(core.error).toHaveBeenCalledWith(expect.stringContaining('Tip: Check that github-token is configured correctly'));
    });
  });
});
