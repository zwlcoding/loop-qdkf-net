## 1. Battle setup contract

- [x] 1.1 Define a validated local battle setup data contract for two squads and optional mission/boss context
- [x] 1.2 Refactor BattleScene initialization to consume setup data instead of relying only on hardcoded seeded units

## 2. Local dual-squad flow

- [x] 2.1 Add a minimal local squad setup entry flow that can produce two playable squads
- [x] 2.2 Keep the current AI / mission / mobile-touch flow working when a battle is started from setup data

## 3. Result summary

- [x] 3.1 Add a lightweight post-battle result summary for both squads (survival, extraction, objective completion, payout conversion)
- [x] 3.2 Add focused validation for setup -> battle -> result flow

## 4. Verification

- [x] 4.1 Run `cd frontend && npm test`
- [x] 4.2 Run `cd frontend && npm run build`
- [ ] 4.3 Update change docs/tasks after local and phone preview verification (local preview HTTP check passed via `npm run preview` + `curl`; phone preview not executed in this environment)
