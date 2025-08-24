import * as core from '@actions/core';
import * as github from '@actions/github';
import { loadConfig } from './config';
import { getChangedFiles, findCheckwiseComment, createComment, updateComment } from './github';
import { getMatchingRules } from './matcher';
import { generateChecklistMarkdown } from './checklist';

/**
 * Valida e normalizza gli input dell'action.
 * @returns Oggetto con input validati
 * @throws Error se gli input non sono validi
 */
function validateInputs(): { token: string; configPath: string; marker: string } {
  // 1. Validazione GitHub token
  const token = core.getInput('github-token', { required: true });
  if (!token || token.trim().length === 0) {
    throw new Error('Input "github-token" è richiesto e non può essere vuoto');
  }
  if (!token.startsWith('ghp_') && !token.startsWith('ghs_') && !token.startsWith('github_pat_')) {
    core.warning('GitHub token format inaspettato. Assicurati di usare un token valido.');
  }

  // 2. Validazione config path
  let configPath = core.getInput('config-path');
  if (!configPath || configPath.trim().length === 0) {
    configPath = '.github/scope-mate.yml';
    core.info(`Nessun config-path specificato, usando default: ${configPath}`);
  } else {
    configPath = configPath.trim();
  }
  
  // Validazione formato path
  if (configPath.includes('..') || configPath.startsWith('/')) {
    throw new Error(`Config path non sicuro: "${configPath}". Usa path relativi senza ".." o path assoluti.`);
  }
  if (!configPath.endsWith('.yml') && !configPath.endsWith('.yaml')) {
    core.warning(`Config path "${configPath}" non termina con .yml/.yaml. Assicurati che sia un file YAML.`);
  }

  // 3. Marker fisso per ora, ma validabile in futuro
  const marker = '<!-- checkwise-marker -->';

  return { token, configPath, marker };
}

async function run() {
  try {
    // 1. Valida input dell'action
    const { token, configPath, marker } = validateInputs();

    // 2. Carica config
    const config = loadConfig(configPath);

    // 3. Validazione contesto GitHub
    if (!github.context.repo) {
      throw new Error('Contesto GitHub non disponibile. Assicurati che l\'action sia eseguita in un repository GitHub.');
    }
    
    const { owner, repo } = github.context.repo;
    if (!owner || !repo) {
      throw new Error(`Repository context incompleto: owner="${owner}", repo="${repo}"`);
    }

    // 4. Recupera numero PR dal contesto con validazione estesa
    const prNumber = github.context.payload.pull_request?.number;
    if (!prNumber) {
      const eventName = github.context.eventName;
      throw new Error(
        `Impossibile determinare il numero della Pull Request. ` +
        `Event: "${eventName}". Assicurati che l'action sia triggered su eventi di pull_request ` +
        `(opened, synchronize, edited, etc.). Payload disponibile: ${Object.keys(github.context.payload).join(', ')}`
      );
    }
    
    if (typeof prNumber !== 'number' || prNumber <= 0) {
      throw new Error(`Numero PR non valido: ${prNumber}. Deve essere un numero positivo.`);
    }

    core.info(`✅ Input validati: repo=${owner}/${repo}, PR=#${prNumber}, config=${configPath}`);

    // 5. Ottieni file modificati
    const changedFiles = await getChangedFiles(token, prNumber);
    
    if (changedFiles.length === 0) {
      core.info('⚠️ Nessun file modificato trovato nella PR. Nessuna checklist generata.');
      return;
    }
    
    core.info(`📁 File modificati rilevati: ${changedFiles.length}`);
    core.debug(`File: ${changedFiles.join(', ')}`);

    // 6. Matcha regole
    const rules = getMatchingRules(changedFiles, config.checklists);
    
    if (rules.length === 0) {
      core.info('🎯 Nessuna regola matchata per i file modificati. Nessuna checklist richiesta.');
      return;
    }
    
    core.info(`📋 Regole matchate: ${rules.length}`);

    // 7. Genera checklist markdown (aggiungi marker nascosto)
    const checklist = `${marker}\n${generateChecklistMarkdown(rules)}`;

    // 8. Gestisci commento PR (idempotente)
    const existing = await findCheckwiseComment(token, prNumber, marker);
    if (existing) {
      await updateComment(token, existing.id, checklist);
      core.info('✅ Checklist aggiornata nel commento esistente.');
    } else {
      await createComment(token, prNumber, checklist);
      core.info('✅ Checklist creata come nuovo commento.');
    }
    
  } catch (err: any) {
    // Enhanced error handling con context specifico
    const errorMessage = err.message || 'Errore sconosciuto';
    
    // Aggiungi context utile per debugging
    const context = {
      eventName: github.context.eventName,
      repoOwner: github.context.repo?.owner,
      repoName: github.context.repo?.repo,
      prNumber: github.context.payload.pull_request?.number,
      hasToken: !!core.getInput('github-token', { required: false })
    };
    
    core.error(`❌ Checkwise failed: ${errorMessage}`);
    core.debug(`Context: ${JSON.stringify(context, null, 2)}`);
    
    // Log di debugging per errori comuni
    if (errorMessage.includes('Pull Request')) {
      core.error('💡 Suggerimento: Assicurati che il workflow sia triggered su eventi pull_request');
    }
    if (errorMessage.includes('token')) {
      core.error('💡 Suggerimento: Verifica che github-token sia configurato correttamente');
    }
    if (errorMessage.includes('config')) {
      core.error('💡 Suggerimento: Controlla che il file di configurazione esista e sia valido');
    }
    
    core.setFailed(errorMessage);
  }
}


// Esegui solo se chiamato come script principale
/* istanbul ignore next */
if (require.main === module) {
  run();
}

export { run, validateInputs };