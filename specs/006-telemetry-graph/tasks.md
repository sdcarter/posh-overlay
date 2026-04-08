# Tasks: Visual Telemetry Graph

**Input**: Design documents from `/specs/006-telemetry-graph/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

## Phase 1: Setup & Foundational
**Purpose**: Update domain types and mock data adapter (combines Setup and Foundational for speed).

- [x] T001 Update telemetry types with `throttle`, `brake`, and `absActive` in `src/domain/telemetry/` (or wherever TelemetrySnapshot is defined).
- [x] T002 Implement oscillating mock data generation for `throttle`, `brake`, and `absActive` in `src/adapters/telemetry-mock/`.

## Phase 2: User Story 1 - View Real-Time Telemetry (Priority: P1) 🎯 MVP
**Goal**: Implement the telemetry graph UI and integrate it into the main overlay.

### Implementation for User Story 1
- [x] T003 [P] [US1] Create `TelemetryGraph` component in `src/renderer/` (using DOM/SVG) to render the flowing throttle (green) and brake (red/yellow for ABS) traces.
- [x] T004 [US1] Update `src/renderer/Overlay.tsx` to render `TelemetryGraph` as an extension on the left side of the main capsule, ensuring `lowerItems` centering is maintained.

## Dependencies & Execution Order
- **Setup**: T001 and T002 provide the foundational data.
- **User Story 1**: T003 builds the UI component, and T004 wires it up to the active overlay.

## Implementation Strategy
- **One-Shot Execution**: As requested, these 4 tasks are optimized to be implemented in a single rapid pass without meticulous start/stop phases.
