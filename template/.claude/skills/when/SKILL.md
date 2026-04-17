---
name: when
description: Finds when an event, person, or topic appears in the journal. Use when the user says /when <query>, or asks "when did X happen" / "when was the last time I saw Y". Takes a text query and returns dates with quote snippets.
---

# when

The user's query is passed as arguments to this skill.

## Approach — walk the hierarchy top-down

The layout is hierarchical: `entries/monthly/<YYYY>/<YYYY-MM>.md`, `entries/weekly/<YYYY-MM>/<YYYY-Www>.md`, and `entries/daily/<YYYY-MM>/<YYYY-MM-DD>.md` (the `<YYYY-MM>` in the weekly path refers to the month of the ISO week's Thursday). Use two-level globs (`*/*.md`) to reach all files at each layer.

1. **Extract search terms** from the query:
   - Literal keywords (lowercase, hyphen-separated when multi-word).
   - 2–5 plausible synonyms or closely related terms. No external lookup — reason within the model.

2. **Monthly layer first.** Grep for candidate months:
   ```bash
   grep -l -i -E "<term1>|<term2>|..." entries/monthly/*/*.md 2>/dev/null
   ```
   Also run a stricter pass against the keyword lines only:
   ```bash
   grep -l -E "^keywords:.*(<term1>|<term2>)" entries/monthly/*/*.md 2>/dev/null
   ```
   The `keywords: [...]` block is always a single line per file — the strict match doesn't need to handle wrapping.

3. **Narrow down to weeks.** For each candidate month, the weeks that belong to it are those whose ISO week's Thursday falls in that month — and they live in `entries/weekly/<YYYY-MM>/`. Grep in that subdirectory.

4. **Pinpoint the days.** For each candidate week, read the daily files of that week (Monday → Sunday). A week may span two `entries/daily/<YYYY-MM>/` subdirectories when it crosses a month boundary; locate the exact matching snippets in both when applicable.

5. **Fallback — uncovered periods.** For entries too recent to have weekly/monthly summaries (current week, current month), grep directly against daily files:
   ```bash
   grep -l -i -E "<terms>" entries/daily/*/*.md 2>/dev/null
   ```

## Output

- One line per match, in chronological order: `YYYY-MM-DD — <single-line snippet>`.
- Group closely related matches under a short heading if the answer spans multiple occasions.
- If nothing matches, report the terms and synonyms tried and suggest the 3–5 closest keywords present in the index (from grepping `^keywords:` lines across the tree).
