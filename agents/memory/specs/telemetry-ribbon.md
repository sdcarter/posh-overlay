# Feature Spec: Telemetry Ribbon

**Status:** Implemented

## Summary

A horizontal data strip at the bottom of the capsule overlay showing live telemetry values: incidents, brake bias, traction control, and ABS. Values that are null (car doesn't support them) are hidden automatically.

## Acceptance Criteria

- Incidents shown as count (e.g. `2x / 17x` or `2x` when limit is null)
- Brake bias shown as percentage (e.g. `BB 54.2`)
- Traction control shown as level (e.g. `TC 2`), hidden when null
- ABS shown as level (e.g. `ABS 3`), hidden when null
- Pit limiter shows `PIT` in the ribbon when active
- Items separated by `|` dividers
- Fuel laps indicator with colored dot shown at the left of the ribbon (see fuel-laps-indicator spec)

## Key Files

- `src/domain/ribbon/types.ts` — `RibbonState` interface
- `src/domain/ribbon/formatters.ts` — pure formatting functions for each telemetry value
- `src/application/use-cases/compose-ribbon.ts` — builds `RibbonState` from `TelemetrySnapshot`
- `src/renderer/components/Overlay.tsx` — renders ribbon inline as `lowerItems`
