# Tasks: Fix lap countdown for timed (road) races

**Input**: Design documents from `/specs/011-timed-race-lap-countdown/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Verified via the `mock:timed` telemetry scenario.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Add new snapshot field

- [x] T001 [P] Add `sessionAvgLapTimeSeconds: number | null` to `TelemetrySnapshot` in `src/domain/telemetry/types.ts`

---

## Phase 2: Foundational (Domain Logic)

**Purpose**: Fix the estimation and guard logic in the domain layer

- [x] T002 [US1] Update `calculateEstimatedSessionTotal()` in `src/domain/telemetry/lap-count.ts` to prefer `sessionAvgLapTimeSeconds` over `sessionLastLapTimeSeconds`
- [x] T003 [US2] Add timer-expired guard in `lapsRemainingForDriver()` in `src/domain/telemetry/lap-count.ts` — return 1 when `sessionTimeRemainSeconds <= 0` and race is still active
- [x] T004 [P] [US1] Update `lapProgress()` fallback in `src/domain/ribbon/formatters.ts` to prefer `sessionAvgLapTimeSeconds`

**Checkpoint**: Domain logic is correct for timed races

---

## Phase 3: Adapter (Rolling Average)

**Purpose**: Compute and expose the rolling average from the iRacing adapter

- [x] T005 [US1] Add `lapTimeHistory: number[]` and rolling average computation to `IRacingTelemetryProvider` in `src/adapters/telemetry-iracing/iracing-telemetry-provider.ts`
- [x] T006 [US1] Set `sessionAvgLapTimeSeconds` on the snapshot in the adapter

**Checkpoint**: iRacing adapter produces stable rolling average

---

## Phase 4: Mock Scenario

**Purpose**: Enable visual testing of timed race behavior

- [x] T007 [US3] Implement `timed` mock scenario in `src/adapters/telemetry-mock/mock-telemetry-provider.ts`
- [x] T008 [US3] Add `mock:timed` script to `package.json`
- [x] T009 [US3] Update mock `baseSnapshot` to include `sessionAvgLapTimeSeconds: null`

**Checkpoint**: `npm run mock:timed` shows a timed race lifecycle

---

## Phase 5: Polish

- [x] T010 [P] Run `npm run lint` and `npm run build` to ensure project integrity
- [x] T011 [P] Validate quickstart.md steps
