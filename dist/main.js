"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
exports.validateInputs = validateInputs;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const config_1 = require("./config");
const github_1 = require("./github");
const matcher_1 = require("./matcher");
const checklist_1 = require("./checklist");
/**
 * Validates and normalizes the action's inputs.
 * @returns Object with validated inputs
 * @throws Error if inputs are not valid
 */
function validateInputs() {
    // 1. Validate GitHub token
    const token = core.getInput('github-token', { required: true });
    if (!token || token.trim().length === 0) {
        throw new Error('Input "github-token" is required and cannot be empty');
    }
    if (!token.startsWith('ghp_') && !token.startsWith('ghs_') && !token.startsWith('github_pat_')) {
        core.warning('Unexpected GitHub token format. Make sure to use a valid token.');
    }
    // 2. Validate config path
    let configPath = core.getInput('config-path');
    if (!configPath || configPath.trim().length === 0) {
        configPath = '.github/scope-mate.yml';
        core.info(`No config-path specified, using default: ${configPath}`);
    }
    else {
        configPath = configPath.trim();
    }
    // Validate path format
    if (configPath.includes('..') || configPath.startsWith('/')) {
        throw new Error(`Unsafe config path: "${configPath}". Use relative paths without ".." or absolute paths.`);
    }
    if (!configPath.endsWith('.yml') && !configPath.endsWith('.yaml')) {
        core.warning(`Config path "${configPath}" does not end with .yml/.yaml. Make sure it is a YAML file.`);
    }
    // 3. Fixed marker for now, but can be validated in the future
    const marker = '<!-- checkwise-marker -->';
    return { token, configPath, marker };
}
async function run() {
    try {
        // 1. Validate action input
        const { token, configPath, marker } = validateInputs();
        // 2. Load config
        const config = (0, config_1.loadConfig)(configPath);
        // 3. Validate GitHub context
        if (!github.context.repo) {
            throw new Error('GitHub context not available. Make sure the action is running in a GitHub repository.');
        }
        const { owner, repo } = github.context.repo;
        if (!owner || !repo) {
            throw new Error(`Incomplete repository context: owner="${owner}", repo="${repo}"`);
        }
        // 4. Retrieve PR number from context with extended validation
        const prNumber = github.context.payload.pull_request?.number;
        if (!prNumber) {
            const eventName = github.context.eventName;
            throw new Error(`Unable to determine the Pull Request number. ` +
                `Event: "${eventName}". Make sure the action is triggered on pull_request events ` +
                `(opened, synchronize, edited, etc.). Available payload: ${Object.keys(github.context.payload).join(', ')}`);
        }
        if (typeof prNumber !== 'number' || prNumber <= 0) {
            throw new Error(`Invalid PR number: ${prNumber}. It must be a positive number.`);
        }
        core.info(`Input validated: repo=${owner}/${repo}, PR=#${prNumber}, config=${configPath}`);
        // 5. Get changed files
        const changedFiles = await (0, github_1.getChangedFiles)(token, prNumber);
        if (changedFiles.length === 0) {
            core.info('No changed files found in the PR. No checklist generated.');
            return;
        }
        core.info(`Changed files detected: ${changedFiles.length}`);
        core.debug(`Files: ${changedFiles.join(', ')}`);
        // 6. Match rules
        const rules = (0, matcher_1.getMatchingRules)(changedFiles, config.checklists);
        if (rules.length === 0) {
            core.info('No rules matched for the changed files. No checklist required.');
            return;
        }
        core.info(`Matched rules: ${rules.length}`);
        // 7. Generate checklist markdown (add hidden marker)
        const checklist = `${marker}\n${(0, checklist_1.generateChecklistMarkdown)(rules)}`;
        // 8. Manage PR comment (idempotent)
        const existing = await (0, github_1.findCheckwiseComment)(token, prNumber, marker);
        if (existing) {
            await (0, github_1.updateComment)(token, existing.id, checklist);
            core.info('Checklist updated in existing comment.');
        }
        else {
            await (0, github_1.createComment)(token, prNumber, checklist);
            core.info('Checklist created as new comment.');
        }
    }
    catch (err) {
        // Enhanced error handling with specific context
        const errorMessage = err.message || 'Unknown error';
        // Add useful context for debugging
        const context = {
            eventName: github.context.eventName,
            repoOwner: github.context.repo?.owner,
            repoName: github.context.repo?.repo,
            prNumber: github.context.payload.pull_request?.number,
            hasToken: !!core.getInput('github-token', { required: false })
        };
        core.error(`Checkwise failed: ${errorMessage}`);
        core.debug(`Context: ${JSON.stringify(context, null, 2)}`);
        // Debug logs for common errors
        if (errorMessage.includes('Pull Request')) {
            core.error('Tip: Make sure the workflow is triggered on pull_request events');
        }
        if (errorMessage.includes('token')) {
            core.error('Tip: Check that github-token is configured correctly');
        }
        if (errorMessage.includes('config')) {
            core.error('Tip: Ensure the configuration file exists and is valid');
        }
        core.setFailed(errorMessage);
    }
}
// Esegui solo se chiamato come script principale
/* istanbul ignore next */
if (require.main === module) {
    run();
}
