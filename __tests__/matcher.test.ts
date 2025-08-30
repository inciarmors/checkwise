import { generateChecklistMarkdown } from '../src/checklist';
describe('generateChecklistMarkdown (custom template)', () => {
  const rulesWithTemplate: ChecklistRule[] = [
    {
      when: ['src/**/*.ts'],
      require: ['A', 'B'],
      priority: 1,
      template: '### Custom Rule\n{{items}}'
    },
    {
      when: ['infra/**'],
      require: ['C'],
      priority: 2
    }
  ];
  it('applies per-rule template if present', () => {
    const md = generateChecklistMarkdown([rulesWithTemplate[0]], undefined);
    expect(md).toContain('### Custom Rule');
    expect(md).toContain('- [ ] A');
    expect(md).toContain('- [ ] B');
  });
  it('applies global template if per-rule template is missing', () => {
    const md = generateChecklistMarkdown([rulesWithTemplate[1]], undefined, '## Global\n{{items}}');
    expect(md).toContain('## Global');
    expect(md).toContain('- [ ] C');
  });
  it('falls back to default if no template is present', () => {
    const rule = { when: ['docs/**'], require: ['D'] };
    const md = generateChecklistMarkdown([rule], undefined);
    expect(md).toContain('- [ ] D');
  });
});
import { getMatchingRules } from '../src/matcher';
import { ChecklistRule } from '../src/config';

const rules: ChecklistRule[] = [
  {
    when: ['src/**/*.ts'],
    require: ['Action on TypeScript file'],
    priority: 2
  },
  {
    when: ['infra/**', '!infra/**/*.md'],
    require: ['Check infrastructure changes'],
    priority: 1
  },
  {
    when: ['docs/**'],
    require: ['Update documentation'],
    priority: 3
  }
];
  it('orders matched rules by priority (lowest first)', () => {
    const files = ['src/index.ts', 'infra/main.tf', 'docs/intro.md'];
    const matched = getMatchingRules(files, rules);
    expect(matched.length).toBe(3);
    expect(matched[0].require[0]).toBe('Check infrastructure changes');
    expect(matched[1].require[0]).toBe('Action on TypeScript file');
    expect(matched[2].require[0]).toBe('Update documentation');
  });

describe('getMatchingRules', () => {
  it('matches correct rules for TypeScript files', () => {
    const files = ['src/index.ts', 'src/utils/helper.ts'];
    const matched = getMatchingRules(files, rules);
    expect(matched.length).toBe(1);
    expect(matched[0].require[0]).toBe('Action on TypeScript file');
  });

  it('matches rules with negation pattern', () => {
    const files = ['infra/main.tf', 'infra/readme.md'];
    const matched = getMatchingRules(files, rules);
    expect(matched.length).toBe(1);
    expect(matched[0].require[0]).toBe('Check infrastructure changes');
  });

  it('matches multiple rules if multiple patterns are satisfied', () => {
    const files = ['src/index.ts', 'docs/intro.md'];
    const matched = getMatchingRules(files, rules);
    expect(matched.length).toBe(2);
    expect(matched.map(r => r.require[0])).toContain('Action on TypeScript file');
    expect(matched.map(r => r.require[0])).toContain('Update documentation');
  });

  it('matches no rules if no file matches', () => {
    const files = ['assets/logo.png'];
    const matched = getMatchingRules(files, rules);
    expect(matched.length).toBe(0);
  });
});