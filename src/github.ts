import * as github from '@actions/github';

export async function getChangedFiles(token: string, prNumber: number): Promise<string[]> {
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  let files: string[] = [];
  let page = 1;
  const per_page = 100;

  while (true) {
    const resp = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page,
      page,
    });
    files.push(...resp.data.map(f => f.filename));
    if (resp.data.length < per_page) break;
    page++;
  }
  return files;
}

/**
 * Trova un commento esistente di Checkwise nella PR (usando un marker unico).
 */
export async function findCheckwiseComment(token: string, prNumber: number, marker: string): Promise<{id: number, body: string} | null> {
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  const comments = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  });
  for (const c of comments.data) {
    if (c.body && c.body.includes(marker)) {
      return { id: c.id, body: c.body };
    }
  }
  return null;
}

/**
 * Crea un nuovo commento nella PR.
 */
export async function createComment(token: string, prNumber: number, body: string) {
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
}

/**
 * Aggiorna un commento esistente nella PR.
 */
export async function updateComment(token: string, commentId: number, body: string) {
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  await octokit.rest.issues.updateComment({
    owner,
    repo,
    comment_id: commentId,
    body,
  });
}