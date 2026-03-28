# Research: Add Speed Display in km/h

## Decision: Speed Data Source
- **Finding**: `TelemetrySnapshot` currently lacks a speed field.
- **Action**: Add `speedKmH: number` to `TelemetrySnapshot` interface in `src/domain/telemetry/types.ts`.
- **Implementation**: 
    - In `IRacingTelemetryProvider`, fetch the `Speed` variable from iRacing SDK. The SDK provides speed in m/s, so conversion is needed: `speed * 3.6`.
    - In `MockTelemetryProvider`, add a simulated speed value that correlates with RPM and Gear.

## Decision: Visual Layout & Styling
- **Finding**: The current layout in `Overlay.tsx` uses a vertical stack for RPM and GEAR, separated by a vertical line.
- **Action**: 
    - Change the layout to a horizontal arrangement: `[Speed] | [RPM] | [Gear]`.
    - RPM will be the largest (primary focus).
    - Speed and Gear will be smaller and equal in size.
- **Impact Font**: 
    - Use `fontFamily: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif"` for the RPM value.
    - Speed and Gear values will use the existing `Rajdhani` or similar font but at a smaller scale.

## Decision: Scaling & Responsiveness
- **Finding**: The overlay uses a `scale` factor based on height (`size.h / 126`).
- **Action**: Ensure all new font sizes and gaps use this `scale` factor to maintain proportional appearance during resizing.

## Alternatives Considered
- **Unit Conversion**: Considered making speed units configurable (mph vs km/h), but decided to stick to the specific request for "km/h" to keep the passion project focused and simple.
- **Separate Component**: Considered creating a `TelemetryRow` component, but the Constitution specifies that `Overlay.tsx` renders the ribbon/telemetry items inline to maintain simplicity.
