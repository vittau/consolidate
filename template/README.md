# {{projectName}} ⚡️

Framework pessoal de journaling construído sobre skills do Claude Code. Você escreve entradas diárias em um estilo Bullet Journal simplificado; o framework as indexa incrementalmente, consolida em resumos semanais e mensais, e torna tudo pesquisável por data e por assunto.

## Skills

| Skill | Argumento | O que faz |
|---|---|---|
| `/new-entry` | nenhum | Executa `/consolidate` primeiro, depois cria o arquivo diário de hoje se ainda não existir. |
| `/consolidate` | nenhum | Detecta automaticamente o trabalho pendente: adiciona palavras-chave às entradas diárias, resume semanas ISO completas em arquivos semanais e resume meses completos em arquivos mensais. |
| `/when <consulta>` | texto | Encontra quando um evento / pessoa / tópico aparece. Percorre mensal → semanal → diário para estreitar o período. |
| `/explain <assunto>` | texto | Sintetiza o que o journal diz sobre um assunto. Usa correspondência por palavras-chave com reconhecimento de sinônimos pelo modelo. |

## Estrutura de diretórios

As entradas são agrupadas em subdiretórios para evitar listas enormes em uma camada só:

```
entries/
  daily/    <YYYY-MM>/<YYYY-MM-DD>.md   ← escrito pelo usuário, agrupado por ano-mês
  weekly/   <YYYY-MM>/<YYYY-Www>.md     ← gerado por /consolidate, agrupado pelo mês da quinta-feira da semana ISO
  monthly/  <YYYY>/<YYYY-MM>.md         ← gerado por /consolidate, agrupado por ano
```

O ano-mês do arquivo semanal segue a convenção ISO: uma semana "pertence" ao mês que contém a sua quinta-feira.

## Notação Bullet Journal

Toda entrada é um item de lista markdown padrão. O símbolo BuJo vem entre parênteses
após o marcador da lista (tudo ASCII, de um único toque em um teclado US International):

- `- (.)` tarefa
- `- (x)` tarefa concluída
- `- (<)` tarefa agendada
- `- (o)` evento
- `- (-)` nota

Parênteses são usados no lugar de colchetes porque `- [x]` e `- [ ]` colidem com a
sintaxe de task list do GitHub-Flavored Markdown (vira checkbox clicável no render).

Exemplo:

```markdown
# 2026-04-16 · Quinta-feira

- (.) rascunhar roadmap do 2º trimestre
- (x) responder a Marina
- (<) dentista 2026-04-22
- (o) kickoff do offsite do time
- (-) pneu da bicicleta precisa ser trocado
```

O símbolo clássico `>` de migração foi intencionalmente omitido — `/consolidate`
faz o carry-forward dos itens não finalizados automaticamente.

## Formato das entradas

As entradas diárias são markdown em formato livre. Seções, cabeçalhos e estrutura ficam totalmente a seu critério.

Quando `/consolidate` processa uma entrada diária, ele adiciona um bloco de palavras-chave ao final:

```
---
keywords: [reuniao, projeto-x, avaliacao-de-desempenho]
```

Arquivos semanais e mensais usam o mesmo bloco, colocado depois de um resumo narrativo.

## Como funciona a consolidação

- Uma semana está **completa** assim que seu domingo for estritamente anterior a hoje.
- Um mês está **completo** assim que o primeiro dia do mês seguinte for igual ou anterior a hoje.
- `/consolidate` processa apenas o que está faltando. Nunca edita o conteúdo escrito pelo usuário em uma entrada diária — apenas adiciona o bloco de palavras-chave.
- A busca por palavras-chave (em `/when` e `/explain`) compara com os blocos de palavras-chave armazenados; os sinônimos são resolvidos pelo modelo, sem dicionário externo.

## Antes de começar

Edite [ABOUT.md](ABOUT.md) com uma descrição sucinta sobre você — o arquivo é carregado automaticamente em toda sessão do Claude e dá contexto para as skills interpretarem melhor suas entradas.

## Dia típico

1. `/new-entry` — `/consolidate` roda primeiro para processar qualquer indexação pendente; em seguida o arquivo de hoje é criado ou mostrado.
2. Anote entradas ao longo do dia em notação BuJo.
3. Amanhã, o ciclo se repete. Com o tempo, as camadas semanal e mensal se acumulam automaticamente.
4. Faça perguntas com `/when` e `/explain`.
