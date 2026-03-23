# Feature Specification: Capsule Overlay Visual Redesign

## Feature Summary
Redesign the renderer overlay to visually emulate the compact "capsule HUD" style shown in `~/Downloads/image-3.png`, while preserving PoshDash behavior and using currently available telemetry data.

The redesign should keep the overlay transparent-window-friendly and race-readable at a glance, with a strong centerline hierarchy:
- Left dominant position node
- Top-center LED/rev progression indicators
- Center stacked primary stats
- Right laps remaining node
- Bottom micro-ribbon for secondary race info

## Problem Statement
The current overlay is functional but reads like a utility panel. It does not match the polished motorsport broadcast style the user wants.

The target look is a low-profile rounded capsule with strong visual hierarchy and minimal clutter.

## Goals
1. Achieve a visual style close to the reference image using current telemetry, plus position where needed.
2. Keep readability under motion and bright/dark track backgrounds.
3. Preserve lock/unlock, drag, resize, and transparency behavior.
4. Keep lower ribbon content focused on data already shown today.

## Non-Goals
1. Changing window management behavior in Electron main process.
2. Replacing hexagonal architecture boundaries.
3. Adding speed, track temperature, SoF, or other new stats not requested.
4. Implementing every optional decorative effect from the reference in v1.

## Reference Visual Traits (from image-3.png)
1. Horizontal black pill container with soft glow and blur separation from background.
2. Large circular value badge on the left edge, partially overlapping the pill.
3. Small row of circular rev indicators across the top center of the pill.
4. Large numeric content with compact labels.
5. Bottom attached mini-ribbon for tertiary context.
6. High-contrast white typography with green accent and subtle gray separators.

## Available Telemetry Inventory
Current data in `TelemetrySnapshot`:
- Available now: gear, rpm, maxRpm, pitLimiterActive, incidentCount, incidentLimit, brakeBiasPercent, tractionControlLevel, absLevel, session laps/time fields, last lap
- Likely usable now for laps remaining: `sessionLapsRemain` (can be null depending session type)
- Not currently available in this app model: race position

## Data Mapping Strategy
### Phase 1 (Pill Style With Existing Data)
1. Left pill: position placeholder (`--`) until position telemetry is wired
2. Top rev dots: derived from existing `RevStripState` led progression and flash mode
3. Center primary stat A: RPM value (`snapshot.rpm`)
4. Center primary stat B: current gear value (`snapshot.gear`) shown as supporting metric
5. Right pill: laps remaining from `snapshot.sessionLapsRemain` with `--` fallback
6. Bottom mini-ribbon: incidents, BB, TC, ABS from existing `RibbonState`

### Phase 2 (Small Telemetry Extension)
Add only position fields to `TelemetrySnapshot` and adapters:
1. `positionOverall`

After this extension:
1. Left pill becomes live `positionOverall`
2. Right pill remains `sessionLapsRemain`
3. Lower ribbon remains current incidents/BB/TC/ABS allocation

## Functional Requirements
### Visual Structure
1. The overlay SHALL render as a single capsule component inside the existing draggable/resizable widget bounds.
2. The capsule SHALL support a compact mode optimized around a width/height ratio near the reference image.
3. The left position pill SHALL visually overlap the capsule body and remain readable at minimum size.
4. The top rev indicator row SHALL support 10-16 dot elements and preserve flash semantics from rev-strip logic.
5. The right laps-remaining pill SHALL mirror the left pill visual weight at a slightly smaller emphasis.
6. The bottom mini-ribbon SHALL render as a separate attached strip with smaller text scale.

### Styling and Readability
1. The component SHALL use a high-contrast typography scale with at least three levels:
- Label
- Value
- Primary badge/value
2. The capsule SHALL include a translucent dark fill and subtle border/glow to remain visible over bright tracks.
3. The design SHALL avoid visual noise and keep all primary values legible at a glance.
4. The color system SHALL define explicit tokens for:
- Base background
- Border
- Primary text
- Secondary text
- Accent green
- Warning (pit limiter)

### Behavior
1. Existing lock/unlock behavior SHALL remain unchanged.
2. Existing drag and resize interactions SHALL remain unchanged.
3. Existing position/size persistence SHALL remain unchanged.
4. If `revStrip` is null, the rev dot row SHALL hide gracefully without breaking layout.
5. If a data value is unavailable, the UI SHALL show a stable fallback token (for example `--`) instead of collapsing unexpectedly.
6. If `sessionLapsRemain` is null, the right pill SHALL show `--` and keep fixed spacing.

### Performance
1. The redesign SHALL maintain current real-time update responsiveness.
2. Animation for flashing/rev effects SHALL avoid expensive layout reflow operations.

## UX Requirements
1. The visual hierarchy SHALL prioritize: position > rpm > laps remaining > tertiary ribbon.
2. The component SHALL remain readable across small and large overlay sizes.
3. The unlocked helper text SHALL be visually unobtrusive and not conflict with core telemetry display.

## Acceptance Criteria
1. Overlay visually resembles the capsule style from the reference image with left position pill, central stack, right laps pill, and bottom micro-ribbon.
2. All existing telemetry fields currently shown in ribbon remain accessible in the redesigned UI.
3. Rev flash behavior (redline and pit-limiter) remains functionally correct.
4. Lock/unlock, drag/resize, and persisted layout still work.
5. No TypeScript or ESLint regressions are introduced.
6. Laps remaining is shown from telemetry when present; otherwise `--` is shown.

## Open Questions
1. Should laps remaining display rounded integer only, or include tenths when provided?
2. During pit-limiter active state, should `PIT` replace one of the pills or appear only in the lower ribbon?
3. Should the component keep free resize, or snap to aspect-ratio presets in compact mode?

## Implementation Notes for Next Step
1. Build a new presentational component (for example `CapsuleOverlay`) and keep existing business logic unchanged.
2. Reuse `RevStripState` computation; do not duplicate rev logic in renderer.
3. Migrate inline style blocks toward tokenized style objects so iterative visual tuning is easier.
4. Keep renderer redesign first; add only position telemetry extension after layout is approved.
