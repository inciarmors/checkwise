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
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      throw new Error(
        `File di configurazione non trovato: "${path}". ` +
        `Crea il file con le tue regole checklist o specifica un path diverso con config-path.`
      );
    }
    if (e.name === 'YAMLException') {
      throw new Error(
        `Errore di parsing YAML in "${path}": ${e.message}. ` +
        `Controlla la sintassi YAML del file di configurazione.`
      );
    }
    throw new Error(`Impossibile leggere config YAML "${path}": ${e.message}`);
  }

  // Validazione base
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Config YAML vuoto o non valido in "${path}". Il file deve contenere un oggetto YAML.`);
  }
  if (!raw.checklists) {
    throw new Error(`Config YAML in "${path}": proprietà "checklists" mancante. Esempio:\nchecklists:\n  - when: ["src/**/*.ts"]\n    require: ["Test passati"]`);
  }
  if (!Array.isArray(raw.checklists)) {
    throw new Error(`Config YAML in "${path}": "checklists" deve essere un array. Trovato: ${typeof raw.checklists}`);
  }
  if (raw.checklists.length === 0) {
    throw new Error(`Config YAML in "${path}": array "checklists" è vuoto. Aggiungi almeno una regola.`);
  }

  // Validazione granulare delle regole
  for (const [i, rule] of raw.checklists.entries()) {
    const ruleContext = `Regola checklist #${i + 1} in "${path}"`;
    
    if (!rule || typeof rule !== 'object') {
      throw new Error(`${ruleContext}: deve essere un oggetto. Trovato: ${typeof rule}`);
    }
    
    if (!rule.when) {
      throw new Error(`${ruleContext}: proprietà "when" mancante. Specifica i pattern glob dei file da matchare.`);
    }
    if (!Array.isArray(rule.when)) {
      throw new Error(`${ruleContext}: "when" deve essere un array di pattern glob. Trovato: ${typeof rule.when}`);
    }
    if (rule.when.length === 0) {
      throw new Error(`${ruleContext}: array "when" è vuoto. Specifica almeno un pattern glob.`);
    }
    for (const [j, pattern] of rule.when.entries()) {
      if (typeof pattern !== 'string') {
        throw new Error(`${ruleContext}: pattern #${j + 1} in "when" deve essere una stringa. Trovato: ${typeof pattern}`);
      }
      if (pattern.trim().length === 0) {
        throw new Error(`${ruleContext}: pattern #${j + 1} in "when" è vuoto.`);
      }
    }
    
    if (!rule.require) {
      throw new Error(`${ruleContext}: proprietà "require" mancante. Specifica gli item della checklist.`);
    }
    if (!Array.isArray(rule.require)) {
      throw new Error(`${ruleContext}: "require" deve essere un array di stringhe. Trovato: ${typeof rule.require}`);
    }
    if (rule.require.length === 0) {
      throw new Error(`${ruleContext}: array "require" è vuoto. Specifica almeno un item della checklist.`);
    }
    for (const [j, item] of rule.require.entries()) {
      if (typeof item !== 'string') {
        throw new Error(`${ruleContext}: item #${j + 1} in "require" deve essere una stringa. Trovato: ${typeof item}`);
      }
      if (item.trim().length === 0) {
        throw new Error(`${ruleContext}: item #${j + 1} in "require" è vuoto.`);
      }
    }
    
    // Validazione opzioni opzionali
    if (rule.optional !== undefined && typeof rule.optional !== 'boolean') {
      throw new Error(`${ruleContext}: "optional" deve essere true/false. Trovato: ${typeof rule.optional}`);
    }
  }

  // Validazione opzioni globali se presenti
  if (raw.options) {
    if (typeof raw.options !== 'object') {
      throw new Error(`Config YAML in "${path}": "options" deve essere un oggetto. Trovato: ${typeof raw.options}`);
    }
    
    if (raw.options.label_filter !== undefined) {
      if (!Array.isArray(raw.options.label_filter)) {
        throw new Error(`Config YAML in "${path}": options.label_filter deve essere un array. Trovato: ${typeof raw.options.label_filter}`);
      }
      for (const [i, label] of raw.options.label_filter.entries()) {
        if (typeof label !== 'string') {
          throw new Error(`Config YAML in "${path}": options.label_filter[${i}] deve essere una stringa. Trovato: ${typeof label}`);
        }
      }
    }
    
    if (raw.options.branch_pattern !== undefined && typeof raw.options.branch_pattern !== 'string') {
      throw new Error(`Config YAML in "${path}": options.branch_pattern deve essere una stringa. Trovato: ${typeof raw.options.branch_pattern}`);
    }
    
    if (raw.options.comment_header !== undefined && typeof raw.options.comment_header !== 'string') {
      throw new Error(`Config YAML in "${path}": options.comment_header deve essere una stringa. Trovato: ${typeof raw.options.comment_header}`);
    }
  }

  return raw as CheckwiseCfg;
}