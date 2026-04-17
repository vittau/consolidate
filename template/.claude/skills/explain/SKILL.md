---
name: explain
description: Synthesizes what the journal says about a subject. Use when the user says /explain <subject>, or asks "what do I know about X" / "tell me about Y based on my journal". Takes a text query and returns a dated narrative.
---

# explain

The user's query is passed as arguments to this skill.

## Approach — keyword matching across all layers, then synthesis

The layout is hierarchical: `entries/monthly/<YYYY>/<YYYY-MM>.md`, `entries/weekly/<YYYY-MM>/<YYYY-Www>.md`, and `entries/daily/<YYYY-MM>/<YYYY-MM-DD>.md` (the `<YYYY-MM>` in the weekly path is the month of the ISO week's Thursday). Use `*/*.md` at each layer to reach all files.

1. **Extract terms.** From the query, derive:
   - Literal keywords (lowercase, hyphen-separated when multi-word).
   - 3–8 plausible synonyms or closely related terms. Reason within the model; no dictionary.

2. **Match against keyword blocks** across all layers:
   ```bash
   grep -n -E "^keywords:" entries/monthly/*/*.md entries/weekly/*/*.md entries/daily/*/*.md 2>/dev/null
   ```
   Each file has exactly one `^keywords:` line (never wraps). A file is a candidate if any of its keywords contains a query term or synonym as a substring (so `meeting` matches `team-meeting`). Also run a case-insensitive grep over the full file as a fallback, in case the subject appears in the text but was missed in keyword extraction.

3. **Read the matches in decreasing breadth**: monthly (arc) → weekly (phases) → daily (specifics). Use monthly/weekly summaries as the skeleton and drop down to daily entries only for concrete moments, quotes, and open items.

4. **Synthesize the answer**:
   - Start with a 1–2 sentence summary of what the journal says about the subject.
   - Then give a chronological or thematic breakdown.
   - Cite a specific `YYYY-MM-DD` for every concrete claim; cite a week (`YYYY-Www`) or month (`YYYY-MM`) for higher-level claims.
   - Close with any open items — unresolved tasks, scheduled items, or questions the entries raised but didn't answer.

5. **If nothing matches**, report the terms and synonyms tried and show the 5 closest keywords present in the index (sample `^keywords:` lines across the tree).
