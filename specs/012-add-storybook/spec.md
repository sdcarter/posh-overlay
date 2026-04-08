# Feature Specification: Add Storybook

**Feature Branch**: `012-add-storybook`  
**Created**: 2026-04-08  
**Status**: Draft  
**Input**: User description: "Add Storybook as a visual development environment for the Overlay component. This is a developer tooling addition — I want to view and iterate on the overlay in a browser without launching Electron. Use Storybook for React with our existing Vite bundler. For the initial stories, include RPM sweep scenarios for 2-3 cars (Mazda MX-5, BMW M4 GT3, Super Formula Lights) that reuse the existing mock snapshot logic from MockTelemetryProvider. The setup should make it trivial to add new stories later for other scenarios (fuel, timed race, finish countdown, etc.) without any additional infrastructure work."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Overlay Components in Isolation (Priority: P1)

As a developer, I want to use Storybook to visually render the Overlay component in isolation so that I can iterate on the UI without launching the Electron shell.

**Why this priority**: Fast UI iteration is the primary value of Storybook. Removing the Electron hurdle significantly speeds up development cycles for existing and new UI elements.

**Independent Test**: Can be independently tested by starting the Storybook dev server and viewing the Overlay in the browser.

**Acceptance Scenarios**:

1. **Given** the repository with Vite and React, **When** I run the Storybook startup command, **Then** a local server should start and open a browser window displaying the Storybook UI.
2. **Given** the Storybook UI is open, **When** I log in or navigate to the Overlay component, **Then** I should see the visual representation of the Overlay matching the current implementation logic.

---

### User Story 2 - Car RPM Sweep Scenarios (Priority: P2)

As a developer, I want to toggle between different predefined telemetry scenarios natively within Storybook so that I can ensure the Overlay functions properly across cars with differing RPM requirements.

**Why this priority**: Testing dynamic layouts (like RPM sweeps for different car types) is a common UI challenge for overlays that needs robust visual confirmation.

**Independent Test**: Can be tested by navigating to specific scenarios within the Overlay Story.

**Acceptance Scenarios**:

1. **Given** I am viewing the Overlay story, **When** I select the "Mazda MX-5 RPM Sweep" scenario, **Then** the Overlay visually reflects an RPM sweep modeled via the mock telemetry logic for the Mazda.
2. **Given** I am viewing the Overlay story, **When** I select the "BMW M4 GT3 RPM Sweep" scenario, **Then** the Overlay visually reflects an RPM sweep for the BMW.
3. **Given** I am viewing the Overlay story, **When** I select the "Super Formula Lights RPM Sweep", **Then** the Overlay reflects the RPM sweep for the Super Formula Lights model.

---

### Edge Cases

- What happens when a scenario fails to load the mock snapshot correctly? 
- How does the system handle Storybook builds (e.g. for CI/CD) and does it interfere with the main Vite build for the Electron app?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST integrate Storybook for React, using the existing Vite bundler configuration.
- **FR-002**: System MUST render the main `Overlay` component independently from Electron.
- **FR-003**: System MUST expose a set of initial predefined car scenarios (Mazda MX-5, BMW M4 GT3, Super Formula Lights).
- **FR-004**: System MUST leverage the existing `MockTelemetryProvider` logic to drive data to the UI components for these scenarios.
- **FR-005**: System MUST allow developers to easily define additional mock scenarios (fuel, timings) via a straightforward pattern that requires zero infrastructure changes to Storybook.

### Key Entities *(include if feature involves data)*

- **Storybook Configuration**: The integration layer connecting Vite to the Storybook engine.
- **Overlay Story**: The React wrapper file that displays the `Overlay` component with various states.
- **Mock Snapshots/Scenarios**: Configuration states used by `MockTelemetryProvider` to mimic live telemetry input.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can launch the visual environment via a single command (e.g. `npm run storybook`) in under 30 seconds.
- **SC-002**: The Mazda MX-5, BMW M4, and Super Formula Lights scenarios exist as independent stories in the Storybook UI.
- **SC-003**: Adding a new, basic scenario (like a specific fuel state) requires creating/editing no more than two files.
- **SC-004**: Running the main app build process (`npm run build`) continues to work with no disruption caused by Storybook dependencies.

## Assumptions

- No complex Electron-specific native APIs (`fs`, `ipcMain`) strictly block the presentation layer of the `Overlay` component; if they do, they are cleanly mocked or shimmed out by existing application ports.
- The `MockTelemetryProvider` is already robust enough to provide the needed states for the designated vehicles.
