---
description: "Task list for Adaptive UI Layout & LED Collision Avoidance"
---

# Tasks: Adaptive UI Layout & LED Collision Avoidance

**Input**: Design documents from `/specs/015-adaptive-ui-led-collision/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Update telemetry definitions and SDK mapping

- [x] T001 [P] Update `TelemetrySnapshot` interface with `sessionLapsTotal`, `isOnTrack`, `isReplayPlaying`, and `sessionType` in `src/domain/telemetry/types.ts`
- [x] T002 [P] Update `RevStripState` with `ledCount`, `yOffset`, and `ledSpacingScale` in `src/domain/rev-strip/types.ts`
- [x] T003 Update `iracing-telemetry-provider.ts` to map raw SDK variables (`SessionLaps`, `IsOnTrack`, `IsReplayPlaying`) to the snapshot in `src/adapters/telemetry-iracing/iracing-telemetry-provider.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core logic for session tracking and visibility

- [x] T004 Implement `sessionType` detection logic (Lap-based if < 32767) and update `TelemetrySnapshot` creation in `src/adapters/telemetry-iracing/iracing-telemetry-provider.ts`
- [x] T005 [P] Update `RibbonState` to include `lapInfoText` and `visible` fields in `src/domain/ribbon/types.ts`

---

## Phase 3: User Story 1 - Adaptive Info Boxes (Priority: P1) 🎯 MVP

**Goal**: Transition Lap/Position containers to rectangular format

**Independent Test**: Verify Lap/Position boxes are rectangular (120x60) and anchored to corners.

### Implementation for User Story 1

- [x] T006 [US1] Update `composeRibbon` to generate `lapInfoText` using raw `Lap` and `sessionLapsTotal` (or `SessionTimeRemain`) in `src/application/use-cases/compose-ribbon.ts`
- [x] T007 [US1] Update `Overlay.tsx` to render `lapPillStyle` and `positionPillStyle` as 120x60 rectangles in `src/renderer/components/Overlay.tsx`
- [x] T008 [US1] Implement visibility toggle in `Overlay.tsx` using `frame.snapshot.isOnTrack && !frame.snapshot.isReplayPlaying` in `src/renderer/components/Overlay.tsx`

---

## Phase 4: User Story 2 - LED Collision Avoidance (Priority: P1)

**Goal**: Reposition and scale LED bar to prevent overlap

**Independent Test**: Verify 10px buffer above boxes and dynamic scaling on wide-array cars.

### Implementation for User Story 2

- [x] T009 [US2] Implement dynamic `yOffset` and `ledSpacingScale` calculation in `compose-rev-strip.ts` based on LED count and "Safe Zone" width in `src/application/use-cases/compose-rev-strip.ts`
- [x] T010 [US2] Update `RevDots` component to apply `yOffset` and `ledSpacingScale` (adjusting `blockWidth` or `gap`) in `src/renderer/components/Overlay.tsx`

---

## Phase 5: User Story 3 - Contextual Session Information (Priority: P2)

**Goal**: Switch between Lap and Time display formats

**Independent Test**: Switch mock session types and verify "Lap X/Y" vs "MM:SS" formatting.

### Implementation for User Story 3

- [x] T011 [US3] Add time formatting utility for `HH:MM:SS` vs `MM:SS` in `src/domain/ribbon/formatters.ts`
- [x] T012 [US3] Refine `lapInfoText` logic in `composeRibbon` to use the new time formatter when `sessionType` is `time-based` in `src/application/use-cases/compose-ribbon.ts`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Storybook updates and validation

- [x] T013 [P] Update `Overlay.stories.tsx` with new rectangular layout and various session type stories in `src/renderer/Overlay.stories.tsx`
- [x] T014 Create `wide-led-collision.mjs` mock scenario to verify dynamic scaling in `scripts/run-mock-scenario.mjs` (or new file)
- [x] T015 Run `npm run lint` and verify all changes follow hexagonal architecture

---

## Dependencies & Execution Order

- **Setup & Foundational (T001-T005)**: Must complete first to provide data to UI.
- **US1 (T006-T008)**: Core UI structure change.
- **US2 (T009-T010)**: Depends on US1 (rectangular box dimensions define the Safe Zone).
- **US3 (T011-T012)**: Enhancement of session data display.
- **Polish (T013-T015)**: Final verification.

---

## Implementation Strategy

### MVP First (User Story 1 & Foundational)
1. Update SDK mapping and data types.
2. Implement rectangular boxes and visibility logic.
3. **Verify**: Boxes are rectangular and dashboard hides in garage.

### Incremental LED Fix
1. Implement dynamic scaling logic.
2. **Verify**: Wide-array cars (e.g., BMW GT3) don't overlap info boxes.
