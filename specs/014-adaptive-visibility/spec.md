# Feature Specification: Adaptive Dashboard Visibility (On-Track Only)

**Feature Branch**: `014-adaptive-visibility`  
**Created**: 2026-04-12  
**Status**: Draft  
**Input**: User description: "Implement a conditional rendering logic for the dashboard UI that ensures it is only visible when the user is actively "in the car" on the racing surface."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Active Racing Visibility (Priority: P1)

As a driver, I want the dashboard to be automatically visible when I am on the racing surface so that I can see my live telemetry data without manual intervention.

**Why this priority**: Core value of the application; the overlay should be "always on" but only when needed.

**Independent Test**: Can be tested by launching iRacing and entering the cockpit. The dashboard should appear as soon as the car is placed on the track.

**Acceptance Scenarios**:

1. **Given** iRacing is connected and the player is on the racing surface, **When** the session is active, **Then** the dashboard UI container is visible.
2. **Given** the dashboard is hidden, **When** the `IsOnTrack` telemetry flag becomes TRUE, **Then** the dashboard appears within one telemetry update cycle (~16ms).

---

### User Story 2 - Immediate Hiding in Garage (Priority: P1)

As a driver, I want the dashboard to disappear immediately when I exit the car to the garage or pit menu so that it does not clutter the simulator's UI.

**Why this priority**: Aesthetic and usability requirement. The overlay should not interfere with menu navigation.

**Independent Test**: Can be tested by hitting "Escape" while on track. The dashboard should vanish instantly.

**Acceptance Scenarios**:

1. **Given** the dashboard is visible, **When** I hit "Escape" and `IsOnTrack` becomes FALSE, **Then** the dashboard is hidden immediately.
2. **Given** I am in the garage menu, **When** `IsConnected` is TRUE but `IsOnTrack` is FALSE, **Then** the dashboard MUST remain hidden.

---

### User Story 3 - Replay Mode Exclusion (Priority: P2)

As a driver, I want the dashboard to remain hidden while watching a replay, even if the car in the replay is on the racing surface.

**Why this priority**: Avoids confusion between live data and recorded data. Replays often have their own UI and telemetry needs.

**Independent Test**: Can be tested by opening a replay file or viewing a replay after a session.

**Acceptance Scenarios**:

1. **Given** iRacing is in Replay mode, **When** the car in the replay is on track, **Then** the dashboard remains hidden.
2. **Given** I am viewing a replay of my own driving, **When** `IsReplay` is TRUE, **Then** visibility is disabled regardless of `IsOnTrack` status.

---

### User Story 4 - Connection Sensitivity (Priority: P2)

As a user, I want the dashboard to be invisible when the iRacing simulator is not running.

**Why this priority**: Prevents a blank or "waiting" overlay from appearing over the desktop or other applications.

**Independent Test**: Close iRacing while the overlay is running.

**Acceptance Scenarios**:

1. **Given** the dashboard is visible, **When** iRacing is closed (`IsConnected` becomes FALSE), **Then** the dashboard is hidden.

---

### Edge Cases

- **Session Transitions**: What happens when switching from Practice to Qualify? The dashboard should briefly hide and reappear as `IsOnTrack` toggles.
- **Disconnected SDK**: How does the system handle an API timeout? The dashboard should hide immediately if the heartbeat is lost.
- **Spectating**: If the user is spectating another driver, `IsOnTrack` might be true for the spectated car but false for the player. The visibility should be tied to the *Player's* active driving state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST monitor connection status from the simulator data source.
- **FR-002**: System MUST monitor track status to determine if the player is on the racing surface.
- **FR-003**: System MUST monitor playback status to distinguish live driving from recording playback.
- **FR-004**: The on-screen dashboard MUST have its visibility toggled based on the logic: `Visible = Connected && OnTrack && !Replay`.
- **FR-005**: Visibility state updates MUST be processed by the background logic and propagated to the UI layer.
- **FR-006**: The transition to hidden state MUST be immediate (no delay/lag) to match simulator feedback.
- **FR-007**: While hidden, the application MUST maintain a "listening" state with minimal resource usage, awaiting a valid connection and track state.

### Key Entities *(include if feature involves data)*

- **TelemetryState**: The internal representation of the simulator status (Connected, OnTrack, Replay).
- **VisibilityManager**: The logic that computes the visibility state based on TelemetryState.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dashboard visibility transitions occur in less than 50ms from receiving the status flags.
- **SC-002**: 100% accuracy in hiding the dashboard during Replay mode.
- **SC-003**: 100% accuracy in hiding the dashboard when the player is not on track (e.g. Garage/Menus).
- **SC-004**: Zero UI elements from the dashboard are visible on the desktop when the simulator is closed.

## Assumptions

- Track status flags correctly reflect the "Out of Garage" state for the player car.
- The simulator provides a reliable way to detect active "Replay" mode.
- The minimalist design goal implies no "Disconnected" messaging on screen; the app should just be invisible until ready.
- The player is the primary subject of the track status flags.
