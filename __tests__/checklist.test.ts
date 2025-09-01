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

  it('falls back to default if no template is present', () => {
    const rules: ChecklistRule[] = [
      { when: ['src/**'], require: ['A'] }
    ];
    const md = generateChecklistMarkdown(rules, undefined);
    expect(md).toContain('- [ ] A');
  });
  it('applies global template if per-rule template is missing', () => {
    const rules: ChecklistRule[] = [
      { when: ['src/**'], require: ['A'] }
    ];
    const md = generateChecklistMarkdown(rules, undefined, '## Global\n{{items}}');
    expect(md).toContain('## Global');
    expect(md).toContain('- [ ] A');
  });
  it('applies per-rule template if present', () => {
    const rules: ChecklistRule[] = [
      { when: ['src/**'], require: ['A'], template: '### Custom\n{{items}}' }
    ];
    const md = generateChecklistMarkdown(rules, undefined);
    expect(md).toContain('### Custom');
    expect(md).toContain('- [ ] A');
  });

  it('handles template variables with templateVars', () => {
    const rules: ChecklistRule[] = [
      { when: ['*.ts'], require: ['Test added'], template: '{{comment_header}}\nFiles: {{fileCount}}, Rules: {{ruleCount}}, Time: {{executionTime}}ms\n{{items}}' }
    ];
    const md = generateChecklistMarkdown(rules, undefined, undefined, {
      fileCount: 5,
      executionTime: 123,
      comment_header: 'Test Header'
    });
    expect(md).toContain('Test Header');
    expect(md).toContain('Files: 5');
    expect(md).toContain('Rules: 1');
    expect(md).toContain('Time: 123ms');
    expect(md).toContain('- [ ] Test added');
  });

  it('handles missing templateVars gracefully', () => {
    const rules: ChecklistRule[] = [
      { when: ['*.ts'], require: ['Test added'], template: 'Files: {{fileCount}}, {{items}}' }
    ];
    const md = generateChecklistMarkdown(rules, undefined, undefined, undefined);
    expect(md).toContain('Files: 0'); // Default fallback
    expect(md).toContain('- [ ] Test added');
  });
});