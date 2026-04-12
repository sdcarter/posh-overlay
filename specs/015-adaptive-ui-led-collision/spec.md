# Feature Specification: Adaptive UI Layout & LED Collision Avoidance

**Feature Branch**: `015-adaptive-ui-led-collision`  
**Created**: 2026-04-12  
**Status**: Draft  
**Input**: User description: "Adaptive UI Layout & LED Collision Avoidance: Transition Session/Lap info to a rectangular format and reposition the RPM LED array to prevent visual overlap on wide-dash cars. Convert 'Lap' and 'Position' containers from squares to rectangles. Shift the entire LED array upward on the Y-axis so that even the outermost LEDs have a minimum 10px buffer from the top edge of the new rectangular Lap/Position boxes. Mode A: Lap-Based (Ovals) Logic: Display [Player Lap] of [Total Session Laps]. Mode B: Time-Based (Road) Logic: Display SessionTimeRemain. Formatting: MM:SS or HH:MM:SS. Source of Truth: Use raw iRacing SDK values only. Collision Testing: The UI Expert Agent must verify that the new LED Y-position accounts for 'Wide Array' cars (e.g., cars with 15+ LEDs) to ensure the far-left and far-right lights never sit 'underneath' the info boxes. Agent Coordination: UI Expert Agent: Provide the CSS or Layout coordinates for the 'Safe Zone' above the Lap/Position boxes. Telemetry SDK Agent: Confirm that the SessionLaps and SessionTimeRemain variables are being pulled correctly to drive the text within the new rectangles."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Adaptive Info Boxes (Priority: P1)

As a driver, I want the session info (Lap and Position) displayed in rectangular containers instead of squares to optimize screen real estate and align with professional racing dash aesthetics.

**Why this priority**: Fundamental UI layout change requested by the user.

**Independent Test**: Can be tested by visually inspecting the "Lap" and "Position" containers in the overlay to ensure they are rectangular and anchored to the corners.

**Acceptance Scenarios**:

1. **Given** the overlay is active, **When** viewing the top-level UI, **Then** the "Lap" and "Position" containers must be rectangular.
2. **Given** the overlay is active, **When** viewing the layout, **Then** the "Lap" and "Position" boxes must be anchored to the left and right corners respectively.

---

### User Story 2 - LED Collision Avoidance (Priority: P1)

As a driver of a car with a wide RPM LED array (15+ LEDs), I want the LED bar to be positioned high enough so that the outer LEDs never overlap or sit behind the Lap/Position info boxes.

**Why this priority**: Prevents visual bugs and ensures telemetry visibility on all car types.

**Independent Test**: Can be tested using a "Wide Array" car profile (e.g., 20+ LEDs) and verifying a minimum 10px vertical buffer exists between any LED and the info boxes.

**Acceptance Scenarios**:

1. **Given** a car with a wide LED array, **When** the RPM LEDs are active, **Then** there must be at least a 10px vertical gap between the LEDs and the top of the info boxes.
2. **Given** any car profile, **When** the overlay renders, **Then** the LED bar must be horizontally centered relative to the screen.

---

### User Story 3 - Contextual Session Information (Priority: P2)

As a racer, I want the session info to automatically switch between "Lap X of Y" (for lap-limited sessions) and "Time Remaining" (for time-limited sessions) so I always have the most relevant race progress data.

**Why this priority**: Enhances usability across different racing disciplines (Ovals vs Road).

**Independent Test**: Can be tested by switching between a Lap-based session and a Time-based session in the mock telemetry and verifying the display format changes.

**Acceptance Scenarios**:

1. **Given** a lap-based session (e.g., Oval), **When** racing, **Then** the display must show "[Current Lap] / [Total Laps]".
2. **Given** a time-based session (e.g., Road), **When** racing, **Then** the display must show the remaining session time in MM:SS or HH:MM:SS format.

---

### Edge Cases

- **Session Overtime**: What happens when a timed session goes into "white flag" or overtime? (Assumption: Continue showing 00:00 or switch to lap count if provided).
- **Infinite Laps**: How is a practice session with no lap limit displayed in Mode A? (Assumption: Show only "Lap X").
- **Ultra-Wide LEDs**: If the LED array width exceeds the "Safe Zone" between info boxes, the system MUST proportionally reduce LED spacing (Dynamic Scaling) to maintain the 10px buffer and avoid overlap.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render "Lap" and "Position" info boxes as rectangular containers.
- **FR-002**: System MUST anchor info boxes to the screen corners (Lap: Top-Left, Position: Top-Right).
- **FR-003**: System MUST calculate a "Safe Zone" Y-coordinate for the RPM LED array that provides a minimum 10px buffer above the info boxes.
- **FR-004**: System MUST horizontally center the RPM LED array on the screen.
- **FR-005**: System MUST detect session type (Lap-based vs Time-based) using raw iRacing SDK variables.
- **FR-006**: System MUST format time remaining as `MM:SS` for durations under 1 hour and `HH:MM:SS` for durations over 1 hour.
- **FR-007**: System MUST use `SessionLaps` and `SessionTimeRemain` from the iRacing SDK as the primary sources for session progress.
- **FR-008**: Developers MUST update existing Storybook components (e.g., Overlay, RevStrip) to reflect the new rectangular layout and LED positioning logic.

### Key Entities *(include if feature involves data)*

- **SessionInfo**: Represents the current race state, including lap counts, position, and time remaining.
- **RevStripLayout**: Represents the positioning and geometry of the RPM LED array, including its vertical offset and centering.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of tested car profiles (including wide-array cars like BMW GT3) show zero overlap between LEDs and info boxes.
- **SC-002**: A minimum 10px vertical gap is maintained between the bottom-most point of the LED array "Safe Zone" and the top edge of the info boxes.
- **SC-003**: Session info format switches automatically within 100ms of session type detection.
- **SC-004**: Time formatting correctly handles transitions from HH:MM:SS to MM:SS as time elapses.

## Assumptions

- **Oval vs Road Detection**: It is assumed that sessions with a positive `SessionLaps` value are "Lap-Based" and sessions where `SessionLaps` is zero or infinite are "Time-Based".
- **Screen Resolution**: Layout coordinates are relative to the overlay window size; the 10px buffer is relative to standard pixel density.
- **SDK Availability**: All required variables (`SessionLaps`, `SessionTimeRemain`, `Lap`, `PlayerCarClassPosition`) are consistently available in the iRacing SDK.
- **Fixed UI Scale**: It is assumed that the info box height is constant across different car profiles to simplify the "Safe Zone" calculation.
