# consolidate ⚡️

Repositório pessoal de journaling. Veja [README.md](README.md) para a visão geral do framework voltada ao usuário. Este arquivo é o contexto de trabalho para o Claude Code.

## Grafo de skills

- `new-entry` → invoca `consolidate` primeiro e depois cria o arquivo diário de hoje.
- `consolidate` → autônomo; escreve em `entries/weekly/<YYYY-MM>/` e `entries/monthly/<YYYY>/`, adiciona blocos de palavras-chave nas entradas em `entries/daily/<YYYY-MM>/`.
- `when`, `explain` → consultas somente leitura sobre a árvore.

Se o pedido do usuário corresponder a uma dessas skills mas ele não tiver invocado explicitamente (via `/<skill>`), confirme antes de agir — sugira a skill apropriada e aguarde aprovação em vez de executar manualmente.

## Layout de arquivos

Entradas são agrupadas em subdiretórios para manter cada nível gerenciável:

```
entries/
  daily/    <YYYY-MM>/<YYYY-MM-DD>.md   ← diário, agrupado pelo ano-mês da data
  weekly/   <YYYY-MM>/<YYYY-Www>.md     ← semanal, agrupado pelo mês da quinta-feira da semana ISO
  monthly/  <YYYY>/<YYYY-MM>.md         ← mensal, agrupado por ano
```

O critério de pasta da semana (mês da quinta-feira) é o mesmo que o `consolidate` usa para decidir em qual resumo mensal a semana participa — então um arquivo semanal sempre fica no mesmo subdiretório do mês a que pertence. Skills que fazem grep precisam usar `*/*.md` em cada camada para abranger todos os arquivos.

## Convenções

- ISO 8601 em todas as datas. Semanas ISO (seg–dom), rotuladas `YYYY-Www` com o número da semana com zero à esquerda.
- Palavras-chave são em minúsculas, separadas por hífen quando multi-palavra (`avaliacao-de-desempenho`, não `Avaliação de Desempenho`).
- O bloco de palavras-chave fica ao **final** de toda entrada, precedido por um delimitador `---` e uma única linha em branco:

  ```
  …conteúdo do usuário…

  ---
  keywords: [palavra1, palavra2, palavra3]
  ```

- A linha `keywords: [...]` **sempre em uma única linha**, mesmo que ultrapasse o `printWidth` do prettier (por isso `proseWrap: preserve`). As skills `when` e `explain` fazem grep em `^keywords:` e contam com um match por arquivo.

- Períodos "completos":
  - Semana — completa assim que seu domingo for estritamente anterior a hoje.
  - Mês — completo assim que o primeiro dia do mês seguinte for ≤ hoje.

## Regras de extração de palavras-chave

- Diário: 5–15 palavras-chave. Priorize substantivos concretos — pessoas, projetos, lugares, eventos, temas recorrentes.
- Semanal: 10–20 palavras-chave. União mais relevante das palavras-chave diárias daquela semana.
- Mensal: 15–30 palavras-chave. União mais relevante das palavras-chave semanais daquele mês.
- Remova duplicatas. Sem preenchimentos genéricos (`trabalho`, `coisas`, `diversos`).

## Skills de consulta

- Caminhe de cima para baixo: mensal → semanal → diário. Vá direto ao diário apenas quando as camadas superiores ainda não tiverem sido construídas para aquele período.
- Use `grep` contra linhas `^keywords:` para correspondências mais estritas, e grep case-insensitive no arquivo inteiro como fallback.
- Sinônimos são gerados pelo modelo a partir da consulta (3–8 por `explain`, 2–5 por `when`). Sem arquivo de dicionário.
- Sempre cite datas específicas (`YYYY-MM-DD`) ao relatar os achados.

## Ferramentas

- [.claude/skills/consolidate/detect.js](.claude/skills/consolidate/detect.js) imprime o trabalho de consolidação pendente. É o primeiro passo de `consolidate`. Node.js puro (≥18), sem dependências. Também disponível como `npm run detect`.
- [package.json](package.json) existe para marcar o projeto como ESM (`"type": "module"`) e expor o script npm `detect`. Sem dependências.
- Sem comandos de build, lint ou test — este é um repositório de conteúdo.

## O que não fazer

- Não edite o conteúdo escrito pelo usuário em uma entrada diária. Apenas adicione o bloco de palavras-chave.
- Não regenere um arquivo semanal ou mensal que já exista a menos que o usuário peça explicitamente.
- Não adicione seções (humor, gratidão, reflexão) ao template diário. Mantenha minimalista — a estrutura é escolha do usuário.
- Não use o símbolo `>` de migração do BuJo; a consolidação cuida do carry-forward.
