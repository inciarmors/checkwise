import micromatch from 'micromatch';
import { ChecklistRule } from './config';

/**
 * Returns the rules that match at least one changed file.
 * In case of conflict (multiple rules match the same file), the rule with the lowest priority comes first.
 * @param changedFilePaths List of files changed in the PR
 * @param rules Array of checklist rules from the config
 * @returns Only the rules that match at least one file
 */

export function getMatchingRules(
  changedFilePaths: string[],
  rules: ChecklistRule[]
): ChecklistRule[] {
  const matched = rules.filter(rule => {
    return micromatch(changedFilePaths, rule.when).length > 0;
  });
  // Sort by ascending priority (default 1000)
  return matched.sort((a, b) => {
    const pa = typeof a.priority === 'number' ? a.priority : 1000;
    const pb = typeof b.priority === 'number' ? b.priority : 1000;
    return pa - pb;
  });
}