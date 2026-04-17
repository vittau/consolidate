---
name: when
description: Encontra quando um evento, pessoa ou tópico aparece no journal. Use quando o usuário disser /when <consulta>, ou perguntar "quando X aconteceu" / "quando foi a última vez que vi Y". Recebe uma consulta em texto e retorna datas com trechos de citação.
---

# when

A consulta do usuário é passada como argumentos para esta skill.

## Abordagem — percorrer a hierarquia de cima para baixo

O layout é hierárquico: `entries/monthly/<YYYY>/<YYYY-MM>.md`, `entries/weekly/<YYYY-MM>/<YYYY-Www>.md` e `entries/daily/<YYYY-MM>/<YYYY-MM-DD>.md` (o `<YYYY-MM>` no caminho semanal refere-se ao mês da quinta-feira da semana ISO). Use globs com dois níveis (`*/*.md`) para alcançar todos os arquivos em cada camada.

1. **Extraia termos de busca** da consulta:
   - Palavras-chave literais (minúsculas, separadas por hífen quando multi-palavra).
   - 2–5 sinônimos plausíveis ou termos estreitamente relacionados. Sem consulta externa — raciocine no modelo.

2. **Camada mensal primeiro.** Faça grep por meses candidatos:
   ```bash
   grep -l -i -E "<termo1>|<termo2>|..." entries/monthly/*/*.md 2>/dev/null
   ```
   Execute também uma passagem mais estrita somente contra as linhas de palavras-chave:
   ```bash
   grep -l -E "^keywords:.*(<termo1>|<termo2>)" entries/monthly/*/*.md 2>/dev/null
   ```
   O bloco `keywords: [...]` é sempre uma única linha por arquivo — o match estrito não precisa lidar com wrap.

3. **Restrinja para semanas.** Para cada mês candidato, as semanas que pertencem a ele são aquelas cuja quinta-feira da semana ISO cai naquele mês — e vivem em `entries/weekly/<YYYY-MM>/`. Faça grep nesse subdiretório.

4. **Aponte os dias.** Para cada semana candidata, leia os arquivos diários daquela semana (segunda → domingo). Uma semana pode atravessar dois subdiretórios `entries/daily/<YYYY-MM>/` quando cruza a virada de mês; localize os trechos correspondentes exatos em ambos quando for o caso.

5. **Fallback — períodos sem cobertura.** Para entradas recentes demais para ter resumos semanais/mensais (semana atual, mês atual), faça grep diretamente nos arquivos diários:
   ```bash
   grep -l -i -E "<termos>" entries/daily/*/*.md 2>/dev/null
   ```

## Saída

- Uma linha por correspondência, em ordem cronológica: `YYYY-MM-DD — <trecho em uma linha>`.
- Agrupe correspondências bem relacionadas sob um cabeçalho breve se a resposta abranger múltiplas ocasiões.
- Se nada corresponder, informe os termos e sinônimos tentados e sugira as 3–5 palavras-chave mais próximas presentes no índice (a partir de grep nas linhas `^keywords:` pela árvore).
