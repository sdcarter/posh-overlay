# Tasks: Refine fuel estimation for initial laps

**Input**: Design documents from `/specs/010-fuel-estimation-init/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Verified via the mock telemetry scenario.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Add `mock:stabilizing-fuel` script to `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T002 [P] Add `fuelLapCount: number | null` to `TelemetrySnapshot` in `src/domain/telemetry/types.ts`
- [x] T003 [P] Add `stabilizing` to `FuelStatus` union in `src/domain/fuel/fuel-laps.ts` and `src/domain/ribbon/types.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Initial Session Start (Priority: P1) 🎯 MVP

**Goal**: Provide a preliminary fuel estimate after the first valid lap with a Blue Dot indicator.

**Independent Test**: Run `npm run mock:stabilizing-fuel` and verify the Blue Dot appears after the first lap completes.

### Implementation for User Story 1

- [x] T004 [P] [US1] Implement `isLapConsumptionOutlier(consumed, average)` in `src/domain/fuel/fuel-laps.ts`
- [x] T005 [US1] Update `evaluateFuelStatus` in `src/domain/fuel/fuel-laps.ts` to handle `lapCount < 4` and return `stabilizing`
- [x] T006 [US1] Update `composeRibbon` in `src/application/use-cases/compose-ribbon.ts` to pass `snapshot.fuelLapCount` to `evaluateFuelStatus`
- [x] T007 [US1] Refactor `IRacingTelemetryProvider` in `src/adapters/telemetry-iracing/iracing-telemetry-provider.ts` to implement expanding average and outlier detection
- [x] T008 [P] [US1] Update `Overlay.tsx` in `src/renderer/components/Overlay.tsx` to render Blue Dot (`#3b82f6`) for `stabilizing` status
- [x] T009 [US1] Implement `stabilizing-fuel` scenario in `src/adapters/telemetry-mock/mock-telemetry-provider.ts`

**Checkpoint**: User Story 1 is functional. The system now shows fuel data after 1 lap.

---

## Phase 4: User Story 2 - Incremental Accuracy (Priority: P2)

**Goal**: Accuracy improves as more laps (2-3) are added to the average.

**Independent Test**: Run `npm run mock:stabilizing-fuel` and verify the estimate updates on Laps 2 and 3 while remaining "Blue".

### Implementation for User Story 2

- [x] T010 [US2] Verify `IRacingTelemetryProvider` logic correctly handles the transition from 1 to 3 laps in history (implemented in T007)

**Checkpoint**: User Story 2 is verified.

---

## Phase 5: User Story 3 - Steady State Transition (Priority: P3)

**Goal**: Transition to standard Green/Yellow/Red status after 4 valid laps.

**Independent Test**: Run `npm run mock:stabilizing-fuel` and verify the dot changes from Blue to Green/Yellow/Red after Lap 4 completes.

### Implementation for User Story 3

- [x] T011 [US3] Verify `evaluateFuelStatus` correctly transitions from `stabilizing` to standard status when `lapCount >= 4` (implemented in T005)

**Checkpoint**: All user stories are functional and verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T012 [P] Run `npm run lint` and `npm run build` to ensure project integrity
- [x] T013 [P] Final validation of `quickstart.md` steps
