# Quickstart: Testing Timed Race Lap Countdown

## Development Setup
1. Switch to the feature branch: `git checkout 011-timed-race-lap-countdown`
2. Run `npm install` (if not already done).

## Testing the Fix

### 1. Mock Scenario
Run the timed race mock scenario:
```bash
npm run mock:timed
```

### 2. Validation Steps
1. **Start the Mock**: Run the command above.
2. **Mid-Race**: Observe the overlay shows `Laps X/Y (Z left)` with a stable estimate that doesn't jump around.
3. **Timer Expiry**: When `sessionTimeRemainSeconds` reaches 0, observe that laps remaining does NOT drop to 0 — it should show 1 (finish current lap).
4. **Leader Finishes**: When the leader crosses the line (`leaderFinished: true`), laps remaining stays at 1 (existing checkered flag logic).
5. **Player Finishes**: After the player crosses the line post-checkered, the overlay shows "DONE" with the checkered flag icon.

### 3. Comparison with Fixed-Lap Race
Run any existing mock (e.g., `npm run mock:finish`) and verify the fixed-lap countdown still works correctly — no regression.

## Key Files to Review
- `src/domain/telemetry/lap-count.ts`: Rolling average usage and timer-expired guard.
- `src/adapters/telemetry-iracing/iracing-telemetry-provider.ts`: Rolling lap time history.
- `src/adapters/telemetry-mock/mock-telemetry-provider.ts`: Timed race mock scenario.
