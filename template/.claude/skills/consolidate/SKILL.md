---
name: consolidate
description: Processa o trabalho pendente do journal — adiciona palavras-chave a entradas diárias, resume semanas ISO completas e resume meses completos. Use quando o usuário disser /consolidate, pedir para indexar/resumir/atualizar o journal, ou implicitamente via `new-entry`.
---

# consolidate

## Passo 0 — Garantir repositório git

### 0.1 — Verificar instalação do git

Antes de qualquer outra coisa, verifique se o binário `git` existe na máquina:

```bash
command -v git >/dev/null 2>&1
```

Se o comando falhar (código ≠ 0), **pare imediatamente** e informe o usuário com a mensagem:

> ❌ `git` não está instalado nesta máquina. A instalação do git é **obrigatória** para usar o framework `consolidate` (o passo 6 de cada execução grava o trabalho no histórico). Instale-o em https://git-scm.com/downloads e rode a skill novamente.

Não prossiga com nenhum outro passo enquanto o git não estiver disponível.

### 0.2 — Verificar/inicializar o repositório

Verifique se o diretório é um repositório git:

```bash
git -C "${CLAUDE_PROJECT_DIR:-.}" rev-parse --is-inside-work-tree 2>/dev/null
```

Se já for (código 0), siga para o Passo 1.

Caso contrário, inicialize o repositório **e** crie um commit inicial contendo apenas as skills e os arquivos base do projeto — nunca entradas do usuário:

```bash
git -C "${CLAUDE_PROJECT_DIR:-.}" init
```

Em seguida, faça stage explícito apenas dos caminhos base que de fato existirem no repositório. Candidatos esperados:

- `.claude/` — skills, settings e demais artefatos do Claude Code.
- `CLAUDE.md` — instruções do projeto para o Claude Code.
- `README.md` — documentação voltada ao usuário.
- `package.json` — marcador ESM e script `detect`.
- `.prettierrc` — configuração de formatação.

Stage somente os que existirem (omita os ausentes) e **nunca** use `git add .` ou `-A` aqui, para evitar capturar `.DS_Store`, `entries/` ou outros artefatos:

```bash
git -C "${CLAUDE_PROJECT_DIR:-.}" add <caminhos base existentes>
```

Commit inicial (heredoc para preservar formatação):

```bash
git -C "${CLAUDE_PROJECT_DIR:-.}" commit -m "$(cat <<'EOF'
init: skills e arquivos base do projeto

Commit inicial gerado automaticamente pela skill consolidate
na primeira execução em um diretório sem repositório git.
EOF
)"
```

Se o commit inicial falhar por hook, investigue e refaça — não use `--no-verify`. Depois disso, prossiga normalmente; o Passo 6 continua responsável por commitar o trabalho de consolidação desta execução (entradas diárias, semanais e mensais).

## Passo 1 — Detectar o trabalho pendente

Execute o script de detecção:

```bash
node "${CLAUDE_PROJECT_DIR:-.}/.claude/skills/consolidate/detect.js"
```

Ele imprime três seções:
1. Entradas diárias sem bloco `keywords:`.
2. Semanas ISO completas sem resumo semanal.
3. Meses completos sem resumo mensal.

Se as três estiverem `(none)`, informe "nada a consolidar" e pare.

## Passo 2 — Adicionar palavras-chave às entradas diárias

Para cada arquivo diário listado na seção 1:
1. Leia o conteúdo completo.
2. Extraia **5–15 palavras-chave em minúsculas** capturando as pessoas, projetos, lugares, eventos e temas mais relevantes. Use hífen em termos multi-palavra (ex.: `avaliacao-de-desempenho`). Evite preenchimentos genéricos.
3. Adicione este bloco ao **final** do arquivo, preservando todo o conteúdo anterior e deixando exatamente uma linha em branco antes do `---`:

   ```
   
   ---
   keywords: [palavra1, palavra2, palavra3]
   ```

Nunca toque no conteúdo escrito pelo usuário.

## Passo 3 — Resumir semanas completas

Para cada semana pendente (`YYYY-Www`) listada na seção 2:
1. Identifique os arquivos diários daquela semana. Uma semana ISO vai de segunda → domingo; combine nomes de arquivo calculando o `isocalendar()` de cada arquivo diário. Os diários vivem em `entries/daily/<YYYY-MM>/<YYYY-MM-DD>.md`, então uma semana pode atravessar dois subdiretórios quando cruza um mês.
2. Leia todos eles (eles já têm blocos de palavras-chave porque o passo 2 rodou primeiro).
3. Escreva `entries/weekly/<YYYY-MM>/<YYYY-Www>.md`, onde `<YYYY-MM>` é o ano-mês da **quinta-feira** da semana ISO (padrão ISO para atribuir uma semana a um mês). Crie o subdiretório se ainda não existir (`mkdir -p`):

   ```markdown
   # <YYYY-Www> · <DD Mmm> – <DD Mmm>

   ## Resumo
   <Narrativa de 4–8 frases cobrindo os temas, eventos-chave e resultados da semana.>

   ## Carry-forward
   <Tarefas `- (<)` agendadas e tarefas `- (.)` não concluídas da semana. Cada carry-forward é em si um item de lista markdown, com a data de origem adicionada entre parênteses após o texto, ex.: `- (.) ligar para o contador (de 2026-04-14)`. Omita a seção se não houver carry-forwards.>

   ---
   keywords: [palavra1, palavra2, ...]
   ```

   `Mmm` em português: `Jan`, `Fev`, `Mar`, `Abr`, `Mai`, `Jun`, `Jul`, `Ago`, `Set`, `Out`, `Nov`, `Dez`.

4. Palavras-chave: a união mais relevante das palavras-chave diárias (mire em 10–20).

## Passo 4 — Resumir meses completos

Para cada mês pendente (`YYYY-MM`) listado na seção 3:
1. Identifique os arquivos semanais cuja **quinta-feira** da semana ISO cai naquele mês (padrão ISO para atribuir uma semana a um mês). Esses arquivos vivem em `entries/weekly/<YYYY-MM>/` pelo mesmo critério — portanto, para um mês, todos os semanais candidatos estão no subdiretório `entries/weekly/<YYYY-MM>/`.
2. Leia-os.
3. Escreva `entries/monthly/<YYYY>/<YYYY-MM>.md`. Crie o subdiretório do ano se ainda não existir (`mkdir -p`):

   ```markdown
   # <Mês YYYY>

   ## Resumo
   <Narrativa mais ampla, de 6–12 frases, cobrindo as semanas do mês.>

   ## Pontos em aberto
   <Carry-forwards ainda não resolvidos no fim do mês. Omita se não houver.>

   ---
   keywords: [palavra1, palavra2, ...]
   ```

   `Mês` em português por extenso: `Janeiro`, `Fevereiro`, `Março`, `Abril`, `Maio`, `Junho`, `Julho`, `Agosto`, `Setembro`, `Outubro`, `Novembro`, `Dezembro`.

4. Palavras-chave: a união mais relevante das palavras-chave semanais (mire em 15–30).

## Passo 5 — Reportar

Resuma para o usuário em uma linha: `N diárias com palavras-chave · M resumos semanais · K resumos mensais`.

## Passo 6 — Commit git

Se nenhum arquivo foi tocado nos passos 2–4, pule este passo (nada a commitar).

Caso contrário, faça um único commit que inclua apenas os arquivos efetivamente produzidos ou alterados por esta execução:

- Arquivos diários que receberam bloco de palavras-chave no passo 2.
- Arquivos semanais criados no passo 3.
- Arquivos mensais criados no passo 4.

Passos:

1. Stage explícito (nunca `git add .` ou `-A`):

   ```bash
   git -C "${CLAUDE_PROJECT_DIR:-.}" add <caminhos tocados nos passos 2–4>
   ```

2. Monte a mensagem no formato:

   ```
   consolidate: <resumo>

   daily: YYYY-MM-DD, YYYY-MM-DD, ...
   weekly: YYYY-Www, ...
   monthly: YYYY-MM, ...
   ```

   Regras da mensagem:
   - A linha `<resumo>` é um contador curto, ex.: `3 diárias, 1 semanal`.
   - Inclua somente as linhas `daily:` / `weekly:` / `monthly:` que tiverem itens; omita as vazias.
   - Se não houver diárias mas houver resumos semanais ou mensais, a seção de "dias consolidados" é representada pelas datas de cobertura daqueles resumos (ex.: `weekly: 2026-W15` cobre 2026-04-06 – 2026-04-12).

3. Commit via heredoc, preservando quebras de linha:

   ```bash
   git -C "${CLAUDE_PROJECT_DIR:-.}" commit -m "$(cat <<'EOF'
   consolidate: <resumo>

   daily: ...
   weekly: ...
   monthly: ...
   EOF
   )"
   ```

Se o commit falhar por causa de um hook, investigue a causa e refaça — não use `--no-verify`.

## Regras

- Execute `detect.js` primeiro. Processe apenas o que ele listar. Não reaplique palavras-chave em arquivos diários que já têm um bloco `keywords:`. Não sobrescreva arquivos semanais/mensais existentes.
- Nunca edite o conteúdo escrito pelo usuário em uma entrada diária — apenas adicione o bloco de palavras-chave.
- O bloco de palavras-chave é sempre a **última coisa** no arquivo.
- A linha `keywords: [...]` **nunca quebra** em múltiplas linhas, mesmo que ultrapasse `printWidth`. As skills `when` e `explain` dependem de um único `^keywords:` por arquivo para o grep estrito.
- A ordem importa: execute os passos 2 → 3 → 4 nessa ordem, para que os resumos semanais possam se apoiar nas palavras-chave diárias recém-adicionadas.
- Re-execução é idempotente: se a skill for interrompida entre passos, basta rodar de novo — `detect.js` só lista o que ainda falta. O passo 6 só commita se houve trabalho novo, então repetições não geram commits vazios.
- O passo 6 não usa `git add .` nem `-A`. Stage sempre explícito nos arquivos dos passos 2–4 para evitar capturar artefatos como `.DS_Store`.
