# Feature Specification: Refine fuel estimation for initial laps

**Feature Branch**: `008-fuel-estimation-init`  
**Created**: Monday, March 30, 2026  
**Status**: Draft  
**Input**: User description: "this is an update to the 003 fuel specification. I DON'T WANT TO Create another spec if I don't have to. Shouldn't we be able to just update what we have? I'm not sure if this works, exactly! I like almost everything that it's doing but I have an issue during the initial first 3 or 4 laps. basically, because it uses the trailing 4 lap average to estimate fuel, it takes 4 laps to show real fuel data. What I'd like to do is to use handle the situation gracefully until we get to the four laps in local memory so we can do a correct estimation."

## Clarifications

### Session 2026-03-30
- Q: What is the preferred visual indicator for low confidence? → A: Blue Status Dot (#3b82f6)
- Q: What defines an "outlier" lap for the initial average calculation? → A: 20% deviation from session average

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initial Session Start (Priority: P1)

As a driver starting a new race session, I want to see an immediate, albeit preliminary, fuel estimate after my first completed lap so that I don't have to wait 4 laps to understand my fuel situation.

**Why this priority**: High. The first few laps of a race are critical for strategy, and having no data for 4 laps is a significant blind spot.

**Independent Test**: Start a mock session, complete 1 lap, and verify that a fuel estimate appears (even if marked as preliminary) instead of being hidden or showing "Unknown".

**Acceptance Scenarios**:

1. **Given** a new session with 0 laps completed, **When** the first lap is completed, **Then** the fuel indicator shows an estimate based on that single lap.
2. **Given** a preliminary estimate (laps 1-3), **When** viewing the indicator, **Then** the UI provides a visual hint that the data is still stabilizing (Blue Status Dot).

---

### User Story 2 - Incremental Accuracy (Priority: P2)

As a driver in the early stages of a race (laps 2-3), I want the fuel estimate to become more accurate with each completed lap so that my confidence in the data grows before the 4-lap "high confidence" threshold is met.

**Why this priority**: Medium. Improves the transition from "no data" to "steady state".

**Independent Test**: Complete lap 2 and verify the estimate updates using the 2-lap average.

**Acceptance Scenarios**:

1. **Given** 2 laps completed, **When** calculating fuel, **Then** the system uses a 2-lap average.
2. **Given** 3 laps completed, **When** calculating fuel, **Then** the system uses a 3-lap average.

---

### User Story 3 - Steady State Transition (Priority: P3)

As a driver who has completed 4 or more laps, I want the system to use the standard 4-lap trailing average for maximum stability.

**Why this priority**: Low (already implemented, but must be preserved).

**Independent Test**: Complete 5 laps and verify the 4-lap trailing average is used.

**Acceptance Scenarios**:

1. **Given** 5 laps completed, **When** calculating fuel, **Then** the system uses only the most recent 4 laps.

---

### Edge Cases

- **What happens when the first lap is invalid (e.g., tow/reset)?** The system should discard the invalid lap data and remain in the "Calculating" state until a valid lap is completed.
- **How does the system handle a fuel refill (pit stop) during the first 4 laps?** The average calculation should reset or account for the new fuel level to avoid skewed estimations.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a fuel remaining estimate as soon as the first valid lap is completed.
- **FR-002**: System MUST use an expanding average (1-lap, 2-lap, 3-lap) during the initialization phase (laps 1-3).
- **FR-003**: System MUST transition to a fixed 4-lap trailing average once 4 or more valid laps are recorded.
- **FR-004**: System MUST visually indicate a "low confidence" or "initializing" state for the fuel indicator until the 4-lap threshold is met using a **Blue Status Dot** (#3b82f6).
- **FR-005**: System MUST ignore "outlier" laps (e.g., in-laps, out-laps, or laps with significantly higher/lower fuel usage due to incidents) when building the initial average. An outlier is defined as a lap with >20% deviation from the session average consumption.

### Key Entities *(include if feature involves data)*

- **FuelLapHistory**: A collection of fuel consumption values for the most recent valid laps (max 4).
- **InitializationState**: A status flag indicating if the system is in "Initial" (0 laps), "Stabilizing" (1-3 laps), or "Steady" (4+ laps) mode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Fuel estimation is displayed within 2 seconds of completing the first valid lap.
- **SC-002**: Visual "low confidence" indicator (Blue Dot) is active for 100% of the time during the first 3 valid laps.
- **SC-003**: The difference between the 1-lap estimate and the eventual 4-lap steady-state estimate is less than 10% in standard racing conditions.

## Assumptions

- **Assumption about data**: A "valid lap" is defined as a lap completed without a reset/tow and with "normal" fuel consumption patterns.
- **Assumption about scope**: The "graceful" handling does not require a pre-defined car database; it relies solely on live telemetry collected during the current session.
- **Dependency**: Relies on the existing `FuelLevel` and `FuelPerLap` telemetry fields from the iRacing SDK or Mock provider.
