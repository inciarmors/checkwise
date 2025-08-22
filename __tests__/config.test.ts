import { loadConfig } from '../src/config';
import fs from 'fs';

const TMP = '__tests__/tmp-config.yml';

const VALID_YAML = `
checklists:
  - when: ["src/**/*.ts"]
    require:
      - "Test coverage > 90%"
      - "Lint passed"
options:
  branch_pattern: "feature/*"
`;

const INVALID_YAML = `
checklists:
  - when: "src/**/*.ts"
    require: "Test coverage > 90%"
`;

const NO_CHECKLISTS_YAML = `
options:
  branch_pattern: "main"
`;

describe('loadConfig', () => {
  afterEach(() => {
    if (fs.existsSync(TMP)) fs.unlinkSync(TMP);
  });

  it('parsa una config valida', () => {
    fs.writeFileSync(TMP, VALID_YAML);
    const cfg = loadConfig(TMP);
    expect(cfg.checklists.length).toBe(1);
    expect(cfg.checklists[0].when).toContain('src/**/*.ts');
    expect(cfg.options?.branch_pattern).toBe('feature/*');
  });

  it('lancia errore se "checklists" manca', () => {
    fs.writeFileSync(TMP, NO_CHECKLISTS_YAML);
    expect(() => loadConfig(TMP)).toThrow(/checklists/);
  });

  it('lancia errore se "when" e "require" non sono array', () => {
    fs.writeFileSync(TMP, INVALID_YAML);
    expect(() => loadConfig(TMP)).toThrow(/when/);
  });

  it('lancia errore se il file non esiste', () => {
    expect(() => loadConfig('__tests__/notfound.yml')).toThrow(/Impossibile leggere/);
  });

  it('lancia errore su YAML malformato', () => {
    fs.writeFileSync(TMP, 'checklists: [');
    expect(() => loadConfig(TMP)).toThrow(/Impossibile leggere/);
  });
});