import { ChecklistRule } from './config';
/**
 * Restituisce le regole che matchano almeno un file modificato.
 * @param changedFilePaths Lista dei file modificati nella PR
 * @param rules Array di regole checklist dalla config
 * @returns Solo le regole che matchano almeno un file
 */
export declare function getMatchingRules(changedFilePaths: string[], rules: ChecklistRule[]): ChecklistRule[];
