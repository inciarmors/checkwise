import { runAction } from '../src/main';

describe('runAction (pure orchestration)', () => {
  const baseDeps = {
    core: { info: jest.fn(), debug: jest.fn() },
    github: { context: { repo: { owner: 'o', repo: 'r' }, payload: { pull_request: { number: 1 } }, eventName: 'pull_request' } },
    loadConfig: jest.fn(() => ({ checklists: [{ when: ['src/**'], require: ['A'] }] })),
    getChangedFiles: jest.fn(() => ['src/file.ts']),
    findCheckwiseComment: jest.fn(() => null),
    createComment: jest.fn(),
    updateComment: jest.fn(),
    getMatchingRules: jest.fn((files, rules) => rules),
    generateChecklistMarkdown: jest.fn(() => 'md'),
    validateInputs: jest.fn(() => ({ token: 't', configPath: 'c', marker: '<!-- m -->' }))
  };

  it('runs happy path (new comment)', async () => {
  const setCommitStatus = jest.fn();
  const deps = { ...baseDeps, findCheckwiseComment: jest.fn(() => null), setCommitStatus };
  await runAction(deps);
  expect(setCommitStatus).toHaveBeenCalled();
    expect(deps.createComment).toHaveBeenCalled();
    expect(deps.updateComment).not.toHaveBeenCalled();
  });

  it('runs happy path (update comment)', async () => {
  const setCommitStatus = jest.fn();
  const deps = { ...baseDeps, findCheckwiseComment: jest.fn(() => ({ id: 1, body: 'old' })), createComment: jest.fn(), setCommitStatus };
  await runAction(deps);
  expect(setCommitStatus).toHaveBeenCalled();
    expect(deps.updateComment).toHaveBeenCalled();
  // createComment can be called if update fails, so we do not assert that it is not called
  });

  it('skips if no changed files', async () => {
  const setCommitStatus = jest.fn();
  const deps = { ...baseDeps, getChangedFiles: jest.fn(() => []), setCommitStatus };
  await runAction(deps);
  expect(setCommitStatus).not.toHaveBeenCalled();
  expect(deps.core.info).toHaveBeenCalledWith(expect.stringContaining('No changed files'));
  });

  it('skips if no matching rules', async () => {
  const setCommitStatus = jest.fn();
  const deps = { ...baseDeps, getMatchingRules: jest.fn(() => []), setCommitStatus };
  await runAction(deps);
  expect(setCommitStatus).not.toHaveBeenCalled();
  expect(deps.core.info).toHaveBeenCalledWith(expect.stringContaining('No rules matched'));
  });

  it('throws if github.context.repo missing', async () => {
    const deps = { ...baseDeps, github: { context: { repo: undefined, payload: { pull_request: { number: 1 } }, eventName: 'pull_request' } } };
  await expect(runAction(deps)).rejects.toThrow('GitHub context not available');
  });

  it('throws if owner/repo missing', async () => {
    const deps = { ...baseDeps, github: { context: { repo: { owner: '', repo: '' }, payload: { pull_request: { number: 1 } }, eventName: 'pull_request' } } };
  await expect(runAction(deps)).rejects.toThrow('Repository context is incomplete');
  });

  it('throws if PR number missing', async () => {
    const deps = { ...baseDeps, github: { context: { repo: { owner: 'o', repo: 'r' }, payload: {}, eventName: 'pull_request' } } };
  await expect(runAction(deps)).rejects.toThrow('Unable to determine the Pull Request number');
  });

  it('throws if PR number invalid', async () => {
    const deps = { ...baseDeps, github: { context: { repo: { owner: 'o', repo: 'r' }, payload: { pull_request: { number: 0 } }, eventName: 'pull_request' } } };
  await expect(runAction(deps)).rejects.toThrow('Unable to determine the Pull Request number');
  });

  it('throws if config throws', async () => {
    const deps = { ...baseDeps, loadConfig: jest.fn(() => { throw new Error('fail'); }) };
    await expect(runAction(deps)).rejects.toThrow('fail');
  });

  it('throws if getChangedFiles throws', async () => {
    const deps = { ...baseDeps, getChangedFiles: jest.fn(() => { throw new Error('fail2'); }) };
    await expect(runAction(deps)).rejects.toThrow('fail2');
  });

  it('throws if updateComment throws', async () => {
    const deps = { ...baseDeps, findCheckwiseComment: jest.fn(() => ({ id: 1, body: 'old' })), updateComment: jest.fn(() => { throw new Error('fail3'); }) };
    await expect(runAction(deps)).rejects.toThrow('fail3');
  });

  it('throws if createComment throws', async () => {
    const deps = { ...baseDeps, findCheckwiseComment: jest.fn(() => null), createComment: jest.fn(() => { throw new Error('fail4'); }) };
    await expect(runAction(deps)).rejects.toThrow('fail4');
  });

  //  Test for additional edge cases
  describe('Additional edge cases for 100% coverage', () => {
    it('handles PR number as string correctly', async () => {
      const deps = { 
        ...baseDeps, 
        github: { 
          context: { 
            repo: { owner: 'o', repo: 'r' }, 
            payload: { pull_request: { number: "123" as any } }, // String number 
            eventName: 'pull_request' 
          } 
        } 
      };
  await expect(runAction(deps)).rejects.toThrow('Invalid PR number');
    });

    it('handles negative PR number', async () => {
      const deps = { 
        ...baseDeps, 
        github: { 
          context: { 
            repo: { owner: 'o', repo: 'r' }, 
            payload: { pull_request: { number: -1 } }, 
            eventName: 'pull_request' 
          } 
        } 
      };
  await expect(runAction(deps)).rejects.toThrow('Invalid PR number');
    });

    it('logs debug information for changed files', async () => {
      const deps = { 
        ...baseDeps, 
        getChangedFiles: jest.fn(() => ['src/file1.ts', 'src/file2.ts']),
        setCommitStatus: jest.fn(),
      };
      await runAction(deps);
  expect(deps.core.debug).toHaveBeenCalledWith(expect.stringContaining('Files: src/file1.ts, src/file2.ts'));
    });

    it('logs correct info for file count and rules count', async () => {
      const deps = { 
        ...baseDeps, 
        getChangedFiles: jest.fn(() => ['file1.ts', 'file2.ts', 'file3.ts']),
        loadConfig: jest.fn(() => ({ checklists: [{ when: ['**'], require: ['Test1'] }, { when: ['**'], require: ['Test2'] }] })),
        getMatchingRules: jest.fn(() => [{ when: ['**'], require: ['Test1'] }, { when: ['**'], require: ['Test2'] }]),
        setCommitStatus: jest.fn(),
      };
      await runAction(deps);
  expect(deps.core.info).toHaveBeenCalledWith(expect.stringContaining('Changed files detected: 3'));
  expect(deps.core.info).toHaveBeenCalledWith(expect.stringContaining('Matched rules: 2'));
    });

    it('provides detailed error message for PR context with available payload keys', async () => {
      const deps = { 
        ...baseDeps, 
        github: { 
          context: { 
            repo: { owner: 'o', repo: 'r' }, 
            payload: { push: { head: {} }, workflow: {} }, // Different payload structure
            eventName: 'push' 
          } 
        } 
      };
  await expect(runAction(deps)).rejects.toThrow(/Payload available: push, workflow/);
    });
  });
});
