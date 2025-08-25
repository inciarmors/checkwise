"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChecklistMarkdown = generateChecklistMarkdown;
/**
 * Generates a markdown checklist from the matched rules.
 * @param rules Array of matched rules
 * @returns Markdown string ready to be inserted in a PR comment
 */
function generateChecklistMarkdown(rules) {
    if (!rules.length) {
        return '_No checklist required for the files changed in this PR._';
    }
    let md = '## Automated Checklist\n\n';
    rules.forEach((rule, idx) => {
        if (rules.length > 1) {
            md += `**Rule #${idx + 1}:**\n`;
        }
        rule.require.forEach(item => {
            md += `- [ ] ${item}\n`;
        });
        md += '\n';
    });
    return md.trim();
}
