# Feature Specification: Fix lap countdown for timed (road) races

**Feature Branch**: `011-timed-race-lap-countdown`  
**Created**: Tuesday, April 8, 2026  
**Status**: Draft  
**Input**: User description: "The lap countdown feature works fine for oval (fixed-lap) races but is broken for road (timed) races. The estimated laps remaining fluctuates because it uses the player's single last lap time instead of a stable average, doesn't account for the leader's position when the timer expires, and shows incorrect values in the gap between timer expiry and the leader actually crossing the finish line."

## Clarifications

### Session 2026-04-08
- Q: Should the overlay distinguish timed vs fixed-lap visually? → A: No, same display format ("Laps X/Y (Z left)") for both.
- Q: What lap time source should be used for estimation? → A: Player's own rolling average (last 3 laps). Leader lap time is not available via the SDK telemetry vars used by this project.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Stable Timed Race Estimate (Priority: P1)

As a driver in a timed road race, I want the laps remaining estimate to be stable and not jump around every lap so that I can trust the number for fuel strategy.

**Why this priority**: High. The current implementation uses a single lap time which causes the estimate to swing by 1-2 laps depending on traffic, making it unreliable.

**Independent Test**: Run `npm run mock:timed` and verify the laps remaining count is stable and doesn't oscillate.

**Acceptance Scenarios**:

1. **Given** a timed race with 300s remaining and a 3-lap rolling average of 90s, **When** viewing the overlay, **Then** laps remaining shows a stable value derived from the rolling average.
2. **Given** a single slow lap (e.g., 110s due to traffic) followed by normal laps (~90s), **When** viewing the overlay, **Then** the estimate does not jump by more than 1 lap.

---

### User Story 2 - Timer Expired / Pre-Checkered Gap (Priority: P2)

As a driver in a timed race where the session timer has reached zero but the leader hasn't crossed the finish line yet, I want the overlay to show a reasonable laps remaining value instead of dropping to 0 prematurely.

**Why this priority**: Medium. There is a real gap (sometimes 30-60+ seconds) between the timer hitting 0 and the leader crossing the line. During this window the current code produces incorrect results.

**Independent Test**: Run `npm run mock:timed` and observe the transition when the timer expires — laps remaining should not drop to 0 until the leader actually finishes.

**Acceptance Scenarios**:

1. **Given** `sessionTimeRemainSeconds` is 0 but `leaderFinished` is false and `sessionState < 5`, **When** viewing the overlay, **Then** laps remaining shows at least 1 (the current lap to complete).
2. **Given** `sessionTimeRemainSeconds` is 0 and `leaderFinished` becomes true, **When** viewing the overlay, **Then** laps remaining shows 1 (finish current lap), consistent with the existing checkered flag logic.

---

### User Story 3 - Mock Scenario for Timed Races (Priority: P3)

As a developer, I want a mock scenario that simulates a timed road race so that I can visually verify the lap countdown behavior without connecting to iRacing.

**Why this priority**: Low (developer tooling), but necessary for testing US1 and US2.

**Independent Test**: Run `npm run mock:timed` and verify the overlay cycles through a timed race scenario showing countdown, timer expiry, and finish.

**Acceptance Scenarios**:

1. **Given** the `timed` mock scenario is running, **When** observing the overlay, **Then** it displays a timed race with `sessionLapsTotal: null`, a decrementing `sessionTimeRemainSeconds`, and a rolling lap time average.

---

### Edge Cases

- What happens when the player has no completed laps yet (lap 1)? The system should show `Laps -/-` or fall back gracefully.
- What happens when `sessionLastLapTimeSeconds` is 0 or null? The system should return null for the estimate rather than dividing by zero.
- What happens in a race that is both time-limited AND lap-limited? `sessionLapsTotal` will be a real number, so the fixed-lap path handles it correctly — no change needed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use a rolling average lap time (last 3 valid laps) instead of a single last lap time when estimating remaining laps in timed races.
- **FR-002**: System MUST maintain a rolling lap time history in `IRacingTelemetryProvider`, resetting on session change.
- **FR-003**: System MUST handle the "timer expired but leader hasn't finished" gap by showing at least 1 lap remaining when `sessionTimeRemainSeconds <= 0` and the race is still active (`sessionState < 5`, `leaderFinished` is false).
- **FR-004**: System MUST provide a `mock:timed` scenario that simulates a timed road race lifecycle.
- **FR-005**: System MUST pass `sessionAvgLapTimeSeconds` (rolling average) through `TelemetrySnapshot` for use by the domain layer.

### Key Entities

- **TelemetrySnapshot.sessionAvgLapTimeSeconds**: Rolling average of the player's last 3 lap times (replaces reliance on `sessionLastLapTimeSeconds` for estimation).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a timed race, the laps remaining estimate does not change by more than 1 lap between consecutive laps under normal racing conditions.
- **SC-002**: When the session timer reaches 0, laps remaining does not drop to 0 until the leader has actually finished.
- **SC-003**: The `mock:timed` scenario visually demonstrates a complete timed race lifecycle.

## Assumptions

- **Assumption about SDK data**: `sessionTimeRemainSeconds` continues to report 0 (not negative) after the timer expires, until the session ends.
- **Assumption about scope**: Leader lap time estimation is out of scope — we use the player's own rolling average as a proxy, which is sufficient for a personal overlay.
- **Dependency**: Relies on existing `sessionState` and `leaderFinished` fields already captured by the iRacing adapter.
