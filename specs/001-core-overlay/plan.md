# Implementation Plan: PrecisionDash Core Overlay

**Branch**: `001-core-overlay` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-core-overlay/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Deliver a single-panel, car-aware iRacing overlay that is deterministic at runtime
and optimized for Native AOT delivery. The architecture uses a Hexagonal model with
an application core behind ports, including a `TelemetryProvider` port that can be
adapted by iRacing SDK (Windows) and a mock adapter (macOS/Parallels testing).
Lovely car data is synchronized at build time by a custom `SyncLovelyData` MSBuild
target that retrieves `manifest.json` and referenced car profiles into local
resources, then compiles them into source-generated lookup structures. Runtime flow is
allocation-aware and channel-driven: a 60 Hz telemetry producer publishes snapshots
to `System.Threading.Channels`, and a SkiaSharp hardware-accelerated renderer
consumes snapshots for a transparent, click-through, top-most overlay.

## As-Built Implementation Notes (2026-03-20)

- Windows runtime startup currently uses a WinForms-painted overlay surface (`OverlayForm`) for visible runtime behavior while retaining architecture-level rendering adapters in the codebase.
- Windows application output type is `WinExe` for release usability (no terminal window).
- Runtime ribbon layout is compact and currently displays incidents, brake bias, and traction control.
- Rev strip includes blue flashing behavior at rev-limiter threshold.
- Live telemetry provider maps incidents with fallback precedence and preserves last known BB/TC values on transient null frames.

This revision incorporates all clarification outcomes from 2026-03-20:

- Formalized build-time sync as a first-class requirement (`SyncLovelyData`).
- Explicit window-style requirements (`WS_EX_TOPMOST`, `WS_EX_TRANSPARENT`, `WS_EX_LAYERED`).
- Explicit performance target of 60 Hz polling and < 2 ms telemetry-to-render p95 latency.
- Explicit C# 14 `field` and extension-member requirements for telemetry hot path.
- Explicit SkiaSharp `GRContext` requirement for hardware-accelerated rendering.
- Explicit telemetry SDK source-generated type-safe struct requirement.

## Technical Context

**Language/Version**: C# 14 on .NET 10.0.x LTS  
**Primary Dependencies**: `SVappsLAB.iRacingTelemetrySDK` v1.1+, `SkiaSharp` 3.119+, `Polly`, `System.Threading.Channels`, `System.Text.Json` source generators  
**Storage**: Build-time local resources in `Resources/CarData/`; embedded/generated runtime lookup (no runtime file/network dependency for car data)  
**Testing**: xUnit + FluentAssertions + coverage tooling; mandatory 100% unit coverage for `TelemetryMath` and `PhysicsEngine`  
**Target Platform**: Windows desktop runtime (overlay), macOS via Parallels for development using mock provider  
**Project Type**: Hybrid desktop overlay application (`WinExe` Windows runtime path; Native AOT retained for non-Windows path)  
**Performance Goals**: 60 Hz telemetry ingestion and render update cadence with < 2 ms telemetry-to-render latency at p95  
**Constraints**: Smallest-practical release artifact with preferred Native AOT single-file delivery where technically compatible; <= 20 MB working set; < 0.3% total CPU utilization; zero-allocation hot path; overlay window must apply `WS_EX_TOPMOST`, `WS_EX_TRANSPARENT`, and `WS_EX_LAYERED`  
**Scale/Scope**: Single-panel overlay with rev strip + two-line data ribbon; per-session realtime telemetry for one local driver

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Native AOT compliance: PASS
  - Build pipeline includes publish profile and CI gate for preferred single-file,
    trimmed, self-contained Native AOT output, with artifact size measured and
    justified rather than hard-capped.
- Runtime compliance: PASS
  - Implementation pinned to .NET 10.0 LTS and C# 14; source-generated JSON and
    source-generated car lookup remove reflection and dynamic parsing paths.
  - C# 14 `field`-backed properties and extension members are explicitly required
    for telemetry hot-path implementation.
- Hot-path performance compliance: PASS
  - Telemetry Read -> Transform -> Render path designed as allocation-free using
    spans/value types and precomputed profile structures.
- Concurrency compliance: PASS
  - Channel-based producer/consumer pipeline between telemetry acquisition and
    renderer update loops.
- Resiliency compliance: PASS
  - Adapter lifecycle includes reconnect/reattach strategy with `Polly` policies.
- Test compliance: PASS
  - Coverage gates defined to hold `TelemetryMath` and `PhysicsEngine` at 100%.
- UX compliance: PASS
  - Overlay adapter enforces `WS_EX_TOPMOST`, `WS_EX_TRANSPARENT`, and
    `WS_EX_LAYERED` while retaining actionable metric filtering.
- Graphics acceleration compliance: PASS
  - Rendering path is required to initialize and render through `GRContext` on
    supported hardware acceleration backend.
- Telemetry typing compliance: PASS
  - Telemetry pipeline requires source-generated type-safe telemetry structs from
    SDK integration.
- Evidence compliance: PASS
  - Plan defines benchmark and runtime sampling protocol for cadence, memory, CPU,
    binary-size thresholds, and p95 telemetry-to-render latency.

**Gate Result (Pre-Phase 0)**: PASS
**Gate Result (Post-Phase 1 Design)**: PASS

## Clarification Resolution Status

- Critical issue 1 (missing Win32 controls): RESOLVED in spec and plan.
- Critical issue 2 (explicit 60 Hz and < 2 ms metrics): RESOLVED in spec and plan.
- Critical issue 3 (formal build-time data sync requirement): RESOLVED in spec and plan.
- Critical issue 4 (missing field/extension-member requirements): RESOLVED in spec and tasks.
- Critical issue 5 (missing GRContext requirement): RESOLVED in spec and tasks.
- Critical issue 6 (missing telemetry source-generated struct requirement): RESOLVED in spec and tasks.
- High issue (FR-010 ambiguity): RESOLVED via explicit < 2 ms p95 bound.
- Medium issue (SC-004 validation gap): RESOLVED via protocol/evidence requirement and task mapping.
- Low issue (unmapped observability task): RESOLVED via explicit observability requirement.

## Requirement-to-Execution Traceability

- Build-time sync requirement (`SyncLovelyData`) maps to implementation tasks: T009, T010, T032.
- Win32 window-style requirement maps to implementation tasks: T014, T042.
- 60 Hz and < 2 ms p95 performance requirements map to implementation tasks: T017, T039.
- Field/extension-member requirements map to implementation tasks: T043.
- GRContext hardware-acceleration requirement maps to implementation tasks: T045.
- Telemetry source-generated struct requirement maps to implementation tasks: T044.
- SC-004 usability protocol/evidence requirement maps to implementation tasks: T046.
- Structured telemetry lifecycle logging requirement maps to implementation tasks: T038, T047.

## Project Structure

### Documentation (this feature)

```text
specs/001-core-overlay/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── PrecisionDash.App/
│   ├── Program.cs
│   ├── Composition/
│   └── Resources/
│       └── CarData/
├── PrecisionDash.Application/
│   ├── Ports/
│   │   ├── TelemetryProvider.cs
│   │   ├── RenderPresenter.cs
│   │   └── CarProfileProvider.cs
│   ├── Pipeline/
│   │   ├── TelemetryChannelBridge.cs
│   │   └── FrameComposer.cs
│   └── UseCases/
├── PrecisionDash.Domain/
│   ├── TelemetryMath/
│   ├── PhysicsEngine/
│   ├── RevStrip/
│   └── Ribbon/
├── PrecisionDash.Adapters.Telemetry.iRacing/
├── PrecisionDash.Adapters.Telemetry.Mock/
├── PrecisionDash.Adapters.Rendering.Skia/
├── PrecisionDash.Adapters.Windowing.Win32/
└── PrecisionDash.Build/
│   ├── SyncLovelyData.targets
│   └── SourceGenerators/

tests/
├── PrecisionDash.Domain.Unit/
├── PrecisionDash.Application.Unit/
├── PrecisionDash.Adapters.Integration/
└── PrecisionDash.Contracts/
```

**Structure Decision**: Single-repository, multi-project Hexagonal architecture.
Core business rules reside in `PrecisionDash.Domain`; application orchestration and
ports reside in `PrecisionDash.Application`; platform-specific details are isolated
to adapters. Build-time data sync/generation is separated into `PrecisionDash.Build`
to keep runtime binaries deterministic and AOT-safe.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ----------------------------------- |
| None | N/A | N/A |
