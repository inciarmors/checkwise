
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
import { CheckwiseCfg } from './config';

/**
 * Replaces the variables {{var}} in a template string.
 */
function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => vars[key] ?? '');
}

/**
 * Generates the markdown checklist using global and/or per-rule custom templates.
 * Supported variables: {{ruleTitle}}, {{items}}, {{index}}
 */
export function generateChecklistMarkdown(
  rules: ChecklistRule[],
  previousState?: Record<string, boolean>,
  globalTemplate?: string
): string {
  if (!rules.length) {
    return '_No checklist required for the files changed in this PR._';
  }

  let md = '';
  rules.forEach((rule, idx) => {
    // Determines the template to use: per-rule > global > default
    const template = rule.template || globalTemplate;
    // Generates the markdown checklist items
    const itemsMd = rule.require.map(item => {
      const checked = previousState && previousState[item.trim()] === true;
      return `- [${checked ? 'x' : ' '}] ${item}`;
    }).join('\n');
    if (template) {
      md += applyTemplate(template, {
        ruleTitle: rules.length > 1 ? `Rule #${idx + 1}` : '',
        items: itemsMd,
        index: String(idx + 1)
      }) + '\n\n';
    } else {
      if (rules.length > 1) {
        md += `**Rule #${idx + 1}:**\n`;
      }
      md += itemsMd + '\n\n';
    }
  });
  return md.trim();
}