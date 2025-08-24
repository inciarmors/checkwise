"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatchingRules = getMatchingRules;
const micromatch_1 = __importDefault(require("micromatch"));
/**
 * Restituisce le regole che matchano almeno un file modificato.
 * @param changedFilePaths Lista dei file modificati nella PR
 * @param rules Array di regole checklist dalla config
 * @returns Solo le regole che matchano almeno un file
 */
function getMatchingRules(changedFilePaths, rules) {
    return rules.filter(rule => {
        // Se almeno un file matcha uno dei glob pattern della regola, la regola è attiva
        return (0, micromatch_1.default)(changedFilePaths, rule.when).length > 0;
    });
}
//# sourceMappingURL=matcher.js.map