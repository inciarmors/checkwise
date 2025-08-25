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
    .mockRejectedValueOnce({ code: 'ECONNRESET' }); // 3 attempts

  await expect(githubApi.getChangedFiles('token', 42)).rejects.toThrow(
    /Network error while contacting GitHub API/
  );
  });


 it('rethrows unknown errors', async () => {
  octokit.rest.pulls.listFiles.mockRejectedValueOnce(new Error('Some other error'));
  await expect(githubApi.getChangedFiles('token', 42)).rejects.toThrow('Some other error');
 });

 //  Test all branches of safeApiCall
 describe('safeApiCall edge cases', () => {
   it('handles ETIMEDOUT network error with retry', async () => {
     octokit.rest.pulls.listFiles
       .mockRejectedValueOnce({ code: 'ETIMEDOUT' })
       .mockResolvedValueOnce({ data: [{ filename: 'test.ts' }] });
     
     const files = await githubApi.getChangedFiles('token', 42);
     expect(files).toEqual(['test.ts']);
     expect(octokit.rest.pulls.listFiles).toHaveBeenCalledTimes(2);
   });

   it('handles ENOTFOUND network error', async () => {
     octokit.rest.pulls.listFiles
       .mockRejectedValueOnce({ code: 'ENOTFOUND' })
       .mockRejectedValueOnce({ code: 'ENOTFOUND' })
       .mockRejectedValueOnce({ code: 'ENOTFOUND' });
     await expect(githubApi.getChangedFiles('token', 42)).rejects.toThrow(
       /Network error while contacting GitHub API/
     );
   });

   it('handles non-network, non-rate-limit errors immediately', async () => {
     const customError = new Error('Permission denied');
     (customError as any).status = 401;
     octokit.rest.pulls.listFiles.mockRejectedValueOnce(customError);
     
     await expect(githubApi.getChangedFiles('token', 42)).rejects.toThrow('Permission denied');
     expect(octokit.rest.pulls.listFiles).toHaveBeenCalledTimes(1); // No retry
   });
 });

 //  Test findCheckwiseComment edge cases
 describe('findCheckwiseComment edge cases', () => {
   it('handles comments with null body', async () => {
     octokit.rest.issues.listComments.mockResolvedValueOnce({
       data: [
         { id: 1, body: null },
         { id: 2, body: undefined },
         { id: 3, body: 'valid <!-- checkwise-marker -->' },
       ],
     });
     
     const comment = await githubApi.findCheckwiseComment('token', 42, '<!-- checkwise-marker -->');
     expect(comment).toEqual({ id: 3, body: 'valid <!-- checkwise-marker -->' });
   });

   it('returns null when no comments exist', async () => {
     octokit.rest.issues.listComments.mockResolvedValueOnce({ data: [] });
     const comment = await githubApi.findCheckwiseComment('token', 42, '<!-- checkwise-marker -->');
     expect(comment).toBeNull();
   });
 });

 //  Test for other GitHub API functions
 describe('createComment and updateComment with safeApiCall', () => {
   it('createComment handles rate limit error', async () => {
     octokit.rest.issues.createComment.mockRejectedValueOnce({
       status: 403,
       message: 'API rate limit exceeded',
     });
     
     await expect(githubApi.createComment('token', 42, 'test')).rejects.toThrow(
       /GitHub API rate limit exceeded/
     );
   });

   it('updateComment handles network error with retry', async () => {
     octokit.rest.issues.updateComment
       .mockRejectedValueOnce({ code: 'ECONNRESET' })
       .mockResolvedValueOnce({ data: {} });
     
     await githubApi.updateComment('token', 123, 'updated');
     expect(octokit.rest.issues.updateComment).toHaveBeenCalledTimes(2);
   });
 });

 //  Additional edge cases for 85%+ coverage
 describe('safeApiCall advanced edge cases', () => {
   it('handles 403 error without rate limit message (immediate throw)', async () => {
     const error = new Error('Forbidden - insufficient permissions');
     (error as any).status = 403;
     octokit.rest.pulls.listFiles.mockRejectedValueOnce(error);
     
     await expect(githubApi.getChangedFiles('token', 42)).rejects.toThrow('Forbidden - insufficient permissions');
     expect(octokit.rest.pulls.listFiles).toHaveBeenCalledTimes(1); // No retry
   });

   it('handles 403 error without message at all (immediate throw)', async () => {
     const error = new Error('Forbidden');
     (error as any).status = 403;
     octokit.rest.pulls.listFiles.mockRejectedValueOnce(error);
     
     await expect(githubApi.getChangedFiles('token', 42)).rejects.toThrow('Forbidden');
     expect(octokit.rest.pulls.listFiles).toHaveBeenCalledTimes(1); // No retry
   });

   it('handles error on last retry attempt (throw lastErr path)', async () => {
     const customError = new Error('Final attempt failed');
     octokit.rest.pulls.listFiles
       .mockRejectedValueOnce({ code: 'ETIMEDOUT' })
       .mockRejectedValueOnce({ code: 'ETIMEDOUT' })
       .mockRejectedValueOnce(customError); // Third attempt fails with different error
     
     await expect(githubApi.getChangedFiles('token', 42)).rejects.toThrow('Final attempt failed');
   });

   it('handles network error on exact retry limit', async () => {
     octokit.rest.pulls.listFiles
       .mockRejectedValueOnce({ code: 'ECONNRESET' })
       .mockRejectedValueOnce({ code: 'ECONNRESET' })
       .mockRejectedValueOnce({ code: 'ECONNRESET' }); // 3 attempts total (0, 1, 2)
     
     await expect(githubApi.getChangedFiles('token', 42)).rejects.toThrow(/Network error while contacting GitHub API/);
   });

   it('covers rate limit check branches completely', async () => {
     // Test err.status === 403 && err.message && err.message.includes('rate limit')
     const rateLimitError = {
       status: 403,
       message: 'Primary rate limit exceeded for API rate limit exceeded'
     };
     octokit.rest.pulls.listFiles.mockRejectedValueOnce(rateLimitError);
     
     await expect(githubApi.getChangedFiles('token', 42)).rejects.toThrow(/GitHub API rate limit exceeded/);
   });
 });

 // getChangedFiles pagination edge cases
 describe('getChangedFiles pagination coverage', () => {
   it('handles exact per_page boundary (100 files)', async () => {
     octokit.rest.pulls.listFiles
       .mockResolvedValueOnce({
         data: Array(100).fill(null).map((_, i) => ({ filename: `file${i}.ts` })),
       })
       .mockResolvedValueOnce({
         data: [], // Empty second page
       });
     
     const files = await githubApi.getChangedFiles('token', 42);
     expect(files.length).toBe(100);
     expect(octokit.rest.pulls.listFiles).toHaveBeenCalledTimes(2);
   });

   it('handles single file response (less than per_page)', async () => {
     octokit.rest.pulls.listFiles.mockResolvedValueOnce({
       data: [{ filename: 'single.ts' }],
     });
     
     const files = await githubApi.getChangedFiles('token', 42);
     expect(files).toEqual(['single.ts']);
     expect(octokit.rest.pulls.listFiles).toHaveBeenCalledTimes(1);
   });
 });
});