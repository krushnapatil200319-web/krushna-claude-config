# krushna-claude-config

**One command to set up [Claude Code](https://claude.com/claude-code) in any project**: strict engineering rules (`CLAUDE.md`), code-review and security checklists, skills, slash commands, and project memory. One command takes it all out again.

```bash
npx krushna-claude-config
```

> **TL;DR:** run it in your project folder, then start `claude`. Claude now follows a strict "contract first, verify by running it" engineering process, reviews code against security, Supabase and edge-case checklists, and remembers how you like to work.

---

## Quick start

1. `cd` into your project (any folder inside a git repo works).
2. Run `npx krushna-claude-config`
3. Start Claude Code: `claude`

To remove everything it added:

```bash
npx krushna-claude-config uninstall
```

## What gets installed

| What | Where | What it does |
|---|---|---|
| `CLAUDE.md` | your project root | Engineering rules: contract first, attack the plan, three outcomes per external call, no silent data loss, prove it by running it, a load/concurrency/partial-failure review, security floor |
| `.claude/commands/deep-review.md` | your project | `/deep-review` slash command: a full pre-PR review in phases |
| `.claude/review/*.md` | your project | Checklists: security (auth, IDOR, privilege escalation, secrets), Supabase (RLS, tenant isolation, service role), edge functions, edge cases, common rules, team rules |
| `.claude/skills/code-review` | your project | A deep code-review and audit skill with worked examples of real bugs |
| `.claude/skills/frontend` | your project | React / Next.js / TypeScript conventions: match the codebase you're in |
| `MEMORY.md` | `~/.claude/projects/<your-project>/memory/` | Working preferences and lessons Claude loads every session: reply format, git rules, Supabase and Next.js pitfalls |

## Safe by default

- **Never overwrites your files.** Existing files are skipped. `--force` replaces them, and backs up each original first (`file.bak-<time>`).
- **Uninstall removes only what it added**, and only files you haven't changed. Files you edited are kept. Backed-up originals are put back.
- **Stays out of git.** `.claude/` and `CLAUDE.md` go into `.git/info/exclude` (local only; your `.gitignore` is untouched). Files git already tracks stay tracked.
- **Re-running is safe.** Unchanged files are left alone, and files from an older version are updated.
- **Works from subfolders and worktrees.** Installs at the repo root. All worktrees of a repo share one memory, just like Claude Code does.
- **Refuses to run in your home folder**, so your global `~/.claude` is never touched.

## Options

| Command | Does |
|---|---|
| `npx krushna-claude-config` | Install; skip files that already exist |
| `npx krushna-claude-config --force` | Install; replace existing files (originals backed up) |
| `npx krushna-claude-config uninstall` | Remove what was installed; restore backups |

## Where is the memory file?

Claude Code keeps memory per project in your home folder, named after the project path:

```
C:\projects\my-app  ->  ~/.claude/projects/C--projects-my-app/memory/MEMORY.md
/home/me/my-app     ->  ~/.claude/projects/-home-me-my-app/memory/MEMORY.md
```

Inside a git repo the name comes from the repo root, so running from a subfolder lands in the same place.

## Requirements

- Node.js 16.7 or newer
- Git (optional: without it, the current folder is treated as the project)
- [Claude Code](https://claude.com/claude-code)

## FAQ

**Does it change my existing `CLAUDE.md` or memory?**
No, unless you pass `--force`. Then the original is backed up, and `uninstall` puts it back.

**Will my team get these files through git?**
No. They are hidden from git on your machine only. To share them, remove the lines from `.git/info/exclude` and commit the files.

**Is this an official Anthropic package?**
No. It's a personal configuration for Claude Code.

## License

MIT
