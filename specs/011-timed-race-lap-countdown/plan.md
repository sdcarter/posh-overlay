# Implementation Plan: Fix lap countdown for timed (road) races

**Branch**: `011-timed-race-lap-countdown` | **Date**: Tuesday, April 8, 2026 | **Spec**: [/specs/011-timed-race-lap-countdown/spec.md](/specs/011-timed-race-lap-countdown/spec.md)

## Summary
Fix the lap countdown for timed road races by replacing the volatile single-lap-time estimation with a rolling 3-lap average, adding a guard for the timer-expired/pre-checkered gap, and providing a mock scenario for visual testing.

## Technical Context
- **Language/Version**: TypeScript 5.9+ (ESM)
- **Primary Dependencies**: `irsdk-node` (iRacing telemetry adapter), React (for UI)
- **Storage**: In-memory rolling arrays in the adapter (same pattern as fuel history).
- **Testing**: `MockTelemetryProvider` with a new `timed` scenario.
- **Target Platform**: Windows (iRacing), macOS/Linux (mock only)
- **Performance Goals**: Updates at 125Hz (8ms polling interval).
- **Constraints**: Maintain zero-dependency domain logic.

## Constitution Check
- **Performance**: Negligible — one additional array average per poll cycle.
- **Separation of Concerns**: Rolling average state in adapter, estimation logic in domain, display in renderer.
- **Pragmatic Testing**: Verified via mock telemetry scenario.

## Project Structure

### Documentation (this feature)
```text
specs/011-timed-race-lap-countdown/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Findings on current implementation and reference tools
├── data-model.md        # Type updates and logic rules
├── quickstart.md        # How to test this feature
├── tasks.md             # Implementation tasks
└── checklists/          # Verification checklists
```

### Source Code Updates
```text
src/
├── domain/
│   └── telemetry/
│       ├── types.ts             # Add sessionAvgLapTimeSeconds to TelemetrySnapshot
│       └── lap-count.ts         # Use rolling avg, add timer-expired guard
├── adapters/
│   ├── telemetry-iracing/
│   │   └── iracing-telemetry-provider.ts  # Add lapTimeHistory, compute rolling avg
│   └── telemetry-mock/
│       └── mock-telemetry-provider.ts     # Add 'timed' mock scenario
├── domain/
│   └── ribbon/
│       └── formatters.ts        # Update lapProgress to prefer rolling avg
└── package.json                 # Add mock:timed script
```
