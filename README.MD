# 🎯 Checkwise

**Checklist dinamiche per Pull Request basate sui file modificati**

[![GitHub Action](https://img.shields.io/badge/GitHub-Action-blue?logo=github-actions)](https://github.com/marketplace/actions/checkwise)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

---

## 🚀 Il Problema

Ogni giorno, i maintainer di repository ripetono le stesse richieste durante le code review:

- *"Hai aggiunto lo screenshot per questo cambiamento UI?"*
- *"Hai linkato il ticket JIRA?"* 
- *"Dove è il `terraform plan` per questi cambiamenti infra?"*
- *"Hai pensato al piano di rollback per questa migrazione?"*

I **PR template statici** non bastano perché non sanno cosa hai effettivamente modificato. I **tool programmabili** come Danger.js richiedono di scrivere e mantenere codice JavaScript. Le **soluzioni SaaS** sono costose e proprietarie.

## ✨ La Soluzione

**Checkwise** genera automaticamente checklist personalizzate in base ai **file path** modificati nella tua PR. Zero codice, solo configurazione YAML dichiarativa.

### Come Funziona

1. **Rileva** i file modificati nella PR
2. **Matcha** i path contro i tuoi pattern glob  
3. **Genera** una checklist mirata
4. **Aggiorna** idempotentemente un singolo commento
5. **Blocca** il merge finché la checklist non è completata

---

## 🔧 Quick Start

### 1. Crea il Workflow

`.github/workflows/scope-mate.yml`:

```yaml
name: Checkwise
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  scope-mate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-username/scope-mate@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Configura le Regole

`.github/scope-mate.yml`:

```yaml
checklists:
  # Frontend changes
  - when: ["app/**/*.tsx", "components/**/*.jsx", "styles/**/*.css"]
    require:
      - "Screenshot prima/dopo allegato"
      - "Test di accessibility eseguiti (ARIA, contrast)"
      - "Testato su mobile e desktop"
      - "Issue/ticket linkato nella descrizione"

  # Database migrations  
  - when: ["db/migrations/**", "prisma/migrations/**"]
    require:
      - "Piano di rollback documentato"
      - "Backfill/cleanup pianificato se necessario"
      - "Testato su dataset di staging"
      - "Review DBA richiesta (@db-team)"

  # Infrastructure changes
  - when: ["infra/**/*.tf", "terraform/**", "*.tf"]
    require:
      - "`terraform plan` incollato negli artifacts"
      - "Impatto sui costi stimato"
      - "Plan di rollback infra definito"
      - "Review DevOps approvata (@devops-team)"

  # API changes
  - when: ["api/**", "src/routes/**", "**/*api*.ts"]
    require:
      - "Documentazione API aggiornata"
      - "Backward compatibility verificata"
      - "Rate limiting considerato"
      - "Test di carico eseguiti se necessario"

  # Security-sensitive areas
  - when: ["auth/**", "security/**", "**/*auth*.ts", "middleware/security/**"]
    require:
      - "Security review richiesta (@security-team)"
      - "Test di penetrazione eseguiti"
      - "Logging di audit implementato"
      - "Compliance verificata"
```

### 3. Risultato

Quando apri una PR che modifica `app/components/LoginForm.tsx`:

![Checkwise Example](https://via.placeholder.com/600x300/2563eb/white?text=Checkwise+Generated+Checklist)

**Checkwise** commenterà automaticamente:

> 📋 **Checkwise Checklist**
> 
> Basata sui file modificati in questa PR:
> 
> **Frontend Changes** (`app/components/LoginForm.tsx`):
> - [ ] Screenshot prima/dopo allegato
> - [ ] Test di accessibility eseguiti (ARIA, contrast) 
> - [ ] Testato su mobile e desktop
> - [ ] Issue/ticket linkato nella descrizione
> 
> ✅ **Spunta tutte le caselle per completare il merge**

---

## 🎯 Utility Cases

### 🎨 **Frontend Development**
```yaml
- when: ["src/**/*.{tsx,jsx}", "styles/**/*.css", "public/**"]
  require:
    - "Screenshot/GIF della UI allegato"
    - "Test su Chrome, Firefox, Safari"
    - "Responsive design verificato" 
    - "Performance impact valutato"
```

### 🗄️ **Database Operations**
```yaml
- when: ["migrations/**", "schema/**", "**/*.sql"]
  require:
    - "Backup strategy definita"
    - "Rollback procedure documentata"
    - "Index performance analizzata"
    - "Data migration testata"
```

### 🔧 **Infrastructure as Code**
```yaml
- when: ["terraform/**", "cloudformation/**", "k8s/**/*.yaml"]
  require:
    - "terraform plan/cloudformation changeset allegato"
    - "Cost impact stimato" 
    - "Security groups/policies revisionate"
    - "Monitoring/alerting aggiornato"
```

### 🔒 **Security & Compliance**
```yaml
- when: ["auth/**", "security/**", "**/*auth*", "**/*security*"]
  require:
    - "Security team review (@security)"
    - "Threat model aggiornato"
    - "Audit logging implementato"
    - "Penetration test eseguiti"
```

### 📊 **Data & Analytics**
```yaml
- when: ["etl/**", "data/**", "analytics/**", "**/*pipeline*"]
  require:
    - "Data quality checks implementati"
    - "Performance su dataset completo testata"
    - "Schema evolution backward compatible"
    - "Monitoring dei job configurato"
```

### 📱 **Mobile Development**
```yaml
- when: ["ios/**", "android/**", "mobile/**", "**/*.swift", "**/*.kt"]
  require:
    - "Screenshot su device fisici"
    - "Test su iOS/Android minimi supportati"
    - "App store guidelines rispettate"
    - "Performance profiling eseguito"
```

### 🔄 **CI/CD & DevOps**
```yaml
- when: [".github/workflows/**", ".gitlab-ci.yml", "Dockerfile", "docker-compose.yml"]
  require:
    - "Pipeline testata in ambiente staging"
    - "Rollback strategy definita"
    - "Security scan dei container eseguita"
    - "Resource limits configurati"
```

---

## 🆚 Confronto con Alternative

| Feature | Checkwise | Danger.js | PR Templates | Keyword-based Tools |
|---------|-----------|-----------|--------------|-------------------|
| **Configuration** | ✅ YAML dichiarativo | ❌ JavaScript custom | ✅ Markdown statico | ⚠️ Mix di approcci |
| **File-based Logic** | ✅ Path matching preciso | ✅ Programmabile | ❌ Sempre uguale | ❌ Content scanning |
| **Dynamic Checklists** | ✅ Basate su file changed | ✅ Programmabile | ❌ Statiche | ✅ Keyword-based |
| **Idempotent Updates** | ✅ Un commento aggiornato | ❌ Commenti multipli | ❌ N/A | ⚠️ Varia |
| **Maintenance Overhead** | ✅ Zero-code | ❌ JavaScript da mantenere | ✅ Minimal | ⚠️ Configurazione complessa |
| **Performance** | ✅ Path matching veloce | ⚠️ Code execution | ✅ N/A | ❌ Content scanning lento |
| **False Positives** | ✅ Preciso sui file | ⚠️ Dipende da codice | ❌ Sempre presente | ❌ Keyword ambiguity |

## 🚀 Vantaggi Chiave

### 🎯 **Path-based Precision**
- **Niente false positive**: Matcha solo i file effettivamente modificati
- **Performance superiore**: Analizza path, non contenuto dei file
- **Predicibilità**: Stesso input = stesso output, sempre

### 📝 **Zero-Code Configuration** 
- **YAML dichiarativo**: Niente JavaScript da scrivere/debuggare
- **Schema validation**: Errori di config chiari e actionable
- **Editor support**: Autocomplete in VS Code/IntelliJ

### 🔄 **Professional UX**
- **Un solo commento**: Aggiornato idempotentemente, mai spam
- **Stato preservato**: Checklist spuntate sopravvivono agli update
- **Clean interface**: Markdown ben formattato, collapsible sections

---

## ⚙️ Configurazione Avanzata

### Opzioni Globali

```yaml
options:
  # Applica solo su specifici branch
  branch_pattern: "feature/*"
  
  # Filtra per label
  label_filter: ["frontend", "backend"]
  
  # Personalizza header del commento
  comment_header: "🚀 **Custom Team Checklist**"

checklists:
  - when: ["**/*.ts"]
    require: ["TypeScript checks passed"]
```

### Pattern Glob Avanzati

```yaml
checklists:
  # Negazione: tutti i .ts eccetto i test
  - when: ["**/*.ts", "!**/*.test.ts", "!**/*.spec.ts"]
    require: ["Production TypeScript code reviewed"]
    
  # Multiple extensions
  - when: ["**/*.{js,ts,jsx,tsx}"]
    require: ["JavaScript/TypeScript standards followed"]
    
  # Nested patterns
  - when: ["src/components/**/*.tsx", "src/pages/**/*.tsx"]
    require: ["React component guidelines followed"]
    
  # Exact file matches
  - when: ["package.json", "package-lock.json"]
    require: ["Dependency security audit passed"]
```

### Override Command

I maintainer possono bypassare checklist con motivazione:

```
@checkwise override: Emergency hotfix, checklist will be completed post-merge
```

---

## 🛠️ Development

### Local Testing

```bash
# Clone repository
git clone https://github.com/your-username/scope-mate
cd scope-mate

# Install dependencies  
npm install

# Run tests
npm test

# Build action
npm run build
```

### Testing su Repository Reale

1. Fork questo repository
2. Crea un `.github/scope-mate.yml` di test
3. Apri una PR che modifica file coperti dalla config
4. Verifica che Checkwise commenti correttamente

---

## 📈 Roadmap

### v1.0 - Core Features ✅
- [x] File path-based matching
- [x] YAML configuration  
- [x] Idempotent comments
- [x] GitHub status checks

### v1.1 - Enhanced UX
- [ ] Comment templates personalizzabili
- [ ] Multi-repository config sharing
- [ ] Slack/Teams notifications
- [ ] Metrics dashboard

### v1.2 - Enterprise Features  
- [ ] SAML/SSO integration
- [ ] Audit logging
- [ ] Custom approval workflows
- [ ] API per integration esterne

---

## 🤝 Contributing

Contribuzioni welcome! Per major changes, apri prima un issue per discutere cosa vorresti cambiare.

### Come Contribuire

1. **Fork** il repository
2. **Crea** un feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** le modifiche (`git commit -m 'Add amazing feature'`)
4. **Push** al branch (`git push origin feature/amazing-feature`) 
5. **Apri** una Pull Request

### Development Guidelines

- **Test coverage** > 90%
- **TypeScript strict mode**
- **ESLint clean**
- **Conventional commits**

---

## 📄 License

MIT License - vedi [LICENSE](LICENSE) per dettagli.

---

## 🙋‍♂️ Support

- **Issues**: [GitHub Issues](https://github.com/your-username/scope-mate/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/scope-mate/discussions)  
- **Documentation**: [Wiki](https://github.com/your-username/scope-mate/wiki)

---

## ⭐ Acknowledgments

- [Danger.js](https://danger.systems/) - Ispirazione per PR automation
- [GitHub Actions Toolkit](https://github.com/actions/toolkit) - Infrastruttura solida
- [Micromatch](https://github.com/micromatch/micromatch) - Pattern matching veloce

---

**Made with ❤️ by developers, for developers**