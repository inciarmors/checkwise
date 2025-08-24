import { ChecklistRule } from './config';
/**
 * Genera una checklist markdown a partire dalle regole matchate.
 * @param rules Array di regole matchate
 * @returns Stringa markdown pronta da inserire in un commento PR
 */
export declare function generateChecklistMarkdown(rules: ChecklistRule[]): string;
