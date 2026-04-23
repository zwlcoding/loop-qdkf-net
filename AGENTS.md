# AGENTS.md

This repo uses OpenSpec core as the only workflow system.
Do not modify upstream-generated OpenSpec or Superpowers files unless the user explicitly asks for that.

Operating model
- OpenSpec handles change lifecycle.
- Superpowers provides optional skills/methods.
- OpenCode is the execution surface.
- Hermes is the review gate before implementation.

Required flow
1. Hermes invokes OpenCode brainstorming first when the idea is not already finalized.
2. Hermes invokes OpenCode to create OpenSpec artifacts.
3. Hermes reviews the generated artifacts outside OpenCode.
4. Only then does Hermes invoke OpenCode implementation.
5. Do not archive automatically after implementation. Wait for explicit user instruction.

Preferred command sequence used by Hermes
1. `/brainstorm-propose <idea>`
2. `/opsx-propose <approved idea>`
3. Hermes reviews `openspec/changes/<name>/...` outside OpenCode
4. `/opsx-apply [change-name]`
5. `/opsx-archive [change-name]` only when the user explicitly asks to archive

Rules

1. Brainstorm before proposal
- Before `/opsx-propose`, use `superpowers/brainstorming` unless the user explicitly says the idea is already finalized.
- Brainstorming is for scope, constraints, tradeoffs, risks, and success criteria.
- Brainstorming must not write implementation code.

2. Hermes review gate before implementation
- Do not run `/opsx-apply` until Hermes has reviewed the generated artifacts and declared `READY FOR APPLY`.
- Review must inspect at least:
  - `proposal.md`
  - `design.md`
  - `tasks.md`
  - generated specs inside the change folder
- If review finds drift, ambiguity, or mismatch, fix the artifacts first.
- This review happens in Hermes, not as an OpenCode repo command.

3. Keep OpenSpec upstream commands untouched
- Treat `.opencode/commands/opsx-*.md` and `.opencode/skills/openspec-*` as upstream-generated.
- Do not patch them for project-specific behavior.
- Put project behavior in this `AGENTS.md` or in additional custom commands only.

4. Use Superpowers as a capability layer
Use these skills when appropriate:
- `superpowers/brainstorming` before proposal work
- `superpowers/test-driven-development` during implementation when meaningful
- `superpowers/systematic-debugging` when blocked or behavior is unclear
- `superpowers/receiving-code-review` when processing review feedback
- `superpowers/finishing-a-development-branch` when deciding how to wrap up completed work

5. Implementation discipline
- Keep changes tightly scoped to the current tasks.
- Update task checkboxes immediately after each completed task.
- If implementation reveals artifact mistakes, pause and fix the artifacts first.
- Prefer test-first work whenever meaningful.

3. Archive is manual or user-triggered
- After `/opsx-apply` completes, stop and wait.
- The user may test manually and then ask Hermes to archive, or archive manually.
- Do not archive just because implementation finished.

Hermes review output contract
- `READY FOR APPLY`
- `NOT READY FOR APPLY`

If the answer is not `READY FOR APPLY`, implementation does not start.
