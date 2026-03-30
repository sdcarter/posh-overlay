# Data Model: Fuel Estimation Refinement

## Domain Entities

### FuelStatus
Updated union type to include the stabilizing state.
- `green`: Enough fuel to finish (+ buffer).
- `yellow`: Borderline fuel (deficit < 1 lap).
- `red`: Insufficient fuel.
- `stabilizing`: Preliminary estimate (laps 1-3) - **NEW**.

## Application Entities

### TelemetrySnapshot
Expanded to track the history depth for the UI to determine confidence levels.
- `fuelLevel: number | null` (current liters/gallons)
- `fuelPerLap: number | null` (trailing average consumption)
- `fuelLapCount: number | null` (number of laps in history, 0-4) - **NEW**

## Logic Rules

### Outlier Detection
A completed lap is considered an outlier if its consumption deviates by more than 20% from the existing average:
- `abs(consumed - average) / average > 0.2`
- Only applicable when `fuelLapCount >= 1`.
- Outliers are discarded from history to prevent skewing the "Graceful Estimation".

### Stabilizing Condition
- If `fuelLapCount > 0` and `fuelLapCount < 4`, status is forced to `stabilizing`.
- Once `fuelLapCount >= 4`, standard green/yellow/red logic applies.
