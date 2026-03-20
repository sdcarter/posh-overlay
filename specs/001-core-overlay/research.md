# Research: PrecisionDash Core Overlay

## Decision 1: Hexagonal architecture with a TelemetryProvider port

- Decision: Use a ports-and-adapters architecture with `TelemetryProvider` as a primary inbound telemetry port and separate adapters for iRacing SDK and mock telemetry.
- Rationale: This isolates domain and pipeline logic from platform concerns, enables development on macOS/Parallels, and supports deterministic integration testing without simulator process dependency.
- Alternatives considered:
  - Layered monolith with direct SDK references in core: rejected because platform coupling would block mock-first development and reduce testability.
  - Event-bus-heavy architecture: rejected because added complexity and allocations are counter to hot-path constraints.

## Decision 2: Build-time Lovely data synchronization via MSBuild target

- Decision: Add `SyncLovelyData` as a pre-build target that syncs manifest and car JSON into `Resources/CarData/`.
- Rationale: Guarantees controlled inputs to source generation, supports reproducible builds, and removes runtime networking/file-load dependencies for car data.
- Alternatives considered:
  - Runtime HTTP fetch: rejected due to startup nondeterminism and constitution prohibition.
  - Manual data vendoring only: rejected because sync drift risk is high and update workflow is error-prone.

## Decision 3: Compile-time generation of CarLookup

- Decision: Use C# source generators to parse local Lovely data at compile time and emit static, allocation-free lookup tables.
- Rationale: Eliminates runtime parsing overhead and reflection, improving Native AOT compatibility and startup stability.
- Alternatives considered:
  - Runtime JSON parsing with caching: rejected due to allocations and AOT reflection constraints.
  - Embedded raw JSON with delayed parse: rejected due to cold-start cost and additional failure points.

## Decision 4: Channel-based telemetry to render pipeline

- Decision: Use bounded `System.Threading.Channels` between telemetry producer (60 Hz) and render consumer loops.
- Rationale: Lock-free communication with controlled backpressure supports low-latency updates while minimizing contention and allocations.
- Alternatives considered:
  - Locks around shared snapshot object: rejected due to contention risk and timing jitter.
  - Unbounded queues: rejected due to possible memory growth and stale frame buildup.

## Decision 5: Rendering and windowing approach

- Decision: Use SkiaSharp GPU path and Win32 layered transparent top-most window styles (`WS_EX_LAYERED`, `WS_EX_TRANSPARENT`, top-most behavior).
- Rationale: Meets visual clarity requirements and ensures no input interference with simulation.
- Alternatives considered:
  - WPF/WinForms overlays: rejected by constitution and rendering performance constraints.
  - Non-top-most overlay: rejected because HUD visibility can be lost during race sessions.

## Decision 6: Resiliency and development loop

- Decision: Implement reconnection with `Polly`, plus a `MockTelemetryProvider`/`MockiRacingService` for simulator-free testing.
- Rationale: Preserves runtime resilience and enables feature development and validation from macOS/Parallels without active iRacing process.
- Alternatives considered:
  - Retry loops without policy abstraction: rejected due to poorer observability and policy drift.
  - Windows-only development dependency: rejected due to reduced iteration speed and contributor constraints.
