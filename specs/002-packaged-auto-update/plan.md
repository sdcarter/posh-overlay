# Implementation Plan: Installed Packaging and Auto-Update

**Branch**: `002-packaged-auto-update` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-packaged-auto-update/spec.md`

## Summary

Replace the current zip-only Windows release flow with a signed installed delivery
model built around MSIX plus App Installer assets published to GitHub Releases,
and add application-layer update orchestration that checks for new releases,
downloads validated payloads automatically, then prompts the user to install now
or defer. The feature must preserve the existing telemetry/render hot path,
overlay click-through behavior, and runtime performance evidence while treating
installed packaging as a documented release-shape exception to the preferred
Native AOT single-file path when Windows packaging requirements require it.

## Technical Context

**Language/Version**: C# 14 on .NET 10.0.x LTS  
**Primary Dependencies**: Polly 8.4.1, SkiaSharp 3.119.0, SVappsLAB.iRacingTelemetrySDK 1.1.0, System.Threading.Channels 8.0.0, GitHub Releases HTTP access, Windows MSIX/App Installer tooling, Windows signing toolchain  
**Storage**: Local filesystem for downloaded update payloads, App Installer/MSIX artifacts, install metadata, and startup/update logs  
**Testing**: xUnit unit/integration/contract suites plus Windows install/update validation on packaged builds  
**Target Platform**: Windows 10/11 x64 installed desktop application, with GitHub Releases as the canonical update source  
**Project Type**: Desktop application plus CI/release automation  
**Performance Goals**: Preserve 60 Hz telemetry polling, <= 20 MB working set, and < 0.3% CPU utilization during active sessions; keep update work off the telemetry/render path  
**Constraints**: Signed installer/update artifacts; fail-closed signature verification; Start Menu launch without manual extraction; smallest-practical payload and installer size with documented rationale for any non-AOT/non-single-file Windows release shape; no regression in overlay click-through or actionable telemetry presentation  
**Scale/Scope**: Single Windows desktop app, one stable GitHub release channel, one primary packaged architecture (`win-x64`), one update flow surfaced from the existing tray/startup shell

## Constitution Check

*GATE: Pass before Phase 0 research. Re-check after Phase 1 design.*

- Native AOT compliance: PASS. The plan keeps Native AOT, single-file, trimmed,
  self-contained delivery as the preferred payload target, but documents the
  installed MSIX/App Installer envelope as a justified Windows packaging exception
  with separate size evidence.
- Runtime compliance: PASS. Implementation remains pinned to .NET 10.0.x LTS and
  C# 14, and the update feature does not introduce an alternate runtime stack.
- Hot-path performance compliance: PASS. Update discovery, download, and trust
  validation stay outside Telemetry Read -> Math Transform -> Render and do not
  allocate work on the refresh loop.
- Concurrency compliance: PASS. Existing telemetry/render `System.Threading.Channels`
  behavior remains unchanged; update operations run on separate background control
  flow and only marshal prompt state onto the Windows UI shell.
- Resiliency compliance: PASS. GitHub release access, download retries, and
  installer invocation use `Polly`-backed retry/backoff handling while keeping the
  current install usable on every expected failure path.
- Test compliance: PASS. `TelemetryMath` and `PhysicsEngine` coverage obligations
  remain unchanged; new work adds update-service unit coverage plus install/update
  contract and integration evidence.
- UX compliance: PASS. Start Menu installation replaces manual extraction,
  install-now/defer prompting avoids unsafe silent replacement, and existing tray
  and click-through overlay behavior remain intact.
- Evidence compliance: PASS. The feature records payload size, package size,
  install success, update success, signature verification, and runtime budget
  evidence in quickstart and release validation output.

## Project Structure

### Documentation (this feature)

```text
specs/002-packaged-auto-update/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── release-package-contract.md
│   └── update-service-port.md
└── tasks.md
```

### Source Code (repository root)

```text
.github/
└── workflows/
    └── release-windows.yml

packaging/
└── Windows/
    ├── Package.appxmanifest
    └── PrecisionDash.appinstaller

src/
├── PrecisionDash.App/
│   ├── Composition/
│   ├── Program.cs
│   ├── StartupLog.cs
│   └── WindowsStartup.cs
├── PrecisionDash.Application/
│   ├── Ports/
│   └── UseCases/
├── PrecisionDash.Domain/
├── PrecisionDash.Adapters.Telemetry.iRacing/
├── PrecisionDash.Adapters.Telemetry.Mock/
├── PrecisionDash.Adapters.Rendering.Skia/
├── PrecisionDash.Adapters.Windowing.Win32/
├── PrecisionDash.Adapters.Update.GitHub/
├── PrecisionDash.Adapters.Update.Windows/
└── PrecisionDash.Build/

tests/
├── PrecisionDash.Adapters.Integration/
├── PrecisionDash.Application.Unit/
├── PrecisionDash.Contracts/
└── PrecisionDash.Domain.Unit/
```

**Structure Decision**: Keep the existing ports-and-adapters desktop layout.
Packaging/update orchestration is added through application-layer ports/use cases,
Windows shell composition in `PrecisionDash.App`, and release workflow changes in
`.github/workflows/release-windows.yml` rather than introducing a separate updater
application.

## Phase 0 Research Summary

- Windows delivery will use signed MSIX packaging plus a GitHub-hosted App
  Installer manifest.
- GitHub Releases remains the canonical discovery source for stable updates.
- Update behavior is auto-download followed by an install-now/defer decision.
- Signature verification is mandatory and fail-closed before installation.
- Artifact size is treated as a measured, justified tradeoff rather than a fixed
  hard ceiling.
- Update orchestration belongs in the application layer, isolated from the
  telemetry/render hot path.

## Phase 1 Design Summary

- `InstalledApplicationRecord`, `ReleaseDescriptor`, `UpdateDecision`,
  `UpdateTrustEnvelope`, `UpdateTransaction`, and `AppInstallerManifest` capture
  installation identity, release metadata, trust state, and lifecycle state.
- `IUpdateService` defines application-facing operations for release discovery,
  download, verification, and prompt/install orchestration.
- The release-package contract defines the GitHub-hosted MSIX and App Installer
  assets required for stable installed clients.
- Quickstart evidence records payload size, installer size, Start Menu launch,
  update success, signature verification, and failure safety validation.

## Post-Design Constitution Check

- Native AOT compliance: PASS. The design explicitly separates preferred payload
  optimization from the installed package envelope and requires rationale and size
  evidence for the packaged Windows release shape.
- Hot-path and concurrency compliance: PASS. No update work is added to the 60 Hz
  telemetry/render loop or existing cross-thread telemetry pipeline.
- Resiliency and evidence compliance: PASS. `Polly`-backed recovery, fail-closed
  trust validation, and release/install evidence are first-class artifacts.

## Current Verification Snapshot

- Preferred Native AOT path verified on the current macOS host with `dotnet publish`
  targeting `net10.0` / `osx-arm64`; produced executable size was approximately
  1.40 MB with a 23 MB publish directory footprint including support files.
- Attempting Native AOT cross-OS publish for `win-x64` from macOS fails with
  `Cross-OS native compilation is not supported`, which is consistent with the
  decision to treat the Windows packaged release shape as a documented exception
  that must be produced on a Windows runner with packaging/signing tooling.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ----------------------------------- |
| Installed Windows distribution is not a pure single-file Native AOT artifact end-to-end | Signed MSIX plus App Installer packaging is required to satisfy Start Menu installation, upgrade identity, and Windows-native update orchestration | Continuing zip-only distribution or forcing a hard single-file artifact would fail the installation and auto-update requirements |
