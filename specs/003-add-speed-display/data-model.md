# Data Model: Add Speed Display

## Entities

### TelemetrySnapshot (Updated)
The core snapshot that carries all live data from adapters to the renderer.

- **New Field**: `speedKmH: number`
  - **Representation**: The current vehicle velocity in kilometers per hour.
  - **Type**: `number` (float, to be rounded in renderer).
  - **Validation**: Must be >= 0.

## State Transitions
1.  **Adapter Layer**: `IRacingTelemetryProvider` fetches `Speed` (m/s) from iRacing SDK.
2.  **Transformation**: `Speed` is multiplied by 3.6 to convert to km/h.
3.  **Application Layer**: `TelemetrySnapshot` is updated with `speedKmH`.
4.  **Renderer Layer**: `Overlay.tsx` receives the snapshot, rounds the speed to the nearest integer, and renders it in the specified layout.
