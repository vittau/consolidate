---
name: explain
description: Sintetiza o que o journal diz sobre um assunto. Use quando o usuário disser /explain <assunto>, ou perguntar "o que eu sei sobre X" / "me fale sobre Y com base no meu journal". Recebe uma consulta em texto e retorna uma narrativa datada.
---

# explain

A consulta do usuário é passada como argumentos para esta skill.

## Abordagem — correspondência por palavras-chave em todas as camadas, depois síntese

O layout é hierárquico: `entries/monthly/<YYYY>/<YYYY-MM>.md`, `entries/weekly/<YYYY-MM>/<YYYY-Www>.md` e `entries/daily/<YYYY-MM>/<YYYY-MM-DD>.md` (o `<YYYY-MM>` no caminho semanal é o mês da quinta-feira da semana ISO). Use `*/*.md` em cada camada para alcançar todos os arquivos.

1. **Extraia os termos.** A partir da consulta, derive:
   - Palavras-chave literais (minúsculas, separadas por hífen quando multi-palavra).
   - 3–8 sinônimos plausíveis ou termos estreitamente relacionados. Raciocine no modelo, sem dicionário.

2. **Compare com os blocos de palavras-chave** em todas as camadas:
   ```bash
   grep -n -E "^keywords:" entries/monthly/*/*.md entries/weekly/*/*.md entries/daily/*/*.md 2>/dev/null
   ```
   Cada arquivo tem exatamente uma linha `^keywords:` (nunca quebra). Um arquivo é candidato se qualquer uma das suas palavras-chave contiver um termo da consulta ou sinônimo como substring (assim `reuniao` corresponde a `reuniao-do-time`). Faça também um grep case-insensitive no arquivo inteiro como fallback, caso o assunto apareça no texto mas tenha passado despercebido na extração de palavras-chave.

3. **Leia as correspondências em ordem decrescente de abrangência**: mensal (arco) → semanal (fases) → diário (especificidades). Use os resumos mensais/semanais como esqueleto e desça às entradas diárias apenas para momentos concretos, citações e pontos em aberto.

4. **Sintetize a resposta**:
   - Comece com um resumo de 1–2 frases sobre o que o journal diz a respeito do assunto.
   - Depois, apresente um detalhamento cronológico ou temático.
   - Cite uma `YYYY-MM-DD` específica para toda afirmação concreta; cite uma semana (`YYYY-Www`) ou mês (`YYYY-MM`) para afirmações de nível mais alto.
   - Termine com eventuais pontos em aberto — tarefas não resolvidas, itens agendados ou perguntas que as entradas levantaram mas não responderam.

5. **Se nada corresponder**, informe os termos e sinônimos tentados e mostre as 5 palavras-chave mais próximas presentes no índice (amostre linhas `^keywords:` pela árvore).
