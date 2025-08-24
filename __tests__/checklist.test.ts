import { generateChecklistMarkdown } from '../src/checklist';
import { ChecklistRule } from '../src/config';

describe('generateChecklistMarkdown', () => {
  it('genera una checklist vuota se nessuna regola matchata', () => {
    expect(generateChecklistMarkdown([])).toMatch(/Nessuna checklist/);
  });

  it('genera una checklist per una sola regola', () => {
    const rules: ChecklistRule[] = [
      {
        when: ['src/**/*.ts'],
        require: ['Test coverage > 90%', 'Lint passed']
      }
    ];
    const md = generateChecklistMarkdown(rules);
    expect(md).toContain('- [ ] Test coverage > 90%');
    expect(md).toContain('- [ ] Lint passed');
    expect(md).not.toContain('Regola #');
  });

  it('genera una checklist per più regole', () => {
    const rules: ChecklistRule[] = [
      {
        when: ['src/**/*.ts'],
        require: ['Test coverage > 90%']
      },
      {
        when: ['infra/**'],
        require: ['Esegui terraform plan']
      }
    ];
    const md = generateChecklistMarkdown(rules);
    expect(md).toContain('**Regola #1:**');
    expect(md).toContain('**Regola #2:**');
    expect(md).toContain('- [ ] Test coverage > 90%');
    expect(md).toContain('- [ ] Esegui terraform plan');
  });
});