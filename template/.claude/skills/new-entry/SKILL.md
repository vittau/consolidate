---
name: new-entry
description: Cria a entrada diária de hoje no journal. Use quando o usuário disser /new-entry, pedir para iniciar o journal de hoje, ou quiser abrir a entrada do dia. Sempre executa `consolidate` primeiro para manter o índice atualizado.
---

# new-entry

1. **Execute `consolidate` primeiro.** Invoque a skill `consolidate` e deixe-a terminar antes de fazer qualquer outra coisa. Não pule esta etapa mesmo se achar que nada está pendente — quem decide é o `consolidate`.
2. **Calcule a data de hoje** no formato ISO (`YYYY-MM-DD`) usando a data local do sistema (`date +%Y-%m-%d`).
3. **Crie ou mostre o arquivo diário** em `entries/daily/<YYYY-MM>/<data>.md`, onde `<YYYY-MM>` é o ano-mês da data (primeiros 7 caracteres de `<data>`). Crie o subdiretório do mês se ainda não existir (`mkdir -p`):
   - Se já existir: não modifique. Informe o caminho e pare.
   - Se não existir: crie-o com este template mínimo — sem seções extras, sem conteúdo pré-preenchido:

     ```markdown
     # <data> · <dia-da-semana>

     ```

     (Uma linha de cabeçalho, uma linha em branco, fim de arquivo. O usuário preenche o resto.)
4. **Informe** o caminho do arquivo ao usuário para que ele possa abri-lo.

## Notação BuJo (para referência do usuário, não para pré-preencher)

Toda entrada é um item de lista markdown; o símbolo BuJo vem entre parênteses após o marcador:

- `- (.)` tarefa · `- (x)` concluída · `- (<)` agendada · `- (o)` evento · `- (-)` nota
- Parênteses (e não colchetes) para não colidir com task lists do GFM (`- [x]` / `- [ ]`).
- Tudo ASCII de um único toque (teclado US International).
- A migração é tratada automaticamente pelo `consolidate`; nenhuma notação é necessária.
