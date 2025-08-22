import fs from 'fs';
import yaml from 'js-yaml';

/**
 * Rappresenta la configurazione globale di Checkwise.
 */
export interface CheckwiseCfg {
  checklists: ChecklistRule[];
  options?: {
    label_filter?: string[];
    branch_pattern?: string;
    comment_header?: string;
  };
}

/**
 * Rappresenta una regola di checklist.
 */
export interface ChecklistRule {
  when: string[];      // Glob pattern dei file da matchare
  require: string[];   // Checklist items obbligatori
  optional?: boolean;  // Se la regola è opzionale
}

/**
 * Carica e valida la configurazione YAML di Checkwise.
 * @param path Percorso del file YAML (default: .github/scope-mate.yml)
 * @returns Oggetto CheckwiseCfg tipizzato
 * @throws Errore se il file è mancante, malformato o non valido
 */
export function loadConfig(path = '.github/scope-mate.yml'): CheckwiseCfg {
  let raw: any;
  try {
    const file = fs.readFileSync(path, 'utf8');
    raw = yaml.load(file);
  } catch (e) {
    throw new Error(`Impossibile leggere/parsing config YAML: ${e}`);
  }

  // Validazione base
  if (!raw || typeof raw !== 'object') {
    throw new Error('Config YAML vuoto o non valido');
  }
  if (!Array.isArray(raw.checklists)) {
    throw new Error('Config YAML: "checklists" deve essere un array');
  }
  for (const [i, rule] of raw.checklists.entries()) {
    if (!rule.when || !Array.isArray(rule.when)) {
      throw new Error(`Regola checklist #${i}: "when" deve essere un array di glob`);
    }
    if (!rule.require || !Array.isArray(rule.require)) {
      throw new Error(`Regola checklist #${i}: "require" deve essere un array di stringhe`);
    }
  }

  return raw as CheckwiseCfg;
}