import micromatch from 'micromatch';
import { ChecklistRule } from './config';

/**
 * Restituisce le regole che matchano almeno un file modificato.
 * @param changedFilePaths Lista dei file modificati nella PR
 * @param rules Array di regole checklist dalla config
 * @returns Solo le regole che matchano almeno un file
 */
export function getMatchingRules(
  changedFilePaths: string[],
  rules: ChecklistRule[]
): ChecklistRule[] {
  return rules.filter(rule => {
    // Se almeno un file matcha uno dei glob pattern della regola, la regola è attiva
    return micromatch(changedFilePaths, rule.when).length > 0;
  });
}