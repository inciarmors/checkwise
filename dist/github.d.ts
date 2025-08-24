export declare function getChangedFiles(token: string, prNumber: number): Promise<string[]>;
/**
 * Trova un commento esistente di Checkwise nella PR (usando un marker unico).
 */
export declare function findCheckwiseComment(token: string, prNumber: number, marker: string): Promise<{
    id: number;
    body: string;
} | null>;
/**
 * Crea un nuovo commento nella PR.
 */
export declare function createComment(token: string, prNumber: number, body: string): Promise<void>;
/**
 * Aggiorna un commento esistente nella PR.
 */
export declare function updateComment(token: string, commentId: number, body: string): Promise<void>;
