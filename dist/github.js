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
exports.getChangedFiles = getChangedFiles;
exports.findCheckwiseComment = findCheckwiseComment;
exports.createComment = createComment;
exports.updateComment = updateComment;
const github = __importStar(require("@actions/github"));
// Helper per gestire rate limiting e network failures
async function safeApiCall(fn, retries = 2) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
            lastErr = err;
            // Rate limit
            if (err.status === 403 && err.message && err.message.includes('rate limit')) {
                throw new Error('GitHub API rate limit exceeded. Please try again later.');
            }
            // Network error
            if (['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(err.code)) {
                if (attempt < retries) {
                    await new Promise(res => setTimeout(res, 1000 * (attempt + 1)));
                    continue; // Retry
                }
                throw new Error('Network error while contacting GitHub API. Please retry.');
            }
            // Altri errori: rilancia
            throw err;
        }
    }
    throw lastErr;
}
async function getChangedFiles(token, prNumber) {
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;
    let files = [];
    let page = 1;
    const per_page = 100;
    while (true) {
        const resp = await safeApiCall(() => octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: prNumber,
            per_page,
            page,
        }));
        files.push(...resp.data.map((f) => f.filename));
        if (resp.data.length < per_page)
            break;
        page++;
    }
    return files;
}
/**
 * Trova un commento esistente di Checkwise nella PR (usando un marker unico).
 */
async function findCheckwiseComment(token, prNumber, marker) {
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;
    const comments = await safeApiCall(() => octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: prNumber,
        per_page: 100,
    }));
    for (const c of comments.data) {
        if (c.body && c.body.includes(marker)) {
            return { id: c.id, body: c.body };
        }
    }
    return null;
}
/**
 * Crea un nuovo commento nella PR.
 */
async function createComment(token, prNumber, body) {
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;
    await safeApiCall(() => octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body,
    }));
}
/**
 * Aggiorna un commento esistente nella PR.
 */
async function updateComment(token, commentId, body) {
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;
    await safeApiCall(() => octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: commentId,
        body,
    }));
}
//# sourceMappingURL=github.js.map