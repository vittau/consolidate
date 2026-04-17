# consolidate ⚡️

Scaffold for a personal journaling repository powered by [Claude Code](https://docs.claude.com/en/docs/claude-code) skills. See [template/README.md](template/README.md) for an overview of the framework that the scaffold generates.

## Usage

```bash
npm create consolidate@latest my-journal
# or
npx create-consolidate my-journal

cd my-journal
claude          # opens Claude Code in the directory
/new-entry      # creates the first daily entry
```

If you omit the directory name, the CLI asks interactively.

## What the scaffold does

1. Creates the target directory.
2. Copies the template (skills, `CLAUDE.md`, `.prettierrc`, `entries/` structure, examples).
3. Renames `_gitignore` to `.gitignore`.
4. Replaces `{{projectName}}` in `package.json` and `README.md` with the directory name.
5. Runs `git init` and creates the initial commit.

## Requirements

- Node.js ≥ 18
- [Claude Code](https://docs.claude.com/en/docs/claude-code) installed
- Git (optional — if missing, the CLI skips `git init` and the `consolidate` skill handles it later)

## How it works

Once scaffolded, the repository exposes four Claude Code skills:

| Skill                | What it does                                                  |
| -------------------- | ------------------------------------------------------------- |
| `/new-entry`         | Creates today's daily file (after consolidating any pending work). |
| `/consolidate`       | Indexes daily entries, summarizes complete ISO weeks and complete months. |
| `/when <query>`      | Finds when a topic appears in the journal.                    |
| `/explain <subject>` | Synthesizes what the journal says about a subject.            |

Read [template/README.md](template/README.md) for conventions, Bullet Journal notation, and directory structure.

## Development

```bash
# test the CLI locally without publishing
node bin/index.js /tmp/test-journal
```

## License

MIT
