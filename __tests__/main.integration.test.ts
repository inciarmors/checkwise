import * as core from '@actions/core';
import * as github from '@actions/github';

// 1. Mock fs PRIMA di tutto!
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    readFileSync: (path: string, ...args: any[]) => {
      if (
        typeof path === 'string' &&
        path.includes('integration-config.yml')
      ) {
        return `
checklists:
  - when: ["src/**/*.ts"]
    require: ["Test coverage > 90%"]
`;
      }
      // Per tutti gli altri file, usa il comportamento reale
      return originalFs.readFileSync(path, ...args);
    },
  };
});

jest.mock('@actions/core');
jest.mock('@actions/github');

describe('Checkwise Action Integration', () => {
  let octokit: any;
  let run: any;

  beforeEach(async () => {
  octokit = {
    rest: {
      pulls: { listFiles: jest.fn() },
      issues: {
        listComments: jest.fn(),
        createComment: jest.fn(),
        updateComment: jest.fn(),
      },
    },
  };
  (github.getOctokit as jest.Mock).mockReturnValue(octokit);
  (github.context as any).repo = { owner: 'test-owner', repo: 'test-repo' };
  (github.context as any).payload = { pull_request: { number: 42 } };
  (core.getInput as jest.Mock).mockImplementation((name: string) => {
    if (name === 'github-token') return 'token';
    if (name === 'config-path') return '__tests__/fixtures/integration-config.yml';
    return '';
  });
  (core.info as jest.Mock).mockImplementation(() => {});
  (core.setFailed as jest.Mock).mockImplementation(() => {});

  // Importa run DOPO aver mockato tutto
  run = (await import('../src/main')).run;
});

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new checklist comment if none exists', async () => {
    octokit.rest.pulls.listFiles.mockResolvedValueOnce({
      data: [{ filename: 'src/index.ts' }],
    });
    octokit.rest.issues.listComments.mockResolvedValueOnce({ data: [] });
    octokit.rest.issues.createComment.mockResolvedValueOnce({});

    await run();

    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('Test coverage > 90%'),
      })
    );
  });

  it('updates an existing checklist comment', async () => {
    octokit.rest.pulls.listFiles.mockResolvedValueOnce({
      data: [{ filename: 'src/index.ts' }],
    });
    octokit.rest.issues.listComments.mockResolvedValueOnce({
      data: [{ id: 123, body: 'old <!-- checkwise-marker -->' }],
    });
    octokit.rest.issues.updateComment.mockResolvedValueOnce({});

    await run();

    expect(octokit.rest.issues.updateComment).toHaveBeenCalledWith(
      expect.objectContaining({
        comment_id: 123,
        body: expect.stringContaining('Test coverage > 90%'),
      })
    );
  });

  it('calls setFailed on error', async () => {
    // Mock error nella fase di validazione input
    (core.getInput as jest.Mock).mockImplementation((name: string) => {
      if (name === 'github-token') return ''; // Token vuoto triggera la validazione
      return '';
    });
    await run();
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Input "github-token" è richiesto e non può essere vuoto')
    );
  });
  it('uses default config-path if not provided', async () => {
    (core.getInput as jest.Mock).mockImplementation((name: string) => {
      if (name === 'github-token') return 'token';
      if (name === 'config-path') return '';
      return '';
    });
    octokit.rest.pulls.listFiles.mockResolvedValueOnce({ data: [{ filename: 'src/index.ts' }] });
    octokit.rest.issues.listComments.mockResolvedValueOnce({ data: [] });
    octokit.rest.issues.createComment.mockResolvedValueOnce({});
    await run();
    expect(core.getInput).toHaveBeenCalledWith('config-path');
  });

  it('calls setFailed if PR number is missing', async () => {
    (github.context as any).payload = {};
    await run();
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringMatching(/Pull Request/));
  });

  it('calls setFailed if GitHub context is missing', async () => {
    (github.context as any).repo = null;
    await run();
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringMatching(/GitHub non disponibile/));
  });

  it('calls setFailed if repository context is incomplete', async () => {
    (github.context as any).repo = { owner: '', repo: 'test-repo' };
    await run();
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringMatching(/Repository context incompleto/));
  });

  it('calls setFailed with helpful message for invalid event type', async () => {
    (github.context as any).payload = { issue: { number: 42 } };
    (github.context as any).eventName = 'issues';
    await run();
    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringMatching(/Event: "issues".*pull_request/)
    );
  });

  it('calls setFailed for invalid PR number format', async () => {
    (github.context as any).payload = { pull_request: { number: -1 } };
    await run();
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringMatching(/Numero PR non valido: -1/));
  });

  it('logs helpful context information on success', async () => {
    octokit.rest.pulls.listFiles.mockResolvedValueOnce({
      data: [{ filename: 'src/index.ts' }],
    });
    octokit.rest.issues.listComments.mockResolvedValueOnce({ data: [] });
    octokit.rest.issues.createComment.mockResolvedValueOnce({});

    await run();

    expect(core.info).toHaveBeenCalledWith(
      '✅ Input validati: repo=test-owner/test-repo, PR=#42, config=__tests__/fixtures/integration-config.yml'
    );
  });

  it('skips processing when no files are changed', async () => {
    octokit.rest.pulls.listFiles.mockResolvedValueOnce({ data: [] });

    await run();

    expect(core.info).toHaveBeenCalledWith(
      '⚠️ Nessun file modificato trovato nella PR. Nessuna checklist generata.'
    );
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it('skips processing when no rules match', async () => {
    octokit.rest.pulls.listFiles.mockResolvedValueOnce({
      data: [{ filename: 'README.md' }], // Non matcha src/**/*.ts
    });

    await run();

    expect(core.info).toHaveBeenCalledWith(
      '🎯 Nessuna regola matchata per i file modificati. Nessuna checklist richiesta.'
    );
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
  });
});