import * as githubModule from '../src/github';
import * as github from '@actions/github';

describe('github.ts error handling', () => {
  const token = 'ghp_testtoken';
  const prNumber = 123;
  const marker = '<!-- checkwise-marker -->';
  const owner = 'test-owner';
  const repo = 'test-repo';

  beforeEach(() => {
    jest.clearAllMocks();
    (github as any).context = { repo: { owner, repo } };
  });

  it('safeApiCall: handles rate limit error', async () => {
    const fn = jest.fn().mockRejectedValue({ status: 403, message: 'rate limit exceeded' });
    await expect(githubModule['safeApiCall'](fn)).rejects.toThrow('GitHub API rate limit exceeded');
    expect(fn).toHaveBeenCalled();
  });

  it('safeApiCall: handles network error with retry', async () => {
    const err = { code: 'ECONNRESET' };
    const fn = jest.fn()
      .mockRejectedValueOnce(err)
      .mockResolvedValue('ok');
    const result = await githubModule['safeApiCall'](fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('safeApiCall: throws after max retries', async () => {
    const err = { code: 'ETIMEDOUT' };
    const fn = jest.fn().mockRejectedValue(err);
    await expect(githubModule['safeApiCall'](fn, 1)).rejects.toThrow('Network error while contacting GitHub API');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('safeApiCall: throws other errors', async () => {
    const err = new Error('other');
    const fn = jest.fn().mockRejectedValue(err);
    await expect(githubModule['safeApiCall'](fn)).rejects.toThrow('other');
  });

  it('findCheckwiseComment: returns null if no comment matches', async () => {
    const octokit = { rest: { issues: { listComments: jest.fn().mockResolvedValue({ data: [{ body: 'no marker' }] }) } } };
    jest.spyOn(github, 'getOctokit').mockReturnValue(octokit as any);
    const result = await githubModule.findCheckwiseComment(token, prNumber, marker);
    expect(result).toBeNull();
  });

  it('findCheckwiseComment: returns comment if marker found', async () => {
    const octokit = { rest: { issues: { listComments: jest.fn().mockResolvedValue({ data: [{ id: 1, body: marker }] }) } } };
    jest.spyOn(github, 'getOctokit').mockReturnValue(octokit as any);
    const result = await githubModule.findCheckwiseComment(token, prNumber, marker);
    expect(result).toEqual({ id: 1, body: marker });
  });

  it('getChangedFiles: paginates if needed', async () => {
    const octokit = { rest: { pulls: { listFiles: jest.fn()
      .mockResolvedValueOnce({ data: [{ filename: 'a' }, { filename: 'b' }] })
      .mockResolvedValueOnce({ data: [] }) } } };
    jest.spyOn(github, 'getOctokit').mockReturnValue(octokit as any);
    const files = await githubModule.getChangedFiles(token, prNumber);
    expect(files).toEqual(['a', 'b']);
  });

  it('getChangedFiles: handles error from octokit', async () => {
    const octokit = { rest: { pulls: { listFiles: jest.fn().mockRejectedValue(new Error('octokit error')) } } };
    jest.spyOn(github, 'getOctokit').mockReturnValue(octokit as any);
    await expect(githubModule.getChangedFiles('token', 1)).rejects.toThrow('octokit error');
  });

  it('createComment: handles error from octokit', async () => {
    const octokit = { rest: { issues: { createComment: jest.fn().mockRejectedValue(new Error('create error')) } } };
    jest.spyOn(github, 'getOctokit').mockReturnValue(octokit as any);
    await expect(githubModule.createComment('token', 1, 'body')).rejects.toThrow('create error');
  });

  it('updateComment: handles error from octokit', async () => {
    const octokit = { rest: { issues: { updateComment: jest.fn().mockRejectedValue(new Error('update error')) } } };
    jest.spyOn(github, 'getOctokit').mockReturnValue(octokit as any);
    await expect(githubModule.updateComment('token', 1, 'body')).rejects.toThrow('update error');
  });

  it('setCommitStatus: handles error from octokit', async () => {
    const octokit = {
      rest: {
        pulls: { get: jest.fn().mockRejectedValue(new Error('pull error')) },
        repos: { createCommitStatus: jest.fn() }
      }
    };
    jest.spyOn(github, 'getOctokit').mockReturnValue(octokit as any);
    await expect(githubModule.setCommitStatus('token', 1, 'success', 'desc')).rejects.toThrow('pull error');
  });
  it('setCommitStatus: handles error from createCommitStatus', async () => {
    const octokit = {
      rest: {
        pulls: { get: jest.fn().mockResolvedValue({ data: { head: { sha: 'sha' } } }) },
        repos: { createCommitStatus: jest.fn().mockRejectedValue(new Error('status error')) }
      }
    };
    jest.spyOn(github, 'getOctokit').mockReturnValue(octokit as any);
    await expect(githubModule.setCommitStatus('token', 1, 'success', 'desc')).rejects.toThrow('status error');
  });
});
