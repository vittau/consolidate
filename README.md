# create-consolidate

Scaffold de um repositório de journaling pessoal alimentado por skills do [Claude Code](https://docs.claude.com/en/docs/claude-code). Veja o [template/README.md](template/README.md) para a visão geral do framework que o scaffold gera.

## Uso

```bash
npm create consolidate@latest meu-journal
# ou
npx create-consolidate meu-journal

cd meu-journal
claude          # abre o Claude Code no diretório
/new-entry      # cria a primeira entrada diária
```

Se você omitir o nome do diretório, o CLI pergunta interativamente.

## O que o scaffold faz

1. Cria o diretório de destino.
2. Copia o template (skills, `CLAUDE.md`, `.prettierrc`, estrutura de `entries/`, exemplos).
3. Renomeia `_gitignore` para `.gitignore`.
4. Substitui `{{projectName}}` em `package.json` e `README.md` pelo nome do diretório.
5. Roda `git init` e cria o commit inicial.

## Pré-requisitos

- Node.js ≥ 18
- [Claude Code](https://docs.claude.com/en/docs/claude-code) instalado
- Git (opcional — se faltar, o CLI pula o `git init` e o skill `consolidate` cuida depois)

## Como funciona

Depois de scaffoldado, o repositório expõe quatro skills do Claude Code:

| Skill | O que faz |
|---|---|
| `/new-entry` | Cria o arquivo diário de hoje (depois de consolidar pendências). |
| `/consolidate` | Indexa entradas diárias, resume semanas ISO e meses completos. |
| `/when <consulta>` | Encontra quando um tópico aparece no journal. |
| `/explain <assunto>` | Sintetiza o que o journal diz sobre um assunto. |

Leia o [template/README.md](template/README.md) para convenções, notação Bullet Journal e estrutura de diretórios.

## Desenvolvimento

```bash
# testar o CLI localmente sem publicar
node bin/index.js /tmp/test-journal
```

## Licença

MIT
