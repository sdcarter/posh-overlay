# Feature Spec: Per-Car LED Rev Lights

**Status:** Implemented

## Summary

Circular LED rev lights sourced from Lovely Sim Racing car data, with per-car colors, counts, and growth patterns. LEDs light sequentially as RPM rises, with accurate per-gear shift thresholds.

## Acceptance Criteria

- LED count, colors, and growth pattern match the Lovely Sim Racing car data for each car
- LEDs light when `rpm >= threshold` for each LED's absolute RPM value
- Spacer LEDs (`#00000000`) render as transparent and are excluded from flash effects
- Cars without a Lovely profile show no rev lights (ribbon-only mode)
- Redline flash: all non-spacer LEDs blink between the car's redline color and white at the car's blink interval
- Redline flash is suppressed in top gear
- Pit limiter flash: all LEDs flash yellow when pit limiter is active
- Car path lookup normalizes iRacing `CarPath` against Lovely `carId`

## Key Files

- `src/domain/telemetry/car-profiles.ts` — loads Lovely car data, resolves car path to LED profile
- `src/domain/telemetry/lovely-car-data.json` — build artifact fetched from Lovely Sim Racing repo
- `src/domain/rev-strip/types.ts` — `RevStripState`, `FlashMode`
- `src/domain/rev-strip/segment-evaluator.ts` — evaluates which LEDs are on given RPM + profile
- `src/domain/rev-strip/flash-mode.ts` — resolves flash mode (none/redline/pit-limiter)
- `src/application/use-cases/compose-rev-strip.ts` — orchestrates profile lookup + evaluation
- `src/renderer/components/Overlay.tsx` — renders rev dots in the capsule top row
- `scripts/fetch-car-data.mjs` — fetches Lovely data at build time
