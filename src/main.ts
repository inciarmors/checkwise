import * as core from '@actions/core';
import * as github from '@actions/github';
import { loadConfig } from './config';
import { getChangedFiles, findCheckwiseComment, createComment, updateComment } from './github';
import { getMatchingRules } from './matcher';
import { generateChecklistMarkdown } from './checklist';

async function run() {
  try {
    const token = core.getInput('github-token', { required: true });
    const configPath = core.getInput('config-path') || '.github/scope-mate.yml';
    const marker = '<!-- checkwise-marker -->';

    // 1. Carica config
    const config = loadConfig(configPath);

    // 2. Recupera numero PR dal contesto
    const prNumber = github.context.payload.pull_request?.number;
    if (!prNumber) throw new Error('Impossibile determinare il numero della Pull Request.');

    // 3. Ottieni file modificati
    const changedFiles = await getChangedFiles(token, prNumber);

    // 4. Matcha regole
    const rules = getMatchingRules(changedFiles, config.checklists);

    // 5. Genera checklist markdown (aggiungi marker nascosto)
    const checklist = `${marker}\n${generateChecklistMarkdown(rules)}`;

    // 6. Gestisci commento PR (idempotente)
    const existing = await findCheckwiseComment(token, prNumber, marker);
    if (existing) {
      await updateComment(token, existing.id, checklist);
      core.info('Checklist aggiornata nel commento esistente.');
    } else {
      await createComment(token, prNumber, checklist);
      core.info('Checklist creata come nuovo commento.');
    }
  } catch (err: any) {
    core.setFailed(err.message);
  }
}

// Esegui solo se chiamato come script principale
if (require.main === module) {
  run();
}

export { run };