# Feature Specification: BMW M4 GT3 Styling

**Feature Branch**: `013-bmw-gt3-theme`  
**Created**: 2026-04-09  
**Status**: Draft  
**Input**: User description: "Pivot the overlay visual styling to a BMW M4 GT3 Motorsport aesthetic. REQUIREMENTS: 1. Design System: Use the exact BMW Digital Palette a Pure Black background with mild transparent effect. 2. Geometry: 0px border-radius everywhere. Technical, sharp, and blocky. 3. Layout: Central Gear/Speed focus with 1px white borders defining the Capsules. 4. Specialist Consultation: @ui-stylist for colors and @telemetry-expert for car-profile mapping."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Central Data Capsules (Priority: P1)

The driver needs to easily glance at the Gear and Speed telemetry, which must be clearly legible and centrally focused inside distinct technical capsules defined by 1px white borders, adhering to the BMW GT3 data layout.

**Why this priority**: Gear and Speed are the most vital constant data points; their placement and clarity directly affect driver reaction times.

**Independent Test**: Can be tested by running a mock simulation or entering a practice session and verifying that Gear and Speed appear precisely in the center inside sharp 1px white-border capsules.

**Acceptance Scenarios**:

1. **Given** the overlay is active, **When** telemetry is streaming, **Then** Gear and Speed are centrally positioned inside clean capsules with purely sharp corners (0px border-radius).
2. **Given** the driver accelerates, **When** the gear changes, **Then** the central gear indicator updates legibly with high-contrast, blocky typography (e.g., DIN-style).

---

### User Story 2 - Rectangular M-Sport RPM Bars (Priority: P2)

The driver needs to observe the engine revs and shift points using a rectangular, block-style RPM bar rendered entirely using the BMW M-Sport brand palette.

**Why this priority**: Engine RPM is crucial for shift timing, and using the exact M-Sport palette correctly communicates the BMW motorsport aesthetic.

**Independent Test**: Can be independently tested by triggering an RPM sweep in Storybook or running the basic mock telemetry emitter.

**Acceptance Scenarios**:

1. **Given** the RPM increases, **When** it hits the shift points, **Then** the RPM blocks light up using Light Blue `#009CDE`, Dark Blue `#0033A0`, and Red `#FF0000` segments without any rounded edges.

---

### User Story 3 - Transparent Carbon Presentation (Priority: P3)

The driver needs the overall overlay to rest on a slightly transparent pure black or matte dark carbon background so that the HUD stands out cleanly against the busy in-game action.

**Why this priority**: Proper transparency and background treatment are necessary in a racing context to avoid obscuring driving vision while ensuring legibility.

**Independent Test**: Can be independently tested by viewing the main renderer frame against a varied visual test pattern.

**Acceptance Scenarios**:

1. **Given** the overlay is running over the game window, **When** looking at the general data pane, **Then** the background has a mild transparent effect and follows a Matte Dark Carbon (`#121212`) or Pure Black style.

### Edge Cases

- What happens when a specific car provides extremely erratic or non-standard `ShiftIndicatorPct` telemetry data since this visual style is applied universally to all cars?
- How does the system handle high-value telemetry strings (like 3-digit speeds) in a strict-sized geometric capsule?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST apply the BMW Digital Palette colors (`#009CDE` light blue, `#0033A0` dark blue, `#FF0000` red) to visual components like the RPM bar.
- **FR-002**: System MUST utilize a pure black or matte dark carbon (`#121212`) background with a mild transparency effect for the overall overlay wrapper.
- **FR-003**: System MUST enforce 0px border-radius on all geometric components, shapes, and containers.
- **FR-004**: System MUST position Gear and Speed indicators in a central Layout "Capsule", bounded by 1px solid white borders.
- **FR-005**: System MUST utilize a high-legibility, blocky sans-serif font (e.g., DIN-style) for telemetry values.
- **FR-006**: System MUST utilize a centered 3-column flex layout (flex:1 | fixed center | flex:1) to ensure instrumentation is mathematically centered regardless of surrounding pill width.
- **FR-007**: System MUST support single-LED "Shift Light" dashboards (e.g. ARCA Mustang) by rendering a literal non-progressive centered block when car data defines only a single shift point.
- **FR-008**: System MUST implement a visual extension for telemetry (throttle/brake) that emerges from the left edge of the Position pill.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of UI components and shapes apply 0px border-radius strictly.
- **SC-002**: Visual regression or manual Storybook testing validates that the layout strictly features central 1px white-ordered capsules.
- **SC-003**: Rendering overhead introduces no additional latency; telemetry polling and rendering remain stable at the 16ms (60Hz) target threshold.

## Assumptions

- We assume the existing UI architecture allows overriding or injecting palette colors using standard CSS variables or styled-component tokens.
- We assume "Pure Black" and the Stylist's mentioned "Matte Dark Carbon" can be unified into a transparent pure dark aesthetic that satisfies the requirement without clashing.
- Data bindings for Gear and Speed already exist; only layout/styling is being dramatically pivoted.
