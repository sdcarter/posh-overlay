# Quickstart: Speed Display Implementation

## Goal
Implement a live speed display (km/h) in the telemetry row of the PoshDash overlay.

## Tasks
1.  **Domain Update**: Add `speedKmH` to the `TelemetrySnapshot` interface in `src/domain/telemetry/types.ts`.
2.  **iRacing SDK Adapter**: In `IRacingTelemetryProvider`, map the `Speed` variable from the SDK to `speedKmH`. Convert m/s to km/h using a 3.6 multiplier.
3.  **Mock Telemetry Adapter**: Update `MockTelemetryProvider` to provide a realistic `speedKmH` value in all scenarios (e.g., base it on RPM and Gear).
4.  **Renderer UI**: 
    - Update `src/renderer/components/Overlay.tsx` to include the speed value.
    - Rearrange the layout in the telemetry row to `[Speed] | [RPM] | [Gear]`.
    - Apply font sizes: RPM (Largest/Impact font), Speed/Gear (Smaller/Equal size).
    - Ensure all new sizes use the `scale` factor from the overlay state.
5.  **Validation**: Use `npm run mock` to verify the speed updates correctly and matches the requested layout and visual style.
