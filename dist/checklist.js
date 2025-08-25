"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChecklistMarkdown = generateChecklistMarkdown;
/**
 * Genera una checklist markdown a partire dalle regole matchate.
 * @param rules Array di regole matchate
 * @returns Stringa markdown pronta da inserire in un commento PR
 */
function generateChecklistMarkdown(rules) {
    if (!rules.length) {
        return '_Nessuna checklist richiesta per i file modificati in questa PR._';
    }
    let md = '## Checklist automatica\n\n';
    rules.forEach((rule, idx) => {
        if (rules.length > 1) {
            md += `**Regola #${idx + 1}:**\n`;
        }
        rule.require.forEach(item => {
            md += `- [ ] ${item}\n`;
        });
        md += '\n';
    });
    return md.trim();
}
