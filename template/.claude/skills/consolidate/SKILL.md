---
name: consolidate
description: Processes pending journal work — adds keywords to daily entries, summarizes complete ISO weeks, and summarizes complete months. Use when the user says /consolidate, asks to index/summarize/update the journal, or implicitly via `new-entry`.
---

# consolidate

## Step 0 — Ensure a git repository

### 0.1 — Check the git installation

Before anything else, verify that the `git` binary exists on the machine:

```bash
command -v git >/dev/null 2>&1
```

If the command fails (exit code ≠ 0), **stop immediately** and tell the user:

> ❌ `git` is not installed on this machine. Installing git is **required** to use the `consolidate` framework (step 6 of each run commits the work to history). Install it from https://git-scm.com/downloads and run the skill again.

Do not proceed with any other step until git is available.

### 0.2 — Check / initialize the repository

Check whether the directory is a git repository:

```bash
git -C "${CLAUDE_PROJECT_DIR:-.}" rev-parse --is-inside-work-tree 2>/dev/null
```

If it is (exit code 0), go to Step 1.

Otherwise, initialize the repo **and** create an initial commit containing only the skills and project base files — never user entries:

```bash
git -C "${CLAUDE_PROJECT_DIR:-.}" init
```

Then explicitly stage only the base paths that actually exist in the repo. Expected candidates:

- `.claude/` — skills, settings, and other Claude Code artifacts.
- `CLAUDE.md` — project instructions for Claude Code.
- `README.md` — user-facing documentation.
- `package.json` — ESM marker and `detect` script.
- `.prettierrc` — formatting configuration.

Stage only those that exist (skip the missing ones), and **never** use `git add .` or `-A` here, to avoid capturing `.DS_Store`, `entries/`, or other artifacts:

```bash
git -C "${CLAUDE_PROJECT_DIR:-.}" add <existing base paths>
```

Initial commit (heredoc to preserve formatting):

```bash
git -C "${CLAUDE_PROJECT_DIR:-.}" commit -m "$(cat <<'EOF'
init: skills and project base files

Initial commit generated automatically by the consolidate skill
on its first run in a directory without a git repository.
EOF
)"
```

If the initial commit fails due to a hook, investigate and retry — do not use `--no-verify`. After that, proceed normally; Step 6 is still responsible for committing this run's consolidation work (daily, weekly, and monthly entries).

## Step 1 — Detect pending work

Run the detection script:

```bash
node "${CLAUDE_PROJECT_DIR:-.}/.claude/skills/consolidate/detect.js"
```

It prints three sections:
1. Daily entries without a `keywords:` block.
2. Complete ISO weeks without a weekly summary.
3. Complete months without a monthly summary.

If all three are `(none)`, report "nothing to consolidate" and stop.

## Step 2 — Add keywords to daily entries

For each daily file listed in section 1:
1. Read the full contents.
2. Extract **5–15 lowercase keywords** capturing the most relevant people, projects, places, events, and themes. Hyphenate multi-word terms (e.g., `performance-review`). Avoid generic filler.
3. Append this block to the **end** of the file, preserving all prior content and leaving exactly one blank line before `---`:

   ```
   
   ---
   keywords: [word1, word2, word3]
   ```

Never touch the user-written content.

## Step 3 — Summarize complete weeks

For each pending week (`YYYY-Www`) listed in section 2:
1. Identify the daily files for that week. An ISO week runs Monday → Sunday; match filenames by computing each daily file's `isocalendar()`. Daily files live at `entries/daily/<YYYY-MM>/<YYYY-MM-DD>.md`, so a week can span two subdirectories when it crosses a month boundary.
2. Read all of them (they already have keyword blocks because step 2 ran first).
3. Write `entries/weekly/<YYYY-MM>/<YYYY-Www>.md`, where `<YYYY-MM>` is the year-month of the ISO week's **Thursday** (ISO standard for assigning a week to a month). Create the subdirectory if it doesn't exist yet (`mkdir -p`):

   ```markdown
   # <YYYY-Www> · <DD Mmm> – <DD Mmm>

   ## Summary
   <4–8 sentence narrative covering the week's themes, key events, and outcomes.>

   ## Carry-forward
   <Scheduled `- (<)` tasks and unfinished `- (.)` tasks from the week. Each carry-forward is itself a markdown list item, with the source date added in parentheses after the text, e.g., `- (.) call the accountant (from 2026-04-14)`. Omit the section if there are no carry-forwards.>

   ---
   keywords: [word1, word2, ...]
   ```

   `Mmm` in English: `Jan`, `Feb`, `Mar`, `Apr`, `May`, `Jun`, `Jul`, `Aug`, `Sep`, `Oct`, `Nov`, `Dec`.

4. Keywords: the most relevant union of the daily keywords (aim for 10–20).

## Step 4 — Summarize complete months

For each pending month (`YYYY-MM`) listed in section 3:
1. Identify the weekly files whose ISO week's **Thursday** falls in that month (ISO standard for assigning a week to a month). By the same rule, those files live in `entries/weekly/<YYYY-MM>/` — so for a given month, all candidate weekly files are in the `entries/weekly/<YYYY-MM>/` subdirectory.
2. Read them.
3. Write `entries/monthly/<YYYY>/<YYYY-MM>.md`. Create the year subdirectory if it doesn't exist yet (`mkdir -p`):

   ```markdown
   # <Month YYYY>

   ## Summary
   <Broader 6–12 sentence narrative covering the month's weeks.>

   ## Open items
   <Carry-forwards still unresolved at the end of the month. Omit if none.>

   ---
   keywords: [word1, word2, ...]
   ```

   `Month` in English, written out: `January`, `February`, `March`, `April`, `May`, `June`, `July`, `August`, `September`, `October`, `November`, `December`.

4. Keywords: the most relevant union of the weekly keywords (aim for 15–30).

## Step 5 — Report

Summarize for the user in one line: `N dailies with keywords · M weekly summaries · K monthly summaries`.

## Step 6 — Git commit

If no files were touched in steps 2–4, skip this step (nothing to commit).

Otherwise, make a single commit that includes only the files actually produced or changed by this run:

- Daily files that received a keyword block in step 2.
- Weekly files created in step 3.
- Monthly files created in step 4.

Steps:

1. Explicit stage (never `git add .` or `-A`):

   ```bash
   git -C "${CLAUDE_PROJECT_DIR:-.}" add <paths touched in steps 2–4>
   ```

2. Build the message in this format:

   ```
   consolidate: <summary>

   daily: YYYY-MM-DD, YYYY-MM-DD, ...
   weekly: YYYY-Www, ...
   monthly: YYYY-MM, ...
   ```

   Message rules:
   - The `<summary>` line is a short counter, e.g., `3 dailies, 1 weekly`.
   - Include only the `daily:` / `weekly:` / `monthly:` lines that have items; omit the empty ones.
   - If there are no dailies but there are weekly or monthly summaries, the "consolidated days" section is represented by the coverage dates of those summaries (e.g., `weekly: 2026-W15` covers 2026-04-06 – 2026-04-12).

3. Commit via heredoc, preserving line breaks:

   ```bash
   git -C "${CLAUDE_PROJECT_DIR:-.}" commit -m "$(cat <<'EOF'
   consolidate: <summary>

   daily: ...
   weekly: ...
   monthly: ...
   EOF
   )"
   ```

If the commit fails because of a hook, investigate the root cause and retry — do not use `--no-verify`.

## Rules

- Run `detect.js` first. Process only what it lists. Don't re-apply keywords to daily files that already have a `keywords:` block. Don't overwrite existing weekly/monthly files.
- Never edit user-written content in a daily entry — only append the keyword block.
- The keyword block is always the **last thing** in the file.
- The `keywords: [...]` line **never wraps** across multiple lines, even if it exceeds `printWidth`. The `when` and `explain` skills rely on a single `^keywords:` per file for strict grep.
- Order matters: run steps 2 → 3 → 4 in that order, so weekly summaries can lean on the freshly added daily keywords.
- Re-running is idempotent: if the skill is interrupted between steps, just run it again — `detect.js` only lists what's still missing. Step 6 commits only if there's new work, so re-runs don't produce empty commits.
- Step 6 does not use `git add .` or `-A`. Always stage explicitly the files from steps 2–4 to avoid capturing artifacts like `.DS_Store`.
