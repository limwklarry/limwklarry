# CLAUDE.md

This file provides guidance for AI assistants working in this repository.

## Repository Overview

**limwklarry** is a minimal Git repository created in December 2014 as an initial project
placeholder. At present the codebase contains only a README, meaning the project is in a
pre-development or bootstrap stage. There is no application code, build system, test suite,
or CI/CD pipeline yet.

## Repository Structure

```
limwklarry/
├── README.md    # Project title placeholder
└── CLAUDE.md    # This file
```

## Technology Stack

No technology stack has been established. When one is introduced, update this section with:
- Languages and runtimes
- Frameworks and libraries
- Package managers and version requirements
- Build tools

## Development Workflow

### Branching Convention

The repository uses two branch types:
- `master` — the stable integration branch
- `claude/<task-slug>-<session-id>` — session-scoped branches created by Claude Code for
  specific tasks (e.g. `claude/claude-md-mmkj752yz5o3hkv3-B6sdK`)

Always develop on the designated `claude/` branch and push there. Never push directly to
`master` without explicit permission.

### Git Operations

```bash
# Push to feature branch
git push -u origin <branch-name>

# Fetch a specific branch
git fetch origin <branch-name>
```

If a push fails due to network errors, retry up to four times with exponential backoff
(2 s → 4 s → 8 s → 16 s).

### Commit Messages

Write concise, imperative commit messages that describe *what* and *why*:

```
Add user authentication module

Implements JWT-based login/logout so that the API can identify callers
without a session cookie.
```

## Build, Test, and Lint

No build, test, or lint commands are configured yet. When they are added, document them here
so that every contributor (human or AI) can run the same quality gates before pushing.

Example structure to fill in once a stack is chosen:

```bash
# Install dependencies
<package-manager> install

# Run tests
<test-runner>

# Run linter / formatter
<linter>
```

## Environment Variables

No environment variables are required at this time. When secrets or configuration are
introduced, add an `.env.example` file and document each variable below.

| Variable | Required | Description |
|----------|----------|-------------|
| _(none yet)_ | — | — |

## AI Assistant Guidelines

- **Read before modifying.** Always read existing files before editing them.
- **Keep changes minimal.** Only make changes that are directly requested or clearly
  necessary. Avoid refactoring, adding docstrings, or "improving" code beyond the task scope.
- **No unnecessary files.** Prefer editing existing files over creating new ones.
- **Security first.** Do not introduce command injection, XSS, SQL injection, or other
  OWASP Top 10 vulnerabilities.
- **Confirm destructive actions.** Before deleting files, force-pushing, or resetting
  history, confirm with the user.
- **Branch discipline.** Commit and push only to the designated `claude/` branch.
- **Update this file.** Whenever the project gains a meaningful new capability (new language,
  framework, build step, or workflow), update the relevant section of this CLAUDE.md so
  future AI sessions have accurate context.
