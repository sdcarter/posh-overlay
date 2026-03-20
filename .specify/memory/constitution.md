<!--
Sync Impact Report
- Version change: N/A (template) -> 1.0.0
- Modified principles:
  - PRINCIPLE_1_NAME -> I. Stack and Runtime Non-Negotiable
  - PRINCIPLE_2_NAME -> II. Architecture and Performance Budgets
  - PRINCIPLE_3_NAME -> III. Engineering Excellence and Resiliency
  - PRINCIPLE_4_NAME -> IV. UI/UX Signal-First Overlay
  - PRINCIPLE_5_NAME -> V. Deterministic Delivery and Compliance
- Added sections:
  - Technical Standards and Constraints
  - Development Workflow and Quality Gates
- Removed sections: None
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
  - ⚠ pending .specify/templates/commands/*.md (directory not present in repository)
  - ✅ .github/prompts/*.md (reviewed; no outdated agent-name references found)
  - ✅ .github/agents/*.md (reviewed; no outdated agent-name references found)
- Follow-up TODOs: None
-->

# Project PrecisionDash Constitution

## Core Principles

### I. Stack and Runtime Non-Negotiable

All deliverables MUST target .NET 10.0.x LTS and C# 14, and MUST use C# 14 `field`
backing properties and extension members where telemetry processing extensions are
introduced. The executable MUST be built as Native AOT, self-contained, trimmed,
single-file, and under 15 MB. Telemetry integration MUST use `SVappsLAB.iRacingTelemetrySDK`
v1.1+ with source-generated, compile-time type-safe telemetry structs. Rendering
MUST use `SkiaSharp` 3.119+ through `GRContext` on hardware-accelerated Vulkan/DirectX;
WPF and WinForms are prohibited.
Rationale: fixed runtime and rendering contracts prevent framework drift and preserve
the latency and footprint targets required for competitive overlays.

### II. Architecture and Performance Budgets

The hot path (Telemetry Read -> Math Transform -> Render) MUST be zero-allocation
under normal operation and MUST use allocation-aware primitives (`ref struct`,
`Span<T>`, `stackalloc`) where applicable. Inter-thread communication MUST use
`System.Threading.Channels` for lock-free producer/consumer flow between telemetry
and rendering loops. Runtime budgets are mandatory: active polling at 60 Hz MUST
remain within a 20 MB working set and below 0.3% total CPU utilization on a
2026-equivalent processor.
Rationale: explicit resource ceilings and concurrency constraints enforce the
sub-1 ms responsiveness mission and prevent performance regressions from becoming
architectural debt.

### III. Engineering Excellence and Resiliency

`TelemetryMath` and `PhysicsEngine` MUST maintain 100% unit test coverage, and
coverage regressions in either component MUST block merge. The codebase MUST ship
with a `MockTelemetryProvider` that simulates iRacing memory-mapped telemetry for
macOS/Parallels-first development workflows. SDK connectivity MUST implement `Polly`
reconnection policies and MUST auto-attach/detach as iRacing starts or stops.
Rationale: deterministic testability and self-healing runtime behavior keep the
overlay shippable when simulator availability, platform parity, or process lifecycle
changes are outside developer control.

### IV. UI/UX Signal-First Overlay

Displayed metrics MUST be actionable within 3 seconds of driver decision-making;
non-actionable metrics MUST be hidden by default. Rendering MUST be high-DPI aware
with anti-aliased Skia primitives for sub-pixel clarity. The overlay window MUST
apply `WS_EX_TRANSPARENT` and `WS_EX_LAYERED` styles so the interface remains
click-through and never intercepts simulator inputs.
Rationale: visual clarity and interaction non-interference are core safety and
usability requirements during high-speed driving.

### V. Deterministic Delivery and Compliance

Every feature proposal, plan, and task breakdown MUST declare how it preserves
Native AOT compatibility, hot-path zero-allocation behavior, telemetry resiliency,
and UI click-through guarantees before implementation begins. Pull requests MUST
include objective evidence for package size, CPU, memory, and coverage gates, and
MUST be rejected when evidence is absent or fails thresholds.
Rationale: governance is only enforceable when each change carries measurable proof
instead of intent statements.

## Technical Standards and Constraints

- Runtime baseline: .NET 10.0.x LTS (March 2026 servicing baseline or newer patch)
  and C# 14.
- Build output: single-file, trimmed, self-contained Native AOT executable under 15 MB.
- Telemetry pipeline: `SVappsLAB.iRacingTelemetrySDK` v1.1+ with source generators.
- Graphics pipeline: `SkiaSharp` 3.119+ using `GRContext` and hardware acceleration.
- Polling cadence: 60 Hz telemetry polling under active session load.
- Resource budgets: <= 20 MB working set and < 0.3% total CPU utilization on
  2026-equivalent hardware.

## Development Workflow and Quality Gates

1. Define feature scope and acceptance criteria with explicit references to each
   Core Principle impacted.
2. Implement with hot-path allocation audits and channel-based concurrency design
   captured in plan artifacts.
3. Execute required quality gates before merge:

   - Unit test coverage for `TelemetryMath` and `PhysicsEngine` remains at 100%.
   - Native AOT, single-file, trimmed build succeeds and artifact size is < 15 MB.
   - Performance evidence confirms 60 Hz operation within memory and CPU budgets.
   - Click-through overlay behavior is validated with required window styles.

4. Reject and rework any change that violates a MUST-level statement in this
   constitution.

## Governance

This constitution is the highest-priority engineering authority for PrecisionDash.
When standards conflict, this document supersedes feature specs, plans, and task
lists.

Amendment procedure:

1. Submit a documented amendment proposal describing impacted principles,
   migration actions, and verification updates.
2. Obtain maintainer approval before implementation begins.
3. Update all affected templates and guidance artifacts in the same change.

Versioning policy:

- MAJOR: incompatible redefinition or removal of a principle or mandatory gate.
- MINOR: new principle/section or materially expanded mandatory guidance.
- PATCH: wording clarifications, typo fixes, and non-semantic refinements.

Compliance review expectations:

- Every PR MUST include a constitution compliance checklist with objective evidence
  for MUST-level constraints.
- Reviewers MUST block merges for missing evidence or threshold failures.
- Periodic governance review MUST occur at least once per quarter to verify that
  tooling, templates, and enforcement logic remain aligned.

**Version**: 1.0.0 | **Ratified**: 2026-03-20 | **Last Amended**: 2026-03-20
