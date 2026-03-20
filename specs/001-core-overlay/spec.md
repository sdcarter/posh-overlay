# Feature Specification: PrecisionDash Core Overlay

**Feature Branch**: `001-core-overlay`  
**Created**: 2026-03-20  
**Status**: Implemented (As Built 2026-03-20)  
**Input**: User description: "PrecisionDash Core Overlay with build-time car data ingestion, dynamic LED rev strip, centralized data ribbon, click-through overlay behavior, and offline-capable development loop"

## Clarifications

### Session 2026-03-20

- Q: Which Win32 overlay window controls are mandatory? -> A: `WS_EX_TOPMOST`, `WS_EX_TRANSPARENT`, and `WS_EX_LAYERED` are mandatory for always-on-top click-through behavior.
- Q: What performance targets should be explicit for runtime updates? -> A: Polling MUST remain stable at 60 Hz and telemetry-to-render latency MUST remain below 2 ms (p95).
- Q: How should car-profile data synchronization be specified? -> A: Build-time synchronization via `SyncLovelyData` is a formal requirement, including manifest and car profile retrieval into local resources prior to source generation.
- Q: How should telemetry state/property patterns be enforced? -> A: Telemetry state holders MUST use C# 14 `field`-backed properties and telemetry transforms MUST use extension members.
- Q: How should rendering acceleration be constrained? -> A: Rendering MUST initialize and run through SkiaSharp `GRContext` on hardware-accelerated backend.
- Q: How should telemetry schema typing be enforced? -> A: Telemetry contracts MUST use compile-time source-generated type-safe structs from the telemetry SDK pipeline.
- Q: How should control-value update timing be measured? -> A: Brake bias and traction control updates MUST appear within < 2 ms p95 from telemetry snapshot receipt.
- Q: How should usability outcome SC-004 be validated? -> A: A documented usability protocol and evidence artifact are required as part of feature verification.

### Session 2026-03-20 (Implementation Alignment)

- Q: Should lap-progress remain visible in the runtime ribbon? -> A: No. Runtime overlay now prioritizes compact safety/control display (incidents, BB, TC).
- Q: How should incident display behave in practice sessions with no limit? -> A: Show incident count with open-ended limit as `count/-`.
- Q: How should BB/TC behave when telemetry frames intermittently omit values? -> A: Keep and display last known valid values.
- Q: What visual state should indicate rev-limiter contact? -> A: Rev strip must blink blue at limiter threshold.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Car-Aware Shift Guidance (Priority: P1)

As a driver in-session, I want a car-specific LED rev strip so I can time shifts and pit-limiter behavior without reading detailed text.

**Why this priority**: Shift timing and limiter awareness affect lap time and race safety immediately, making this the highest-value real-time signal.

**Independent Test**: Can be fully tested by replaying telemetry for multiple car identities and verifying that rev-strip thresholds, color transitions, and flashing states match each car profile and react in real time.

**Acceptance Scenarios**:

1. **Given** a known car identity with a valid shift profile, **When** engine state changes through the rev range, **Then** the rev strip updates segment fill and color transitions according to that profile.
2. **Given** pit limiter or optimal shift-point conditions are active, **When** the panel renders the rev strip, **Then** it enters the flashing state defined for that condition.

---

### User Story 2 - At-a-Glance Race Ribbon (Priority: P2)

As a driver, I want one compact ribbon that shows safety and key car controls so I can make decisions within a few seconds while staying focused on the track.

**Why this priority**: Consolidated race status reduces cognitive load and helps prevent avoidable incidents.

**Independent Test**: Can be tested by feeding telemetry snapshots for incidents, brake bias, and traction control, then verifying displayed values and update responsiveness under transient null values.

**Acceptance Scenarios**:

1. **Given** an active session, **When** incident telemetry changes, **Then** the ribbon shows updated incidents-versus-limit values (or `/-` when limit is unavailable).
2. **Given** driver control-dial adjustments, **When** brake bias or traction-control telemetry changes, **Then** the ribbon reflects updated values on the next render cycle.
3. **Given** intermittent missing control values in telemetry frames, **When** a previous valid value exists, **Then** the ribbon continues to show the last known valid value.

---

### User Story 3 - Deterministic Startup and Offline Validation (Priority: P3)

As a developer and race-day user, I want all car profile data prepared before runtime and a simulator-free test loop so startup is deterministic and UI behavior can be verified without a live simulator process.

**Why this priority**: This reduces runtime failure modes, improves local development speed, and protects race-day reliability.

**Independent Test**: Can be tested by building once with available profile data, running with simulator disconnected, and verifying that UI behavior still renders from embedded data and mock telemetry.

**Acceptance Scenarios**:

1. **Given** profile data is available during build preparation, **When** a release artifact is produced, **Then** required car-profile lookups are available at runtime without network access.
2. **Given** simulator process is unavailable, **When** mock telemetry mode is enabled, **Then** developers can exercise rev strip and ribbon behavior end-to-end.

### Edge Cases

- Car identity is unknown or missing from available profile data.
- Car profile exists but has malformed or incomplete shift/indicator thresholds.
- Incident limit is unavailable from telemetry during session transitions.
- Driver control values are temporarily unavailable or out of expected range.
- Simulator process disconnects/reconnects while overlay is rendering.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST execute a pre-build `SyncLovelyData` step that synchronizes `manifest.json` and referenced car profile JSON files into local resources before compilation.
- **FR-002**: System MUST provide car-profile lookup by current driver car identity.
- **FR-003**: System MUST render a top-position rev strip using a compact segment layout (default 10 segments).
- **FR-004**: System MUST map rev-strip fill and color behavior to the active car profile.
- **FR-005**: System MUST support a flashing rev-strip state for pit-limiter condition.
- **FR-006**: System MUST support a flashing rev-strip state for optimal shift-point condition.
- **FR-007**: System MUST render a centered two-line data ribbon beneath the rev strip.
- **FR-008**: System MUST display incidents as current count versus allowed limit, with `/-` when limit is unavailable.
- **FR-009**: System MUST display brake bias and traction control values and retain last known valid values during transient source-null frames.
- **FR-010**: System MUST display brake bias and traction control values and reflect updates within < 2 ms p95 from telemetry snapshot receipt.
- **FR-011**: System MUST create the overlay window with `WS_EX_TOPMOST`, `WS_EX_TRANSPARENT`, and `WS_EX_LAYERED` so it remains visible above the simulation viewport and does not intercept input.
- **FR-012**: System MUST provide a simulator-free mock telemetry mode for local UI and behavior validation.
- **FR-013**: System MUST not require runtime network calls or runtime dynamic car-profile file loading to render car-specific rev-strip behavior.
- **FR-014**: System MUST keep telemetry-to-render pipeline latency below 2 ms at p95 during active-session operation.
- **FR-015**: Telemetry state holder properties in hot-path components MUST use C# 14 `field`-backed property patterns.
- **FR-016**: Telemetry transformation logic in hot-path components MUST use C# 14 extension members.
- **FR-017**: Rendering pipeline MUST initialize and render through SkiaSharp `GRContext` with hardware-accelerated backend.
- **FR-018**: Telemetry SDK integration MUST emit compile-time source-generated type-safe telemetry structs used by the application pipeline.
- **FR-019**: System MUST emit structured telemetry lifecycle logs for attach, detach, reconnect, and provider health transitions.
- **FR-020**: Project MUST include a documented usability validation protocol and capture evidence for SC-004.
- **FR-021**: System MUST blink the rev strip blue when rev-limiter threshold is reached.

### Constitution Constraints *(mandatory)*

- **CC-001**: Feature MUST preserve the project runtime and packaging constraints defined by the PrecisionDash constitution.
- **CC-002**: Feature MUST preserve hot-path allocation-free behavior during normal telemetry-to-render operation.
- **CC-003**: Feature MUST preserve required performance ceilings for memory, CPU usage, and polling cadence.
- **CC-004**: Feature MUST preserve required unit-test coverage gates for telemetry math and physics-critical components.
- **CC-005**: Feature MUST preserve actionable-data-first presentation and click-through overlay behavior.

### Key Entities *(include if feature involves data)*

- **Car Profile Manifest**: Catalog of available vehicles and references to per-car rev/shift indicator rules.
- **Car Shift Profile**: Per-car thresholds and visual guidance definitions used by the rev strip.
- **Rev Strip State**: Current segment activation, color state, and flashing mode derived from telemetry plus car profile.
- **Race Ribbon Snapshot**: Current display values for incidents, brake bias, and traction control.
- **Overlay Window State**: Visibility, topmost status, click-through behavior, and panel background settings.
- **Mock Telemetry Scenario**: Local development telemetry playback state used when simulator data is unavailable.

## Assumptions

- Build environments used for release have access to the canonical car-profile source.
- Car-profile schema remains stable for the fields required by rev-strip behavior.
- Wheel dial changes for brake bias and traction control are exposed in telemetry when available on the active car.
- Drivers prefer compact, always-visible panel layout over configurable multi-panel layouts for this release.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In validation sessions across at least 10 car profiles, 100% of tested rev-strip threshold transitions match expected profile behavior.
- **SC-002**: In practice and race sessions, displayed incident count matches expected telemetry value in at least 99% of sampled frames.
- **SC-003**: 95% of sampled brake-bias and traction-control changes appear on-screen within one render cycle after telemetry receipt.
- **SC-004**: During usability validation, at least 90% of drivers can correctly report current shift readiness and incident status within 3 seconds of glance.

### Performance and Runtime Outcomes *(mandatory for implementation specs)*

- **PR-001**: Telemetry polling remains stable at 60 Hz during active-session operation.
- **PR-002**: Active-session working set remains <= 20 MB on target hardware class.
- **PR-003**: Active-session total CPU utilization remains < 0.3% on target hardware class.
- **PR-004**: Runtime behavior for car-profile lookup operates without network dependency.
- **PR-005**: End-to-end telemetry-to-render latency remains < 2 ms at p95 during active-session operation.
