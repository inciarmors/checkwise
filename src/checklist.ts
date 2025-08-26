
import { ChecklistRule } from './config';

/**
 * Parses a markdown checklist and returns a map of item text to checked state.
 * Only parses lines starting with '- [ ]' or '- [x]'.
 * @param markdown The markdown string from the previous comment
 * @returns Record<string, boolean> where key is the checklist item text
 */
export function parseChecklistStateFromMarkdown(markdown: string): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  const checklistLine = /^- \[( |x|X)\] (.+)$/gm;
  let match;
  while ((match = checklistLine.exec(markdown)) !== null) {
    // match[1]: ' ' or 'x' or 'X', match[2]: item text
    state[match[2].trim()] = match[1].toLowerCase() === 'x';
  }
  return state;
}

/**
 * Generates a markdown checklist from the matched rules, preserving checked state if provided.
 * @param rules Array of matched rules
 * @param previousState Optional: map of checklist item text to checked state
 * @returns Markdown string ready to be inserted in a PR comment
 */
export function generateChecklistMarkdown(
  rules: ChecklistRule[],
  previousState?: Record<string, boolean>
): string {
  if (!rules.length) {
    return '_No checklist required for the files changed in this PR._';
  }

  let md = '## Automated Checklist\n\n';
  rules.forEach((rule, idx) => {
    if (rules.length > 1) {
      md += `**Rule #${idx + 1}:**\n`;
    }
    rule.require.forEach(item => {
      // If previous state exists and item was checked, preserve it
      const checked = previousState && previousState[item.trim()] === true;
      md += `- [${checked ? 'x' : ' '}] ${item}\n`;
    });
    md += '\n';
  });
  return md.trim();
}