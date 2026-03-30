# Research: Fuel Estimation Refinement

## Findings

### Current Implementation
- `IRacingTelemetryProvider` (Adapter) calculates `computedFuelPerLap` by maintaining a `fuelUsedHistory: number[]` array (max size 4).
- It calculates the average by summing the history and dividing by the current length: `this.fuelUsedHistory.reduce((a, b) => a + b, 0) / this.fuelUsedHistory.length`.
- The first data point is pushed after the FIRST lap is completed (`currentLap > this.latest.currentLap`).
- This means `computedFuelPerLap` becomes non-null at the start of Lap 2.
- The user's observation that it takes 4 laps to get "real" data likely refers to the fact that the 4-lap trailing average is only fully populated after 4 laps (i.e., at the start of Lap 5).

### Gap Analysis
1. **Visual Indicator**: There is no distinction between a 1-lap "preliminary" estimate and a 4-lap "high confidence" estimate. Both use the standard Green/Yellow/Red status based on the same `evaluateFuelStatus` logic.
2. **Outlier Detection**: The current logic has a basic check (`consumed > 0.1 && consumed < 150`), but no deviation-based filtering (e.g., >20% from average).
3. **Architecture**: Outlier logic and "stabilizing" status logic are missing from the domain layer.

## Decisions

### 1. Domain Status Update
Add a new status `stabilizing` to `FuelStatus` in `src/domain/fuel/fuel-laps.ts`. This status will trigger the Blue Dot in the UI.

### 2. Outlier Detection
Implement a `isLapConsumptionOutlier(consumed, average, threshold = 0.2)` function in the domain.
- During the first lap, no outlier check is possible.
- From lap 2 onwards, we can check against the current average.

### 3. Telemetry Snapshot Expansion
Add `fuelLapCount` to `TelemetrySnapshot`. This allows the application layer (use-cases) to determine if the estimate is "stabilizing" without needing the raw history.

### 4. Logic Placement
- **Domain**: Calculation of status, outlier check.
- **Adapter**: Maintaining the history array, applying the outlier check before pushing to history.
- **Application**: Wiring the lap count from the snapshot to the domain evaluator.

## Alternatives Considered
- **Italic Text**: Rejected per user preference for the Blue Dot.
- **Prefix "Init:"**: Rejected to maintain minimalist aesthetic.
- **Moving history to Domain**: Considered, but since history is stateful and specific to the telemetry source session, keeping the *storage* in the adapter but the *logic* (calculators) in the domain is cleaner and follows the current pattern.
