# Phase 0: Research for bmw-gt3-theme

## Unknowns Resolution

### UI Styling Structure (BMW Digital Palette & 0px Geometry)
- **Decision**: Update `src/renderer/components/Overlay.tsx` (and `index.css`/inline styles) to map the BMW palette (`#009CDE`, `#0033A0`, `#FF0000`, background `#121212`). We will strip all `borderRadius` across components, creating explicit "capsule" structures for Gear/Speed using `border: 1px solid white`.
- **Rationale**: Complies with the `@ui-stylist` criteria using simple Vanilla CSS/inline styling for strict React 19 functional mapping.

### Universal Telemetry Mapping (ShiftIndicatorPct)
- **Decision**: Modify the rev-strip evaluation logic in `src/domain/rev-strip/` to primarily consume `ShiftIndicatorPct` (or universally calculate `rpm / maxRpm`). The UI will render rectangular blocks (segments of Light Blue, Dark Blue, Red) based on this universal percentage threshold instead of dynamically mapping individual LED thresholds from the legacy `lovely-car-data.json`.
- **Rationale**: Fulfills the `@telemetry-expert` requirement to utilize dynamic iRacing telemetry universally. This ensures flawless shift mapping across all vehicles without hardcoded car profiles.

### Performance constraints (<= 16ms overhead)
- **Decision**: Keep the structural translation of `ShiftIndicatorPct` -> `BarState` strictly within `src/domain/rev-strip/`. The `src/renderer/` layer will remain 100% presentational.
- **Rationale**: Centralizing pure math/logic in the Hexagonal Architecture prevents UI render churn and protects the 60Hz polling budget.
