# Implementation Plan: Refine fuel estimation for initial laps

**Branch**: `008-fuel-estimation-init` | **Date**: Monday, March 30, 2026 | **Spec**: [/specs/008-fuel-estimation-init/spec.md](/specs/008-fuel-estimation-init/spec.md)

## Summary
Refine the fuel estimation logic to handle the initialization phase (laps 1-3) gracefully. This involves using an expanding average, implementing a 20% outlier detection threshold, and introducing a new "stabilizing" status (Blue Dot) in the UI until 4 valid laps are recorded.

## Technical Context
- **Language/Version**: TypeScript 5.9+ (ESM)
- **Primary Dependencies**: `irsdk-node` (iRacing telemetry adapter), React (for UI)
- **Storage**: In-memory `fuelUsedHistory` array (max 4) in the provider/adapter.
- **Testing**: `MockTelemetryProvider` with a new scenario to simulate lap completion and stabilization.
- **Target Platform**: Windows (iRacing)
- **Performance Goals**: Updates at 60Hz (16ms interval).
- **Constraints**: Maintain zero-dependency domain logic.

## Constitution Check
- **Performance**: Negligible impact (simple math for average/outliers).
- **Pragmatic Testing**: Verified via mock telemetry and data-integrity tests.
- **Separation of Concerns**: Logic in `domain/fuel/`, state mapping in `adapters/`, and rendering in `renderer/components/Overlay`.

## Project Structure

### Documentation (this feature)
```text
specs/008-fuel-estimation-init/
├── plan.md              # This file
├── research.md          # Findings on current implementation
├── data-model.md        # Type updates and logic rules
├── quickstart.md        # How to test this feature
└── tasks.md             # Implementation tasks
```

### Source Code Updates
```text
src/
├── domain/
│   ├── fuel/
│   │   └── fuel-laps.ts         # Update FuelStatus, add evaluateFuelStatus logic
│   └── telemetry/
│       └── types.ts             # Update TelemetrySnapshot (add fuelLapCount)
├── application/
│   └── use-cases/
│       └── compose-ribbon.ts    # Map fuelLapCount to evaluateFuelStatus
├── adapters/
│   ├── telemetry-iracing/
│   │   └── iracing-telemetry-provider.ts # Implement expanding avg & outlier detection
│   └── telemetry-mock/
│       └── mock-telemetry-provider.ts    # Add 'stabilizing' mock scenario
└── renderer/
    └── components/
        └── Overlay.tsx          # Render Blue Dot for 'stabilizing'
```

## Phase 0: Outline & Research
- [x] Analyze current `IRacingTelemetryProvider` logic (Research complete).
- [x] Identify where `fuelPerLap` is calculated.
- [x] Determine UI mapping for the blue dot.

## Phase 1: Design & Contracts
- [x] Update `TelemetrySnapshot` to track `fuelLapCount`.
- [x] Update `FuelStatus` union in domain.
- [x] Define outlier detection logic (20% threshold).
- [x] Update agent context.

## Next Steps
1. Break down implementation tasks in `tasks.md`.
2. Implement domain logic changes first (testable).
3. Update adapter logic.
4. Update renderer.
5. Verify with mock scenario.
