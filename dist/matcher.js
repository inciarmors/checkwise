"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatchingRules = getMatchingRules;
const micromatch_1 = __importDefault(require("micromatch"));
/**
 * Returns the rules that match at least one changed file.
 * @param changedFilePaths List of files changed in the PR
 * @param rules Array of checklist rules from config
 * @returns Only the rules that match at least one file
 */
function getMatchingRules(changedFilePaths, rules) {
    return rules.filter(rule => {
        // If at least one file matches one of the rule's glob patterns, the rule is active
        return (0, micromatch_1.default)(changedFilePaths, rule.when).length > 0;
    });
}
