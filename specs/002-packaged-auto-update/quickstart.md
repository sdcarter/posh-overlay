# Quickstart: Installed Packaging and Auto-Update

## Goal

Produce a signed Windows install package for PrecisionDash, install it via normal Windows app flow, and validate GitHub-backed update discovery and install behavior.

## Prerequisites

- .NET 10.0.x SDK
- Windows packaging/signing toolchain for MSIX/App Installer generation
- Access to the signing certificate used for release packages
- GitHub repository release permissions
- Existing PrecisionDash application builds passing current test suites

## Current Repository Verification Status

The following repository-level checks are already automatable and should be run before any Windows/manual validation pass:

- `dotnet test tests/PrecisionDash.Application.Unit/PrecisionDash.Application.Unit.csproj -c Release`
- `dotnet test tests/PrecisionDash.Adapters.Integration/PrecisionDash.Adapters.Integration.csproj -c Release`
- `dotnet test tests/PrecisionDash.Contracts/PrecisionDash.Contracts.csproj -c Release`
- `dotnet test tests/PrecisionDash.Domain.Unit/PrecisionDash.Domain.Unit.csproj -c Release`

Expected result:

- Application update orchestration, contract parsing, and failure recovery checks all pass locally.
- Domain-unit gate project passes and remains part of the pre-merge validation path.

Current local verification snapshot (2026-03-20, macOS host):

- `dotnet test tests/PrecisionDash.Application.Unit/PrecisionDash.Application.Unit.csproj -c Release` passed (23/23).
- `dotnet test tests/PrecisionDash.Adapters.Integration/PrecisionDash.Adapters.Integration.csproj -c Release` passed (18/18).
- `dotnet test tests/PrecisionDash.Contracts/PrecisionDash.Contracts.csproj -c Release` passed (22/22).
- `dotnet test tests/PrecisionDash.Domain.Unit/PrecisionDash.Domain.Unit.csproj -c Release` passed (3/3).

## 1) Build the Core Payload

1. Restore and build the application payload.
2. Publish the Windows payload in the governed configuration.
3. Record payload artifact size separately from installer/package wrapper size.

Expected result:

- Core executable remains the governed application payload.
- Windows-targeted publish output is available for packaging.

## 2) Generate Installable Package

1. Produce signed MSIX package from the published payload.
2. Generate App Installer manifest that points to the package artifact hosted on GitHub Releases.
3. Verify package identity, publisher, version, and architecture metadata.

Expected result:

- Install package can be installed like a normal Windows application.
- Start Menu entry is created by the install flow.

## 3) Validate Fresh Install Experience

1. Start from a clean Windows machine or VM with no prior PrecisionDash install.
2. Install the packaged release.
3. Confirm:
   - PrecisionDash appears in Start Menu.
   - App launches successfully from Start Menu.
   - Existing overlay behavior still works after install.

Expected result:

- No manual extraction or zip handling is required.

## 4) Validate Update Discovery and Install

1. Install an older signed release.
2. Publish a newer signed release to GitHub Releases with matching update manifest.
3. Launch the older installed app and verify:
   - Newer compatible release is detected.
   - Update payload is downloaded automatically.
   - User is prompted to install now or defer.
   - Choosing install now updates and relaunches successfully.
   - Choosing defer keeps current version usable.

Expected result:

- Update flow is driven by GitHub release metadata and signed payloads.

## 5) Validate Failure Safety

1. Simulate GitHub unavailability or rate limiting.
2. Simulate missing or incompatible package assets.
3. Simulate signature verification failure.
4. Confirm current installed version remains launchable in all cases.

Expected result:

- Update path fails safely and never leaves the user without a runnable install.

## Evidence Template

### Packaging Evidence

- Payload publish command:
- Payload artifact path:
- Payload size (MB):
- Installer artifact path:
- Installer artifact size (MB):
- Start Menu launch verified: Pass/Fail
- Native AOT preferred-path result: Pass/Fail
- Windows packaging exception rationale:

Current measured evidence (2026-03-20):

- Payload publish command: `dotnet publish src/PrecisionDash.App/PrecisionDash.App.csproj -f net10.0 -c Release -r osx-arm64 -o artifacts/size-check-osx`
- Payload artifact path: `artifacts/size-check-osx/PrecisionDash.App`
- Payload size (MB): `1.40`
- Publish directory footprint: `23 MB`
- Native AOT preferred-path result: Pass on `osx-arm64`
- Cross-target `win-x64` Native AOT attempt from macOS: Fails with `Cross-OS native compilation is not supported`
- Windows packaging exception rationale: Signed MSIX/App Installer packaging requires Windows-specific packaging/signing tooling and intentionally disables the pure Native AOT Windows envelope while preserving the preferred AOT payload path where technically compatible.

### Update Evidence

- Installed version under test:
- Available version detected:
- Auto-download completed: Pass/Fail
- Install prompt shown: Pass/Fail
- Install-now path succeeded: Pass/Fail
- Defer path preserved current version: Pass/Fail
- Update-check classification accuracy sample size:
- Update-install success sample size:

### Trust and Safety Evidence

- Signature verification result:
- Invalid signature rejection verified: Pass/Fail
- Offline/rate-limited behavior verified: Pass/Fail
- Current version remained runnable after failure: Pass/Fail

### Runtime Regression Evidence

- Deterministic startup regression test result:
- Telemetry lifecycle logging regression test result:
- Hot-path allocation audit result:
- Click-through style verification result:

Current local regression status (2026-03-20):

- Deterministic startup regression test result: Pass
- Telemetry lifecycle logging regression test result: Pass
- Hot-path allocation audit result: Source-level guard confirms update scheduling remains outside `RefreshOverlay()`
- Click-through style verification result: Source-level guard confirms `WS_EX_TOPMOST`, `WS_EX_TRANSPARENT`, and `WS_EX_LAYERED` remain applied

## Suggested Commands

```bash
dotnet restore src/PrecisionDash.App/PrecisionDash.App.csproj
dotnet build src/PrecisionDash.App/PrecisionDash.App.csproj -c Release
dotnet test tests/PrecisionDash.Application.Unit/PrecisionDash.Application.Unit.csproj -c Release
dotnet test tests/PrecisionDash.Domain.Unit/PrecisionDash.Domain.Unit.csproj -c Release
dotnet test tests/PrecisionDash.Adapters.Integration/PrecisionDash.Adapters.Integration.csproj -c Release
dotnet test tests/PrecisionDash.Contracts/PrecisionDash.Contracts.csproj -c Release
```

## Contract Reconciliation Notes

- Release discovery currently relies on GitHub release metadata plus embedded Authenticode validation of the downloaded MSIX.
- Detached publisher fingerprint metadata is optional in the current implementation; when absent, trust is established from the signed payload itself.
- The application-facing update service exposes `RunAutoUpdateAsync` for non-blocking startup-triggered update checks.

## Release Workflow Expectations

1. Tag a release version.
2. CI builds the governed app payload.
3. CI packages signed installer/update artifacts.
4. CI publishes package and update manifest to GitHub Releases.
5. Installed clients discover the new release through GitHub-backed metadata.
