# Feature Specification: Visual Telemetry Graph

**Feature Branch**: `004-telemetry-graph`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: User description: "Time for a new feature! This new feature is going to be one of the last features that we need to get to near term feature complete. So here we go ... I want to implement a visual telemtry graph similar to what I have pasted in. The red is the brake pressure, the green is the throttle. The yellow is where the ABS kicks in so you can see if you are overworking the tires. I want this kind of telemetry graph available in the overlay but I think the positioning is somewhat up for grabs. I'll start with what I think I want: Right now we have a capsule ... on the left is the current position, middle is key RPM/speed/gear data and right is the number of laps remaining. Below that is a data ribbon with some detail like incidents, BB, TC, etc. That is centered under the capsule. I want to keep that centering but I'd like the telemetry graph be kind of like a capsule extension out of one of the ends of the main capsule .. I think on the left hand side for now. The graph timeline will go from right to left like we read so that seems to make the most sense to see it as a glance. Think you can give this a go?"

## Clarifications

### Session 2026-03-28
- Q: How should ABS activation be visualized in relation to the brake trace? → A: When the ABS is active, it simply recolors the brake trace line to yellow, rather than rendering as a new line. It reverts to red when ABS turns off.
- Q: What should the relative size of the graph extension completely be? → A: It should be shorter than the main capsule height and modestly wide so it doesn't visually dwarf the main central elements.


## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Real-Time Telemetry (Priority: P1)

As a driver, I want to see a real-time visual graph of my throttle, brake, and ABS inputs integrated into the main overlay capsule so that I can quickly assess my pedal technique and tire usage.

**Why this priority**: Core feature value. This allows the driver to visually understand their inputs and ABS activation instantly while racing.

**Independent Test**: Can be fully tested by driving with the overlay active and observing if the graph accurately reflects pedal inputs and ABS activation in real-time.

**Acceptance Scenarios**:

1. **Given** the overlay is active, **When** I apply the throttle, **Then** a green visual indicator shows the throttle pressure.
2. **Given** the overlay is active, **When** I apply the brakes, **Then** a red visual indicator shows the brake pressure.
3. **Given** the overlay is active and braking heavily, **When** ABS kicks in, **Then** the red brake pressure trace recolors to yellow to indicate ABS activation, returning to red when deactivated.
4. **Given** the telemetry graph is displayed, **When** time passes, **Then** the timeline visually flows from right to left as new data enters from the right side.
5. **Given** the overlay is active, **When** examining the main UI capsule, **Then** the telemetry graph appears as a capsule extension on the left side without disrupting the centering of the data ribbon below it.

---

### Edge Cases

- What happens when telemetry data is temporarily delayed or lost?
- How does the system visualize simultaneous overlapping inputs (e.g., trail braking with slight throttle)?
- What happens if the user's screen resolution does not have enough horizontal space on the left to fit the capsule extension without clipping?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a continuous telemetry graph as a visual extension attached to the left side of the main central capsule. Its height and width MUST be proportionally smaller than the main capsule to avoid dwarfing the primary data.
- **FR-002**: System MUST render throttle input pressure as a distinct green visual trace.
- **FR-003**: System MUST render brake input pressure as a distinct red visual trace.
- **FR-004**: System MUST render ABS activation state by recoloring the active brake pressure trace to yellow while active, rather than drawing a separate line.
- **FR-005**: System MUST animate the graph timeline continuously from right to left, where the newest data appears on the right edge.
- **FR-006**: System MUST maintain the centered position of the lower data ribbon relative to the original main capsule, treating the graph as an extension rather than shifting the center point.

### Key Entities 

- **Telemetry Data Stream**: Continuous stream containing current throttle position (0-100%), brake pressure (0-100%), and ABS active state (boolean).
- **Graph Extension UI**: The visual component appended to the main capsule rendering the streaming data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The telemetry graph renders smoothly, matching the refresh rate of the main overlay without causing performance degradation.
- **SC-002**: Users can visually distinguish between throttle, brake, and ABS states within 1 second of glancing at the graph.
- **SC-003**: The addition of the graph extension does not alter the alignment or readability of existing overlay elements (position, RPM/speed/gear data, laps remaining, and centered data ribbon).

## Assumptions

- The underlying sim racing API provides accurate and timely data for throttle, brake pedal position, and ABS activation.
- The default history duration for the visible graph is relatively short (e.g., 2-5 seconds) to maintain relevancy and avoid clutter.
- The user is running at a screen resolution wide enough to accommodate the extended capsule without overlapping the screen boundaries.
