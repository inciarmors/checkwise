import { getMatchingRules } from '../src/matcher';
import { ChecklistRule } from '../src/config';

const rules: ChecklistRule[] = [
  {
    when: ['src/**/*.ts'],
    require: ['Azione su file TypeScript']
  },
  {
    when: ['infra/**', '!infra/**/*.md'],
    require: ['Verifica cambiamenti infrastrutturali']
  },
  {
    when: ['docs/**'],
    require: ['Aggiorna documentazione']
  }
];

describe('getMatchingRules', () => {
  it('matcha regole corrette per file TypeScript', () => {
    const files = ['src/index.ts', 'src/utils/helper.ts'];
    const matched = getMatchingRules(files, rules);
    expect(matched.length).toBe(1);
    expect(matched[0].require[0]).toBe('Azione su file TypeScript');
  });

  it('matcha regole con pattern di negazione', () => {
    const files = ['infra/main.tf', 'infra/readme.md'];
    const matched = getMatchingRules(files, rules);
    // Deve matchare solo se almeno un file NON è escluso dal pattern di negazione
    expect(matched.length).toBe(1);
    expect(matched[0].require[0]).toBe('Verifica cambiamenti infrastrutturali');
  });

  it('matcha più regole se più pattern sono soddisfatti', () => {
    const files = ['src/index.ts', 'docs/intro.md'];
    const matched = getMatchingRules(files, rules);
    expect(matched.length).toBe(2);
    expect(matched.map(r => r.require[0])).toContain('Azione su file TypeScript');
    expect(matched.map(r => r.require[0])).toContain('Aggiorna documentazione');
  });

  it('non matcha nessuna regola se nessun file corrisponde', () => {
    const files = ['assets/logo.png'];
    const matched = getMatchingRules(files, rules);
    expect(matched.length).toBe(0);
  });
});