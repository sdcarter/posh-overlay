# Tasks: Add Speed Display in km/h

**Input**: Design documents from `specs/005-add-speed-display/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Verify `005-add-speed-display` branch is active and environment is ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core telemetry data updates required before UI changes

- [x] T002 Update `TelemetrySnapshot` interface to include `speedKmH: number` in `src/domain/telemetry/types.ts`
- [x] T003 Map iRacing `Speed` (m/s) to `speedKmH` (with 3.6 multiplier) in `src/adapters/telemetry-iracing/iracing-telemetry-provider.ts`
- [x] T004 [P] Add simulated `speedKmH` to all mock scenarios in `src/adapters/telemetry-mock/mock-telemetry-provider.ts`

**Checkpoint**: Telemetry data foundation ready.

---

## Phase 3: User Story 1 - Real-time Speed Monitoring (Priority: P1) 🎯 MVP

**Goal**: Display live speed in km/h as the first element in the telemetry row.

**Independent Test**: Run `npm run mock` and verify speed is displayed at the leftmost position and updates correctly.

### Implementation for User Story 1

- [x] T005 [US1] Implement `speedKmH` value formatting and display in `src/renderer/components/Overlay.tsx`
- [x] T006 [US1] Rearrange telemetry row layout to `[Speed] | [RPM] | [Gear]` in `src/renderer/components/Overlay.tsx`

**Checkpoint**: User Story 1 functional (Speed displayed in correct order).

---

## Phase 4: User Story 2 - Visual Emphasis on RPMs (Priority: P2)

**Goal**: Apply requested visual styling to emphasize RPMs and de-emphasize speed/gear.

**Independent Test**: Visual inspection of overlay to ensure RPM is largest and uses "Impact" font, while Speed/Gear are smaller and equal-sized.

### Implementation for User Story 2

- [x] T007 [US2] Apply "Impact" font family and increased font-size to RPM value in `src/renderer/components/Overlay.tsx`
- [x] T008 [US2] Set Speed and Gear font-sizes to equal, smaller values in `src/renderer/components/Overlay.tsx`

**Checkpoint**: User Story 2 functional (Visual styling complete).

---

## Phase 5: Polish & Validation

**Purpose**: Final verification and cross-cutting checks.

- [x] T009 [P] Verify that new telemetry row elements scale correctly with overlay height in `src/renderer/components/Overlay.tsx`
- [x] T010 Run `npm run lint` and verify all tests/mocks pass
- [x] T011 Validate entire feature against `quickstart.md` using `npm run mock`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1. BLOCKS all UI work.
- **User Stories (Phase 3-4)**: Depend on Phase 2. Can be implemented sequentially (recommended for visual flow).
- **Polish (Phase 5)**: Depends on all user stories being complete.

### Parallel Opportunities

- T004 (Mock Provider) can be done in parallel with T003 (iRacing Provider).
- T009 (Scaling verification) can be done in parallel with T010 (Linting).

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Foundational telemetry updates (Phase 2).
2. Implement basic Speed display and layout (Phase 3).
3. **VALIDATE**: Speed is visible and updates in `npm run mock`.

### Incremental Delivery

1. Foundation ready (T002-T004).
2. US1 Delivered (Speed is there).
3. US2 Delivered (Styling is correct).
4. Final Polish.
