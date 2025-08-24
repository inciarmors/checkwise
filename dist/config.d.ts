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
    when: string[];
    require: string[];
    optional?: boolean;
}
/**
 * Carica e valida la configurazione YAML di Checkwise.
 * @param path Percorso del file YAML (default: .github/scope-mate.yml)
 * @returns Oggetto CheckwiseCfg tipizzato
 * @throws Errore se il file è mancante, malformato o non valido
 */
export declare function loadConfig(path?: string): CheckwiseCfg;
