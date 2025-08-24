/**
 * Valida e normalizza gli input dell'action.
 * @returns Oggetto con input validati
 * @throws Error se gli input non sono validi
 */
declare function validateInputs(): {
    token: string;
    configPath: string;
    marker: string;
};
declare function run(): Promise<void>;
export { run, validateInputs };
