# Tasks: PrecisionDash Core Overlay

**Input**: Design documents from `/specs/001-core-overlay/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Constitution-mandated verification tasks are included and are not optional.

**Organization**: Tasks are grouped by user story to support independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`US1`, `US2`, `US3`)
- Every task includes an explicit file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize solution and baseline delivery configuration.

- [X] T001 Create solution and project structure in PrecisionDash.sln
- [X] T002 Configure .NET 10 and C# 14 defaults in Directory.Build.props
- [X] T003 [P] Configure shared package versions in Directory.Packages.props
- [X] T004 [P] Configure Native AOT single-file publish settings in src/PrecisionDash.App/PrecisionDash.App.csproj
- [X] T005 [P] Add CI build and verification workflow in .github/workflows/ci.yml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core architecture and cross-story requirements that must be complete first.

**⚠️ CRITICAL**: No user story work begins before this phase is done.

- [X] T006 Define telemetry provider port contract in src/PrecisionDash.Application/Ports/TelemetryProvider.cs
- [X] T007 [P] Define car profile lookup port in src/PrecisionDash.Application/Ports/CarProfileProvider.cs
- [X] T008 [P] Implement channel bridge for telemetry-to-render handoff in src/PrecisionDash.Application/Pipeline/TelemetryChannelBridge.cs
- [X] T009 Implement SyncLovelyData pre-build target for manifest and referenced profile sync in src/PrecisionDash.Build/SyncLovelyData.targets
- [X] T010 Implement Lovely source generator for CarLookup in src/PrecisionDash.Build/SourceGenerators/LovelyCarLookupGenerator.cs
- [X] T011 Implement telemetry SDK source-generated struct bindings in src/PrecisionDash.Adapters.Telemetry.iRacing/GeneratedTelemetryBindings.cs
- [X] T012 Implement telemetry hot-path field-backed state properties in src/PrecisionDash.Domain/TelemetryMath/TelemetryState.cs
- [X] T013 [P] Implement telemetry extension-member transforms in src/PrecisionDash.Domain/TelemetryMath/TelemetryTransformExtensions.cs
- [X] T014 Implement GRContext-based render host initialization in src/PrecisionDash.Adapters.Rendering.Skia/SkiaRenderHost.cs
- [X] T015 Implement Win32 overlay window styles WS_EX_TOPMOST/WS_EX_TRANSPARENT/WS_EX_LAYERED in src/PrecisionDash.Adapters.Windowing.Win32/OverlayWindow.cs
- [X] T016 Implement iRacing adapter attach/detach/reconnect policy in src/PrecisionDash.Adapters.Telemetry.iRacing/iRacingSdkTelemetryProvider.cs
- [X] T017 [P] Implement mock telemetry adapter and service in src/PrecisionDash.Adapters.Telemetry.Mock/MockTelemetryProvider.cs
- [X] T018 Add mandatory TelemetryMath and PhysicsEngine 100% coverage gates in tests/PrecisionDash.Domain.Unit/CoverageGateTests.cs

**Checkpoint**: Foundation complete. Story phases may proceed.

---

## Phase 3: User Story 1 - Car-Aware Shift Guidance (Priority: P1) 🎯 MVP

**Goal**: Render car-specific rev strip behavior with profile-driven thresholds and flash modes.

**Independent Test**: Replay telemetry for multiple `driverCarId` values and verify segment activation, colors, and flash modes against generated profiles.

### Implementation for User Story 1

- [X] T019 [US1] Implement rev strip state model in src/PrecisionDash.Domain/RevStrip/RevStripState.cs
- [X] T020 [P] [US1] Implement segment threshold evaluator in src/PrecisionDash.Domain/RevStrip/RevSegmentEvaluator.cs
- [X] T021 [P] [US1] Implement pit-limiter and shift-point flash resolver in src/PrecisionDash.Domain/RevStrip/FlashModeResolver.cs
- [X] T022 [US1] Implement rev strip composition use case in src/PrecisionDash.Application/UseCases/ComposeRevStripUseCase.cs
- [X] T023 [US1] Implement Skia rev strip renderer using render host in src/PrecisionDash.Adapters.Rendering.Skia/RevStripRenderer.cs
- [X] T024 [US1] Integrate rev strip frame updates in src/PrecisionDash.Application/Pipeline/FrameComposer.cs
- [X] T025 [US1] Add rev strip integration tests for per-car behavior in tests/PrecisionDash.Adapters.Integration/RevStripBehaviorTests.cs
- [X] T026 [US1] Add GRContext initialization and hardware-acceleration validation tests in tests/PrecisionDash.Adapters.Integration/RenderHostAccelerationTests.cs

**Checkpoint**: User Story 1 is independently functional and demo-ready.

---

## Phase 4: User Story 2 - At-a-Glance Race Ribbon (Priority: P2)

**Goal**: Render two-line race ribbon with progress, safety, and control state updates.

**Independent Test**: Feed lap-limited and timed session snapshots and verify ribbon output and update timing constraints.

### Implementation for User Story 2

- [X] T027 [US2] Implement ribbon state model in src/PrecisionDash.Domain/Ribbon/RibbonState.cs
- [X] T028 [P] [US2] Implement lap progress calculator in src/PrecisionDash.Domain/Ribbon/LapProgressCalculator.cs
- [X] T029 [P] [US2] Implement incidents formatter in src/PrecisionDash.Domain/Ribbon/IncidentFormatter.cs
- [X] T030 [P] [US2] Implement brake bias and traction control mapper in src/PrecisionDash.Domain/Ribbon/ControlDialMapper.cs
- [X] T031 [US2] Implement ribbon composition use case in src/PrecisionDash.Application/UseCases/ComposeRibbonUseCase.cs
- [X] T032 [US2] Implement Skia ribbon renderer in src/PrecisionDash.Adapters.Rendering.Skia/RibbonRenderer.cs
- [X] T033 [US2] Add integration tests for FR-010 update timing (< 2 ms p95) in tests/PrecisionDash.Adapters.Integration/RibbonLatencyTests.cs

**Checkpoint**: User Story 2 is independently functional and validated.

---

## Phase 5: User Story 3 - Deterministic Startup and Offline Validation (Priority: P3)

**Goal**: Ensure deterministic build/startup path with simulator-free development loop.

**Independent Test**: Build with sync and generation enabled, run in mock mode without simulator process, and verify no runtime network/dynamic car-data dependency.

### Implementation for User Story 3

- [X] T034 [US3] Enforce SyncLovelyData invocation as required pre-build step in src/PrecisionDash.App/PrecisionDash.App.csproj
- [X] T035 [US3] Wire generated CarLookup into composition root in src/PrecisionDash.App/Composition/CarProfileComposition.cs
- [X] T036 [P] [US3] Implement mock scenario JSON loader in src/PrecisionDash.Adapters.Telemetry.Mock/MockScenarioLoader.cs
- [X] T037 [US3] Implement provider selection factory for live/mock adapters in src/PrecisionDash.App/Composition/TelemetryProviderFactory.cs
- [X] T038 [US3] Add deterministic startup integration tests in tests/PrecisionDash.Adapters.Integration/DeterministicStartupTests.cs
- [X] T039 [US3] Add no-runtime-network/no-dynamic-cardata contract tests in tests/PrecisionDash.Contracts/CarDataRuntimeConstraintsTests.cs
- [X] T040 [US3] Add compile-time telemetry struct generation verification tests in tests/PrecisionDash.Contracts/GeneratedTelemetryStructContractTests.cs

**Checkpoint**: User Story 3 is independently functional and validated.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final evidence capture, observability, and readiness checks.

- [X] T041 [P] Add structured telemetry lifecycle logging for attach/detach/reconnect/provider-health in src/PrecisionDash.App/Composition/LoggingConfig.cs
- [X] T042 [P] Add telemetry lifecycle logging verification tests in tests/PrecisionDash.Adapters.Integration/TelemetryLifecycleLoggingTests.cs
- [X] T043 Capture benchmark evidence for 60 Hz polling, < 2 ms p95 latency, memory, and CPU in specs/001-core-overlay/quickstart.md
- [X] T044 Capture Native AOT single-file artifact size evidence and justification in specs/001-core-overlay/quickstart.md
- [X] T045 Verify Win32 window style evidence (WS_EX_TOPMOST/WS_EX_TRANSPARENT/WS_EX_LAYERED) in specs/001-core-overlay/quickstart.md
- [X] T046 Define SC-004 usability validation protocol in specs/001-core-overlay/quickstart.md
- [X] T047 Capture SC-004 usability validation evidence in specs/001-core-overlay/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all story work.
- **User Story Phases (Phase 3-5)**: Depend on Foundational completion.
- **Polish (Phase 6)**: Depends on completion of all in-scope stories.

### User Story Dependencies

- **US1 (P1)**: Starts immediately after Foundational and serves as MVP.
- **US2 (P2)**: Starts after Foundational and can proceed independently from US1 implementation details.
- **US3 (P3)**: Starts after Foundational and can run in parallel with US2.

### Within Each User Story

- Domain/state modeling before use-case orchestration.
- Use-case orchestration before adapter integration.
- Story-specific integration/contract tests after implementation.

## Parallel Execution Opportunities

- Setup: T003, T004, T005.
- Foundational: T007, T008, T013, T017 after T006.
- US1: T020 and T021 after T019.
- US2: T028, T029, and T030 after T027.
- US3: T036 can run in parallel with T035 after T034.
- Polish: T041 and T042 can run in parallel.

## Parallel Example: User Story 1

```bash
Task: T020 [US1] Implement segment threshold evaluator in src/PrecisionDash.Domain/RevStrip/RevSegmentEvaluator.cs
Task: T021 [US1] Implement pit-limiter and shift-point flash resolver in src/PrecisionDash.Domain/RevStrip/FlashModeResolver.cs
```

## Parallel Example: User Story 2

```bash
Task: T028 [US2] Implement lap progress calculator in src/PrecisionDash.Domain/Ribbon/LapProgressCalculator.cs
Task: T029 [US2] Implement incidents formatter in src/PrecisionDash.Domain/Ribbon/IncidentFormatter.cs
Task: T030 [US2] Implement brake bias and traction control mapper in src/PrecisionDash.Domain/Ribbon/ControlDialMapper.cs
```

## Parallel Example: User Story 3

```bash
Task: T035 [US3] Wire generated CarLookup into composition root in src/PrecisionDash.App/Composition/CarProfileComposition.cs
Task: T036 [US3] Implement mock scenario JSON loader in src/PrecisionDash.Adapters.Telemetry.Mock/MockScenarioLoader.cs
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate rev strip behavior and rendering acceleration checks.
4. Demo/deploy MVP increment.

### Incremental Delivery

1. Deliver US1 as first value slice.
2. Add US2 with latency-bound update verification.
3. Add US3 with deterministic startup and runtime-constraint validation.
4. Complete Phase 6 evidence and readiness checks.

### Parallel Team Strategy

1. Team completes Setup and Foundational together.
2. Developer A drives US1, Developer B drives US2, Developer C drives US3.
3. Team closes Phase 6 evidence and readiness as final gate.

## Notes

- Tasks are generated from clarified requirements and constitution constraints.
- Story phases remain independently testable.
- Suggested MVP scope: **Phase 1 + Phase 2 + Phase 3 (US1)**.
