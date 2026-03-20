# Quickstart: PrecisionDash Core Overlay

## Goal

Run and validate the Core Overlay feature with either live iRacing telemetry on Windows or mock telemetry from macOS/Parallels.

## Prerequisites

- .NET 10.0.x SDK
- Windows runtime target for final execution
- iRacing installed for live telemetry validation (optional for mock mode)
- Repository checked out on current implementation branch (for release work, `main`)

## 1) Restore and Build

1. Restore dependencies.
2. Run build with `SyncLovelyData` pre-build target enabled.
3. Confirm `Resources/CarData/` contains synced manifest and profile files.

Expected result:

- Build succeeds.
- Source generator emits `CarLookup` artifacts.

## 2) Run in Mock Mode (macOS/Parallels-friendly)

1. Set environment/config to use `MockTelemetryProvider`.
2. Provide mock state JSON input used by `MockiRacingService`.
3. Launch app and verify:
   - Rev strip renders and updates.
   - Ribbon shows incidents/brake bias/traction control updates.
   - Overlay uses intended background color and visual styling.

Expected result:

- UI behavior is testable without live simulator process.

## 3) Run in Live Mode (Windows)

1. Set telemetry adapter to iRacing SDK provider.
2. Launch iRacing session.
3. Launch overlay and verify:
   - Window is top-most and click-through.
   - Rev strip follows car-specific profile by `driverCarId`.
   - Blue flashing behavior appears at rev-limiter threshold.
   - Incident count increments in practice/race sessions and displays `/-` where no limit is provided.
   - BB/TC values remain stable across transient telemetry null frames.

Expected result:

- Overlay tracks live telemetry with stable updates.

## 4) Validate Constitution Gates

1. Confirm publish output uses the preferred Native AOT single-file self-contained path where technically compatible, and record artifact size with justification.
2. Capture runtime metrics during active session:
   - 60 Hz cadence stability
   - Working set <= 20 MB
   - CPU < 0.3%
3. Confirm no runtime HTTP or dynamic car-profile file access for lookup path.
4. Confirm coverage gates for `TelemetryMath` and `PhysicsEngine` remain at 100%.

### Benchmark Evidence Template (T043)

- Telemetry polling cadence:
  - Target: 60 Hz stable
  - Sample window: 10 minutes
  - Measured:
  - Pass/Fail:
- Telemetry-to-render latency:
  - Target: < 2 ms p95
  - Sample window: 10,000 frames
  - Measured p95:
  - Pass/Fail:
- Memory:
  - Target: <= 20 MB working set
  - Measured peak:
  - Pass/Fail:
- CPU:
  - Target: < 0.3% total CPU utilization
  - Measured average:
  - Pass/Fail:

### Native AOT Artifact Evidence (T044)

- Command: `dotnet publish src/PrecisionDash.App/PrecisionDash.App.csproj -c Release`
- Artifact path:
- Artifact size (MB):
- Size justification / exception note:

### Win32 Style Evidence (T045)

- Required styles:
  - `WS_EX_TOPMOST`
  - `WS_EX_TRANSPARENT`
  - `WS_EX_LAYERED`
- Verification method: runtime window-style inspection
- Evidence notes:

### SC-004 Usability Protocol (T046/T047)

- Participants: minimum 10 drivers.
- Scenario: active race session with rev strip and ribbon visible.
- Task: each driver reports shift readiness and incident status after a glance.
- Success threshold: >= 90% of participants answer correctly within 3 seconds.
- Data capture:
  - Driver ID
  - Correct/incorrect
  - Response time (seconds)
- Evidence summary:
  - Correct responses:
  - Within 3-second responses:
  - Threshold met:

## Troubleshooting

- Missing car profile during build:
  - Re-run build with sync logging enabled and verify manifest references.
- No live telemetry values:
  - Verify iRacing process is active and provider attach state is healthy.
- Overlay intercepting clicks:
  - Verify layered/transparent style flags are applied at window creation.

## Windows Packaging via GitHub Actions

1. Ensure current changes are merged into `main`.
2. Create and push a version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

1. The `release-windows` workflow publishes a Native AOT win-x64 package and uploads:
   - Build artifact: `PrecisionDash-v0.1.0-win-x64.zip`
   - GitHub Release asset (for tag-triggered runs)
