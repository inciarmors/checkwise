import * as core from '@actions/core';
import * as github from '@actions/github';

// 1. Mock fs PRIMA di tutto!
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    readFileSync: () => `
checklists:
  - when: ["src/**/*.ts"]
    require: ["Test coverage > 90%"]
`,
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
    (core.getInput as jest.Mock).mockImplementation(() => { throw new Error('fail'); });
    await run();
    expect(core.setFailed).toHaveBeenCalled();
  });
});