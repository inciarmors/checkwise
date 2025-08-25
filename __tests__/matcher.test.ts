import { getMatchingRules } from '../src/matcher';
import { ChecklistRule } from '../src/config';

const rules: ChecklistRule[] = [
  {
    when: ['src/**/*.ts'],
    require: ['Action on TypeScript file']
  },
  {
    when: ['infra/**', '!infra/**/*.md'],
    require: ['Check infrastructure changes']
  },
  {
    when: ['docs/**'],
    require: ['Update documentation']
  }
];

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
    // Should match only if at least one file is NOT excluded by the negation pattern
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