---
name: git-finish-and-push
description: Finalize implementation tasks by validating changes, committing with a clear message, and pushing to origin. Use when work includes file edits, refactors, fixes, or feature delivery in this repository.
disable-model-invocation: true
---

# Git Finish And Push

Use this skill whenever task work modified files in this repository.

## Mandatory checklist

Copy this list and complete each item:

Task progress:
- [ ] 1) Confirm changed files are intentional (`git status --short`)
- [ ] 2) Review diff scope (`git diff`)
- [ ] 3) Run relevant checks (tests/lint/build as appropriate)
- [ ] 4) Stage only intended files
- [ ] 5) Commit with a concise why-focused message
- [ ] 6) Rebase if remote advanced (`git pull --rebase origin <branch>`)
- [ ] 7) Push (`git push origin HEAD`)
- [ ] 8) Report commit SHA + branch in final response

## Command sequence

```bash
git status --short --branch
git diff
# run relevant validation commands
git add <intended-files>
git commit -m "<type>: <intent>"
git pull --rebase origin <current-branch>
git push origin HEAD
git rev-parse --short HEAD
```

## Failure handling

- If push fails, attempt one recovery pass (resolve conflicts or rebase issues), then push again.
- If still blocked by auth, permissions, branch protection, or network, stop and report:
  - failure reason,
  - branch,
  - latest local commit SHA,
  - exact next command the user should run.
