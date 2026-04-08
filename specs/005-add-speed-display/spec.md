# Feature Specification: Add Speed Display in km/h

**Feature Branch**: `005-add-speed-display`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: User description: "I have a new feature I want to go into the overlay. Specifically, I would like to include the speed in km/h that the car is traveling at. I want it in the same row as the RPMs and the gear. However, I want to change the visual styling a bit. Right now the order of the RPMs and Gear is exactly that. I would like this change to be that the speed is the first value and it will be a bit smaller. RPMs will be the next and that's the big important one so it should stay the same size in a bit of an impact font and then the final will be the gear I'm in with the same font size as the speed. That should help me focus on the most important thing which is managing shifts in the RPM power range."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-time Speed Monitoring (Priority: P1)

As a driver, I want to see my current speed in km/h alongside my RPMs and Gear so that I can monitor my pace while staying focused on my shift points.

**Why this priority**: This is the core functional requirement. Without real-time speed, the feature provides no value.

**Independent Test**: Can be tested by running a mock telemetry scenario where the speed value changes; the overlay should reflect these changes instantly in the correct position.

**Acceptance Scenarios**:

1. **Given** the overlay is active and a car is moving, **When** the telemetry reports a speed of 150 km/h, **Then** the value "150" must be displayed at the start of the telemetry row.
2. **Given** the overlay is active, **When** the speed changes from 0 to 200 km/h, **Then** the displayed value must update smoothly in real-time.

---

### User Story 2 - Visual Emphasis on RPMs (Priority: P2)

As a driver, I want the RPM display to be significantly more prominent than the speed and gear displays so that I can easily identify my shift range without being distracted by secondary data.

**Why this priority**: The user specifically requested this layout to improve focus on shifting. It's a key UX requirement.

**Independent Test**: Can be verified by visual inspection of the overlay to ensure RPMs are larger and use a high-impact style compared to speed and gear.

**Acceptance Scenarios**:

1. **Given** the telemetry row is visible, **When** viewing the elements from left to right, **Then** the order must be Speed -> RPM -> Gear.
2. **Given** the telemetry row is visible, **When** comparing font sizes, **Then** the RPM font must be larger than both the Speed and Gear fonts.
3. **Given** the telemetry row is visible, **When** comparing the Speed and Gear font sizes, **Then** they must be equal in size.

---

### Edge Cases

- **Zero/Negative Speed**: What happens when the car is stationary or in reverse? (Assumption: Speed is shown as an absolute value or 0, always in km/h).
- **High Speed (300+ km/h)**: Does the three-digit speed value cause the telemetry row to overflow or shift other elements unexpectedly?
- **Missing Telemetry**: How does the speed display behave if speed data is temporarily unavailable? (Assumption: Shows "0" or "---").

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the current car speed in km/h.
- **FR-002**: System MUST position the speed display as the first element (leftmost) in the telemetry row.
- **FR-003**: System MUST position the RPM display in the center of the telemetry row.
- **FR-004**: System MUST position the Gear display as the last element (rightmost) in the telemetry row.
- **FR-005**: System MUST use a significantly larger font size for RPMs compared to Speed and Gear.
- **FR-006**: System MUST use the same font size for both Speed and Gear displays.
- **FR-007**: System MUST use a "high-impact" (bold/heavy) font style for the RPM display to maximize visibility.
- **FR-008**: System MUST update the speed display at the same frequency as other telemetry data (e.g., 60Hz or as provided by the SDK).

### Key Entities

- **Telemetry Row**: The visual container for the speed, RPM, and gear data.
- **Speed Reading**: The numerical representation of the car's velocity in km/h.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Speed display latency is indistinguishable from RPM/Gear latency (updates within one frame of telemetry receipt).
- **SC-002**: The RPM font size is at least 1.5x larger than the Speed/Gear font size to ensure clear visual hierarchy.
- **SC-003**: The telemetry row (Speed-RPM-Gear) remains centered and legible across all supported overlay scaling factors.
- **SC-004**: Users can accurately read the speed value from a distance of 1 meter while the car is at maximum velocity in a mock scenario.

## Assumptions

- **Units**: Speed is always displayed in km/h as requested; unit conversion (mph) is out of scope for this initial request.
- **Font**: "Impact font" refers to a heavy, high-contrast sans-serif typeface similar to the Impact font family, intended for maximum readability at a glance.
- **Precision**: Speed will be displayed as an integer (no decimal places) as is standard for sim racing overlays unless precision is critically requested.
- **Layout**: The "row" refers to the existing telemetry ribbon area where Gear and RPM were previously displayed.
