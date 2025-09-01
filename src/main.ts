import * as core from '@actions/core';
import * as github from '@actions/github';
import { loadConfig, CheckwiseCfg } from './config';
import { getChangedFiles, findCheckwiseComment, createComment, updateComment, setCommitStatus as realSetCommitStatus } from './github';
import { getMatchingRules } from './matcher';
import { generateChecklistMarkdown, parseChecklistStateFromMarkdown } from './checklist';

/**
 * Validates and normalizes the action inputs.
 * @returns Object with validated inputs
 * @throws Error if inputs are invalid
 */
function validateInputs(): { token: string; configPath: string; marker: string } {
  // 1. Validate GitHub token
  const token = core.getInput('github-token', { required: true });
  if (!token || token.trim().length === 0) {
    throw new Error('Input "github-token" is required and cannot be empty');
  }
  if (!token.startsWith('ghp_') && !token.startsWith('ghs_') && !token.startsWith('github_pat_')) {
    core.warning('Unexpected GitHub token format. Make sure you are using a valid token.');
  }

  // 2. Validate config path
  let configPath = core.getInput('config-path');
  if (!configPath || configPath.trim().length === 0) {
    configPath = '.github/checkwise.yml';
    core.info(`No config-path specified, using default: ${configPath}`);
  } else {
    configPath = configPath.trim();
  }
  // Validate path format
  if (configPath.includes('..') || configPath.startsWith('/')) {
    throw new Error(`Unsafe config path: "${configPath}". Use relative paths without ".." or absolute paths.`);
  }
  if (!configPath.endsWith('.yml') && !configPath.endsWith('.yaml')) {
    core.warning(`Config path "${configPath}" does not end with .yml/.yaml. Make sure it is a YAML file.`);
  }
  // 3. Marker is fixed for now, but can be validated in the future
  const marker = '<!-- checkwise-marker -->';
  return { token, configPath, marker };
}

// Pure testable function
async function runAction({
  core,
  github,
  loadConfig,
  getChangedFiles,
  findCheckwiseComment,
  createComment,
  updateComment,
  getMatchingRules,
  generateChecklistMarkdown,
  validateInputs,
  setCommitStatus = realSetCommitStatus
}: any) {
  // 1. Validate action input
  const { token, configPath, marker } = validateInputs();

  // 2. Validate GitHub PR context BEFORE loading config
  if (!github.context.repo) {
    throw new Error('GitHub context not available. Make sure the action is running in a GitHub repository.');
  }
  const { owner, repo } = github.context.repo;
  if (!owner || !repo) {
    throw new Error(`Repository context is incomplete: owner="${owner}", repo="${repo}"`);
  }
  const prNumber = github.context.payload.pull_request?.number;
  if (!prNumber) {
    const eventName = github.context.eventName;
    throw new Error(
      `Unable to determine the Pull Request number. ` +
      `Event: "${eventName}". Make sure the action is triggered on pull_request events ` +
      `(opened, synchronize, edited, etc.). Payload available: ${Object.keys(github.context.payload).join(', ')}`
    );
  }
  if (typeof prNumber !== 'number' || prNumber <= 0) {
    throw new Error(`Invalid PR number: ${prNumber}. It must be a positive number.`);
  }

  // 3. Load config ONLY after validating context
  const config = loadConfig(configPath);

  core.info(`Inputs validated: repo=${owner}/${repo}, PR=#${prNumber}, config=${configPath}`);

  // 4. Get changed files
  const changedFiles = await getChangedFiles(token, prNumber);

  if (changedFiles.length === 0) {
    core.info('No changed files found in the PR. No checklist generated.');
    return;
  }
  core.info(`Changed files detected: ${changedFiles.length}`);
  core.debug(`Files: ${changedFiles.join(', ')}`);

  // 5. Match rules
  const rules = getMatchingRules(changedFiles, config.checklists);
  if (rules.length === 0) {
    core.info('No rules matched for the changed files. No checklist required.');
    return;
  }
  core.info(`Matched rules: ${rules.length}`);

  // 6. Generate checklist markdown (add hidden marker), preserving checked state if possible
  const startTime = Date.now();
  const existing = await findCheckwiseComment(token, prNumber, marker);
  let previousState: Record<string, boolean> | undefined = undefined;
  if (existing && existing.body) {
    // Parse previous checklist state from the existing comment
    previousState = parseChecklistStateFromMarkdown(existing.body);
  }
  // Passa il template globale se presente
  const globalTemplate = config.options && typeof config.options.template === 'string' ? config.options.template : undefined;
  const executionTime = Date.now() - startTime;
  const checklist = `${marker}\n${generateChecklistMarkdown(rules, previousState, globalTemplate, {
    fileCount: changedFiles.length,
    executionTime: executionTime,
    comment_header: config.options?.comment_header || ''
  })}`;

  // 7. Manage PR comment (idempotent)
  if (existing) {
    await updateComment(token, existing.id, checklist);
    core.info('Checklist updated in the existing comment, preserving checked state.');
  } else {
    await createComment(token, prNumber, checklist);
    core.info('Checklist created as a new comment.');
  }

  // 8. Parse checklist state and publish GitHub status check
  // Parse the final checklist state from the comment just written
  const checklistState = parseChecklistStateFromMarkdown(checklist);
  const allChecked = Object.values(checklistState).length > 0 && Object.values(checklistState).every(Boolean);
  if (allChecked) {
    await setCommitStatus(token, prNumber, 'success', 'All checklist items completed', 'CheckWise');
    core.info('Published GitHub status: success (all checklist items completed)');
  } else {
    await setCommitStatus(token, prNumber, 'failure', 'Checklist incomplete: please complete all items', 'CheckWise');
    core.info('Published GitHub status: failure (checklist incomplete)');
  }
}

// Real entry point, calls the pure function with real dependencies
async function run() {
  try {
    await runAction({
      core,
      github,
      loadConfig,
      getChangedFiles,
      findCheckwiseComment,
      createComment,
      updateComment,
      getMatchingRules,
      generateChecklistMarkdown,
      validateInputs
    });
  } catch (err: any) {
    const errorMessage = err && err.message ? err.message : 'Unknown error';
    const context = {
      eventName: github.context.eventName,
      repoOwner: github.context.repo?.owner,
      repoName: github.context.repo?.repo,
      prNumber: github.context.payload.pull_request?.number,
      hasToken: !!core.getInput('github-token', { required: false })
    };
    core.error(`Checkwise failed: ${errorMessage}`);
    core.debug(`Context: ${JSON.stringify(context, null, 2)}`);
    if (errorMessage.includes('Pull Request')) {
      core.error('Tip: Make sure the workflow is triggered on pull_request events');
    }
    if (errorMessage.includes('token')) {
      core.error('Tip: Check that github-token is configured correctly');
    }
    if (errorMessage.includes('config')) {
      core.error('Tip: Make sure the configuration file exists and is valid');
    }
    core.setFailed(errorMessage);
  }
}

/* istanbul ignore next */
if (require.main === module) {
  run();
}

export { run, runAction, validateInputs };
/* istanbul ignore next */
if (require.main === module) {
  run();
}

