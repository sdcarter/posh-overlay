# Tasks: BMW M4 GT3 Styling

**Input**: Design documents from `/specs/013-bmw-gt3-theme/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Structural updates and core CSS token implementation

- [x] T001 Define BMW M-Sport color variables (`#009CDE`, `#0033A0`, `#FF0000`, `#121212`) in `src/renderer/index.css`
- [x] T002 Add the `DIN` or blocky sans-serif font base styles in `src/renderer/index.css`

---

## Phase 2: User Story 1 - Central Data Capsules (Priority: P1) 🎯 MVP

**Goal**: The driver needs to easily glance at the Gear and Speed telemetry, which must be clearly legible and centrally focused inside distinct technical capsules defined by 1px white borders.

**Independent Test**: Can be tested by running a mock simulation or entering a practice session and verifying that Gear and Speed appear precisely in the center inside sharp 1px white-border capsules.

### Implementation for User Story 1

- [x] T003 [US1] Refactor `src/renderer/components/Overlay.tsx` to enforce 0px border radius on all geometric components, removing previous rounded designs.
- [x] T004 [US1] Update `src/renderer/components/Overlay.tsx` layout to structure Gear and Speed into central data capsules with a `1px solid white` boundary.
- [x] T005 [US1] Verify Storybook visually confirms the Gear/Speed capsule styling (`npm run storybook`).

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 3: User Story 2 - Rectangular M-Sport RPM Bars (Priority: P2)

**Goal**: The driver needs to observe the engine revs and shift points using a rectangular, block-style RPM bar rendered entirely using the BMW M-Sport brand palette.

**Independent Test**: Can be independently tested by triggering an RPM sweep in Storybook or running the basic mock telemetry emitter.

### Implementation for User Story 2

- [x] T006 [P] [US2] Update `src/domain/rev-strip/types.ts` to transition `RevStripState` from per-car configurations to fixed universal M-Sport logic boundaries.
- [x] T007 [US2] Refactor `src/domain/rev-strip/segment-evaluator.ts` to universally evaluate `% shift` (`ShiftIndicatorPct`) from telemetry to calculate segment lighting states (Light Blue, Dark Blue, Red) rather than hardcoded RPM thresholds.
- [x] T008 [US2] Refactor `src/renderer/components/RevStrip.tsx` (if it exists or where revs are rendered) to draw rectangular M-Sport blocks (0px border-radius) according to the new universal `RevStripState` using the CSS variables.
- [x] T009 [US2] Verify Storybook/Mock sweep confirms the correct universal threshold logic (`npm run mock:mazda`).

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 4: User Story 3 - Transparent Carbon Presentation (Priority: P3)

**Goal**: The driver needs the overall overlay to rest on a slightly transparent pure black or matte dark carbon background so that the HUD stands out cleanly against the busy in-game action.

**Independent Test**: Can be independently tested by viewing the main renderer frame against a varied visual test pattern.

### Implementation for User Story 3

- [x] T010 [US3] Update `src/renderer/index.css` to refine the base background to a Matte Dark Carbon (`#121212`) or Pure Black style with mild transparency.
- [x] T011 [US3] Ensure the Overlay's root container in `src/renderer/components/Overlay.tsx` cleanly inherits the carbon backdrop without visual artifacting or border radius.
- [x] T012 [US1] Implement 3-column flex layout in `Overlay.tsx` to solve centering regressions.
- [x] T013 [US1] Anchor `TelemetryGraph` to the Position pill to ensure clean "emergence" effect.
- [x] T014 [US2] Support single-LED car profiles in `car-profiles.ts` for realistic ARCA/Mustang shift lights.
- [x] T015 [US2] Soften telemetry grid lines and add fading time markers in `TelemetryGraph.tsx`.
- [x] T016 [US2] Add Mustang Sweep story to Storybook for visual validation of NASCAR profiles.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T012 Run performance check to ensure rendering overhead remains stable at <=16ms (60Hz target threshold).
- [x] T013 Update documentation/screenshots showing the new BMW M4 GT3 aesthetic applied generically.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately
- **User Story 1 (P1)**: Depends on Phase 1
- **User Story 2 (P2)**: Depends on Phase 1
- **User Story 3 (P3)**: Depends on Phase 1
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1)
- **User Story 2 (P2)**: Can start after Setup (Phase 1), implementation touches the Domain and Renderer layers differently
- **User Story 3 (P3)**: Can run concurrently with US1, touches global styling.

### Parallel Opportunities

- T001 and T002 in Setup can run together.
- T006 (Domain logic) and T010 (CSS carbon styling) can be worked on concurrently.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: User Story 1
3. **STOP and VALIDATE**: Test User Story 1 independently to ensure typography and capsules render perfectly.

### Incremental Delivery

1. Complete Setup
2. Add User Story 1 → Test independently
3. Add User Story 2 → Test Mock Telemetry sweep internally
4. Add User Story 3 → Verify game-mode backdrop
