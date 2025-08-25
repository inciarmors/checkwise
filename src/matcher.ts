import micromatch from 'micromatch';
import { ChecklistRule } from './config';

/**
 * Returns the rules that match at least one changed file.
 * @param changedFilePaths List of files changed in the PR
 * @param rules Array of checklist rules from the config
 * @returns Only the rules that match at least one file
 */
export function getMatchingRules(
  changedFilePaths: string[],
  rules: ChecklistRule[]
): ChecklistRule[] {
  return rules.filter(rule => {
    // If at least one file matches one of the rule's glob patterns, the rule is active
    return micromatch(changedFilePaths, rule.when).length > 0;
  });
}