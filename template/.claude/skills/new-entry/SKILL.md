---
name: new-entry
description: Creates today's daily journal entry. Use when the user says /new-entry, asks to start today's journal, or wants to open today's entry. Always runs `consolidate` first to keep the index up to date.
---

# new-entry

1. **Run `consolidate` first.** Invoke the `consolidate` skill and let it finish before doing anything else. Do not skip this step even if you think nothing is pending — `consolidate` decides.
2. **Compute today's date** in ISO format (`YYYY-MM-DD`) using the system's local date (`date +%Y-%m-%d`).
3. **Create or show the daily file** at `entries/daily/<YYYY-MM>/<date>.md`, where `<YYYY-MM>` is the year-month of the date (first 7 characters of `<date>`). Create the month subdirectory if it doesn't exist yet (`mkdir -p`):
   - If it already exists: do not modify it. Report the path and stop.
   - If it doesn't exist: create it with this minimal template — no extra sections, no pre-filled content:

     ```markdown
     # <date> · <day-of-week>

     ```

     (One header line, one blank line, end of file. The user fills in the rest.)
4. **Report** the file path to the user so they can open it.

## BuJo notation (for the user's reference, not for pre-filling)

Every entry is a markdown list item; the BuJo symbol goes in parentheses after the marker:

- `- (.)` task · `- (x)` completed · `- (<)` scheduled · `- (o)` event · `- (-)` note
- Parentheses (not brackets) to avoid colliding with GFM task lists (`- [x]` / `- [ ]`).
- All ASCII, single-keystroke (US International keyboard).
- Migration is handled automatically by `consolidate`; no notation is needed.
