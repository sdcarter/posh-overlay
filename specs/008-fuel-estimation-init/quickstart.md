# Quickstart: Testing Fuel Estimation Refinement

## Development Setup
1. Switch to the feature branch: `git checkout 008-fuel-estimation-init`
2. Run `npm install` (if not already done).

## Testing the Refinement

### 1. Mock Scenario
The `MockTelemetryProvider` will be updated with a `stabilizing-fuel` scenario that simulates completing laps 1 through 5.
To run the mock scenario:
```bash
npm run mock:stabilizing-fuel
```

### 2. Validation Steps
1. **Start the Mock**: Run the command above.
2. **Lap 1 (Initialization)**: Observe that the fuel estimate is hidden or shows "Calculating".
3. **Lap 2-4 (Stabilizing)**: After Lap 1 completes, observe the fuel estimate appears with a **Blue Dot**.
4. **Lap 5+ (Steady State)**: After Lap 4 completes, the dot changes to **Green/Yellow/Red** depending on the remaining fuel.
5. **Outlier Check**: Manually edit the mock or use a scenario that injects a high-consumption lap (e.g., 2.0L vs average 5.0L) and verify the estimate does not jump significantly.

## Key Files to Review
- `src/domain/fuel/fuel-laps.ts`: Logic for status evaluation and outlier detection.
- `src/adapters/telemetry-iracing/iracing-telemetry-provider.ts`: History management and outlier filtering.
- `src/renderer/components/Overlay.tsx`: UI rendering for the blue dot.
