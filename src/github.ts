
import * as github from '@actions/github';

// Helper to handle rate limiting and network failures
export async function safeApiCall<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      // Rate limit
      if (err.status === 403 && err.message && err.message.includes('rate limit')) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
      // Network error
      if (['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(err.code)) {
        if (attempt < retries) {
          await new Promise(res => setTimeout(res, 1000 * (attempt + 1)));
          continue; // Retry
        }
        throw new Error('Network error while contacting GitHub API. Please retry.');
      }
  // Other errors: rethrow
  throw err;
    }
  }
  throw lastErr;
}

export async function getChangedFiles(token: string, prNumber: number): Promise<string[]> {
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  let files: string[] = [];
  let page = 1;
  const per_page = 100;

  while (true) {
    const resp = await safeApiCall(() =>
      octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
        per_page,
        page,
      })
    );
    files.push(...resp.data.map((f: any) => f.filename));
    if (resp.data.length < per_page) break;
    page++;
  }
  return files;
}

/**
 * Finds an existing Checkwise comment in the PR (using a unique marker).
 */
export async function findCheckwiseComment(token: string, prNumber: number, marker: string): Promise<{id: number, body: string} | null> {
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  const comments = await safeApiCall(() =>
    octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
      per_page: 100,
    })
  );
  for (const c of comments.data) {
    if (c.body && c.body.includes(marker)) {
      return { id: c.id, body: c.body };
    }
  }
  return null;
}

/**
 * Creates a new comment in the PR.
 */
export async function createComment(token: string, prNumber: number, body: string) {
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  await safeApiCall(() =>
    octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    })
  );
}

/**
 * Updates an existing comment in the PR.
 */
export async function updateComment(token: string, commentId: number, body: string) {
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  await safeApiCall(() =>
    octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: commentId,
      body,
    })
  );
}