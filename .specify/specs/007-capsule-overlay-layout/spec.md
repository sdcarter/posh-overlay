# Feature Spec: Capsule Overlay Layout

**Status:** Implemented

## Summary

The overlay renders as a compact capsule HUD with a left position pill, center RPM/gear stack, right laps-remaining pill, top rev dot row, and bottom ribbon strip. Designed for at-a-glance readability during racing.

## Acceptance Criteria

- Left pill: race position (e.g. `P7`), `--` when unavailable
- Center stack: RPM value + gear value with labels
- Right pill: laps remaining, `--` when unavailable, checkered flag icon when finished
- Top row: rev dots from `RevStripState` (hidden gracefully when null)
- Bottom strip: telemetry ribbon (incidents, BB, TC, ABS, fuel)
- Capsule has translucent dark fill with subtle border for visibility over any track background
- All elements scale proportionally when the overlay is resized
- Lock/unlock, drag/resize, and position persistence all work unchanged

## Key Files

- `src/renderer/components/Overlay.tsx` — the entire capsule layout, all rendering
- `src/domain/telemetry/lap-count.ts` — `lapsRemainingForDriver`, `isDriverFinished`, `totalRaceLapsForDriver`
- `src/main/index.ts` — sends `{ snapshot, revStrip, ribbon, useMock }` frame to renderer

## Architecture Notes

- `Overlay.tsx` renders everything inline — there are no sub-components for pills, ribbon, etc.
- The ribbon is NOT a separate component. It's built as `lowerItems` from `frame.ribbon.*` fields.
