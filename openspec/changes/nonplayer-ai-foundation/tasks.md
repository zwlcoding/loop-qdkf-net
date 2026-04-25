## 1. AI foundation

- [x] 1.1 Create `frontend/src/ai/` primitives for decision context, action candidates, score weights, planner evaluation, and reusable profiles
- [x] 1.2 Add focused tests for score aggregation, tie-breaking, and legality filtering so planner decisions are deterministic and reviewable

## 2. Bot squad integration

- [x] 2.1 Integrate the planner with second-squad turns so a bot-controlled squad can move, attack, and pursue mission goals inside the existing battle loop
- [x] 2.2 Implement the first three bot profiles (`coop_squad`, `aggressive_rival`, `reversal_squad`) and wire reversal switching from mission state
- [x] 2.3 Add focused validation for the three approved mission templates so bot-vs-player runs cover cooperation, competition, and reversal flows

## 3. Boss integration

- [x] 3.1 Implement a first-wave boss profile layer on top of the shared planner with readable objective, pressure, and survival priorities
- [x] 3.2 Add focused tests and battle-scene validation for boss-driven cooperation pressure and extraction-stage behavior

## 4. Verification and scope control

- [x] 4.1 Run `cd frontend && npm test` and `cd frontend && npm run build` after integration passes
- [x] 4.2 Update change docs and task checkboxes so only completed AI-foundation scope is marked done
