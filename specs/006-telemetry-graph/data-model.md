# Data Model: Visual Telemetry Graph

## Domain Entities

### TelemetrySnapshot Additions
The core telemetry state parsed from the sim (or mock) needs to expose the following fields:
- `throttle`: `number` (0 to 1) or (0 to 100) representing pedal pressure.
- `brake`: `number` (0 to 1) or (0 to 100) representing pedal pressure.
- `absActive`: `boolean` representing whether the anti-lock braking system is currently intervening.

### UI State (React)
The Graph component will maintain an array of recent data points to draw the right-to-left flowing timeline:
- `GraphHistory`: `Array<{ throttle: number, brake: number, abs: boolean, timestamp: number }>`
- Maximum buffer size determined by refresh rate and desired time window (e.g., 60fps * 3 seconds = 180 points).
