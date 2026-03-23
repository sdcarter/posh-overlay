# Implementation Plan: Capsule Overlay Redesign

## Planning Constraints
- Keep work packages broad and practical (target 5-7 total tasks).
- Preserve current architecture boundaries and Electron window behavior.
- Implement visual redesign first, then minimal telemetry extension for position.

## Branch
- Working branch: `feat/capsule-overlay-redesign`

## Task 1: Define Capsule Component Contract
Objective:
- Finalize renderer contract for a new capsule-style component while keeping existing frame flow intact.

Scope:
- Decide prop shape for position pill, laps pill, rev dots, center stats, and lower ribbon.
- Confirm fallback conventions for unavailable values (`--`).

Exit Criteria:
- Component API is documented in code and can be fed by existing `Overlay` frame data plus placeholder position.

## Task 2: Implement Pill Layout + Styling System
Objective:
- Build the new pill visual structure with intentional typography, spacing, and color tokens.

Scope:
- Create left pill (position), center stack (RPM + gear), right pill (laps remaining), top rev-dot lane, and attached lower ribbon shell.
- Use tokenized style constants for easy tuning.
- Ensure readability against mixed track backgrounds with border/glow/blur treatment.

Exit Criteria:
- Overlay renders as a single capsule design resembling the target style at common overlay sizes.

## Task 3: Migrate Existing Ribbon Data Into Lower Strip
Objective:
- Keep all current secondary data visible in the new lower ribbon.

Scope:
- Render incidents, brake bias, traction control, and ABS in stable slots.
- Preserve existing hide/null behavior for unsupported telemetry values.

Exit Criteria:
- No regression in displayed secondary telemetry relative to current UI.

## Task 4: Integrate Rev Progression + Flash Semantics
Objective:
- Preserve rev-strip behavior while adapting to dot-row presentation.

Scope:
- Map existing `RevStripState` into compact top dots.
- Keep redline and pit-limiter flash behavior functionally equivalent.
- Handle `revStrip === null` gracefully.

Exit Criteria:
- Dot row reflects rev progression and flashing rules with no logic duplication from domain.

## Task 5: Add Position Telemetry (Minimal Domain Extension)
Objective:
- Add only the telemetry needed for left position pill.

Scope:
- Extend `TelemetrySnapshot` with `positionOverall`.
- Populate in iRacing adapter using available position-related telemetry variables.
- Update mock telemetry adapter with a deterministic `positionOverall` value for development parity.
- Keep renderer presentational only: no telemetry derivation logic in UI components.
- Leave non-requested fields (speed/temp/SoF/etc.) out of scope.

Exit Criteria:
- Left pill shows live race position when available, otherwise `--`.
- Strict typing remains clean across domain, adapters, and renderer.

## Task 6: Validate, Tune, and Document
Objective:
- Lock quality and finish handoff artifacts.

Scope:
- Run lint/build validation.
- Visual tune pass for compact and larger sizes.
- Update spec notes with final decisions (pit indicator placement, null-state behavior).
- Verify no Electron window-behavior regressions (lock/unlock, drag/resize, persisted layout).

Exit Criteria:
- TypeScript and ESLint pass, visuals are readable, and behavior parity is preserved.

## Execution Order
1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5
6. Task 6

## Risk Notes
- Position source fields can vary by session context; implement defensive fallback.
- Very small overlay sizes may reduce legibility; enforce sane minimum text scaling.
- Flash effects must avoid style churn that causes unnecessary reflow.
