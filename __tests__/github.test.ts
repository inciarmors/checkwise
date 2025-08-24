import * as githubApi from '../src/github';
import * as github from '@actions/github';

jest.mock('@actions/github');

const mockGetOctokit = github.getOctokit as jest.Mock;

describe('github.ts', () => {
  let octokit: any;

  beforeEach(() => {
    octokit = {
      rest: {
        pulls: {
          listFiles: jest.fn(),
        },
        issues: {
          listComments: jest.fn(),
          createComment: jest.fn(),
          updateComment: jest.fn(),
        },
      },
    };
    mockGetOctokit.mockReturnValue(octokit);
    // Mock context.repo
    (github.context as any).repo = { owner: 'test-owner', repo: 'test-repo' };
    (github.context as any).payload = { pull_request: { number: 42 } };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getChangedFiles returns all files (single page)', async () => {
    octokit.rest.pulls.listFiles.mockResolvedValueOnce({
      data: [
        { filename: 'src/a.ts' },
        { filename: 'src/b.ts' },
      ],
    });
    const files = await githubApi.getChangedFiles('token', 42);
    expect(files).toEqual(['src/a.ts', 'src/b.ts']);
    expect(octokit.rest.pulls.listFiles).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      pull_number: 42,
      per_page: 100,
      page: 1,
    });
  });

  it('getChangedFiles handles pagination', async () => {
    octokit.rest.pulls.listFiles
      .mockResolvedValueOnce({
        data: Array(100).fill({ filename: 'src/a.ts' }),
      })
      .mockResolvedValueOnce({
        data: [{ filename: 'src/b.ts' }],
      });
    const files = await githubApi.getChangedFiles('token', 42);
    expect(files.length).toBe(101);
    expect(octokit.rest.pulls.listFiles).toHaveBeenCalledTimes(2);
  });

  it('findCheckwiseComment returns the comment if marker is found', async () => {
    octokit.rest.issues.listComments.mockResolvedValueOnce({
      data: [
        { id: 1, body: 'foo' },
        { id: 2, body: 'bar <!-- checkwise-marker -->' },
      ],
    });
    const comment = await githubApi.findCheckwiseComment('token', 42, '<!-- checkwise-marker -->');
    expect(comment).toEqual({ id: 2, body: 'bar <!-- checkwise-marker -->' });
  });

  it('findCheckwiseComment returns null if marker is not found', async () => {
    octokit.rest.issues.listComments.mockResolvedValueOnce({
      data: [
        { id: 1, body: 'foo' },
        { id: 2, body: 'bar' },
      ],
    });
    const comment = await githubApi.findCheckwiseComment('token', 42, '<!-- checkwise-marker -->');
    expect(comment).toBeNull();
  });

  it('createComment calls the API with correct params', async () => {
    await githubApi.createComment('token', 42, 'hello');
    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 42,
      body: 'hello',
    });
  });

  it('updateComment calls the API with correct params', async () => {
    await githubApi.updateComment('token', 123, 'updated');
    expect(octokit.rest.issues.updateComment).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      comment_id: 123,
      body: 'updated',
    });
  });

  it('throws a clear error on rate limit exceeded', async () => {
  octokit.rest.pulls.listFiles.mockRejectedValueOnce({
    status: 403,
    message: 'API rate limit exceeded for user',
  });
  await expect(githubApi.getChangedFiles('token', 42)).rejects.toThrow(
    /GitHub API rate limit exceeded/
  );
  });

  it('retries on network error and eventually throws', async () => {
  octokit.rest.pulls.listFiles
    .mockRejectedValueOnce({ code: 'ECONNRESET' })
    .mockRejectedValueOnce({ code: 'ECONNRESET' })
    .mockRejectedValueOnce({ code: 'ECONNRESET' }); // 3 tentativi

  await expect(githubApi.getChangedFiles('token', 42)).rejects.toThrow(
    /Network error while contacting GitHub API/
  );
  });


 it('rethrows unknown errors', async () => {
  octokit.rest.pulls.listFiles.mockRejectedValueOnce(new Error('Some other error'));
  await expect(githubApi.getChangedFiles('token', 42)).rejects.toThrow('Some other error');
 });
});