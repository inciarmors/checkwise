import { generateChecklistMarkdown } from '../src/checklist';
import { ChecklistRule } from '../src/config';

describe('generateChecklistMarkdown', () => {
  it('generates an empty checklist if no rule matched', () => {
    expect(generateChecklistMarkdown([])).toMatch(/No checklist/);
  });

  it('generates a checklist for a single rule', () => {
    const rules: ChecklistRule[] = [
      {
        when: ['src/**/*.ts'],
        require: ['Test coverage > 90%', 'Lint passed']
      }
    ];
    const md = generateChecklistMarkdown(rules);
    expect(md).toContain('- [ ] Test coverage > 90%');
    expect(md).toContain('- [ ] Lint passed');
    expect(md).not.toContain('Rule #');
  });

  it('generates a checklist for multiple rules', () => {
    const rules: ChecklistRule[] = [
      {
        when: ['src/**/*.ts'],
        require: ['Test coverage > 90%']
      },
      {
        when: ['infra/**'],
        require: ['Run terraform plan']
      }
    ];
    const md = generateChecklistMarkdown(rules);
    expect(md).toContain('**Rule #1:**');
    expect(md).toContain('**Rule #2:**');
    expect(md).toContain('- [ ] Test coverage > 90%');
    expect(md).toContain('- [ ] Run terraform plan');
  });
});