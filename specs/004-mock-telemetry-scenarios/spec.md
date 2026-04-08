# Feature Spec: Mock Telemetry Scenarios

**Status:** Implemented

## Summary

Mock telemetry provider for development on macOS/Linux where iRacing SDK isn't available. Provides deterministic scenarios that exercise different overlay states.

## Acceptance Criteria

- Mock provider implements `TelemetryProvider` interface (`start`, `stop`, `tryReadSnapshot`)
- Activated via `POSHDASH_USE_MOCK=true` and `POSHDASH_MOCK_SCENARIO=<name>` env vars
- Each scenario produces a `TelemetrySnapshot` with realistic values

## Scenarios

| npm target | Scenario name | What it tests | Added in |
|---|---|---|---|
| `npm run mock` | `default` | Static baseline snapshot | 004 |
| `npm run mock:mazda` | `mazda-sweep` | Mazda MX-5 RPM sweep through all gears | 004 |
| `npm run mock:bmw` | `bmw-sweep` | BMW M4 GT3 RPM sweep with TC/ABS | 004 |
| `npm run mock:sfl` | `sfl-sweep` | Super Formula Lights sweep (no TC/ABS) | 004 |
| `npm run mock:finish` | `finish-countdown` | Finish line crossing + checkered flag (fixed-lap race) | 004 |
| `npm run mock:fuel` | `fuel` | Fuel indicator cycling green → yellow → red every 3s | 004 |
| `npm run mock:stabilizing-fuel` | `stabilizing-fuel` | Fuel estimation initialization phase (laps 0-4, blue dot → steady state) | 010 |
| `npm run mock:timed` | `timed` | Timed road race lifecycle: countdown → timer expired → leader finishes | 011 |

## Key Files

- `src/adapters/telemetry-mock/mock-telemetry-provider.ts` — all scenario logic
- `scripts/run-mock-scenario.mjs` — sets env vars and launches Electron
- `package.json` — npm script targets

## Architecture Notes

- Sweep scenarios use time-based RPM ramp with configurable gear count, max RPM, and car path
- `baseSnapshot` provides defaults; scenarios override specific fields
- Mock provider returns snapshots synchronously via `tryReadSnapshot()` — no async streaming
