# Contract: Update Service Port

## Purpose

Define the application-facing contract for release discovery, download, verification, and install orchestration.

## Port Name

`IUpdateService`

## Operations

### CheckForUpdatesAsync

- Description: Compare installed version against the latest compatible GitHub release.
- Input:
  - `cancellationToken`
- Output:
  - `UpdateDecision`
- Guarantees:
  - Does not modify installed application state.
  - Returns `CheckFailed` rather than throwing for expected release-fetch failures.

### DownloadUpdateAsync

- Description: Download the payload and associated metadata for a previously identified update.
- Input:
  - `ReleaseDescriptor`
  - `cancellationToken`
- Output:
  - `UpdateTransaction` in `Downloaded` or `Failed` state
- Guarantees:
  - Download target is isolated from active install location.
  - Existing installed version remains runnable while download is in progress.

### VerifyUpdateAsync

- Description: Validate cryptographic trust for the downloaded payload.
- Input:
  - `UpdateTransaction`
  - `cancellationToken`
- Output:
  - `UpdateTrustEnvelope`
- Guarantees:
  - Verification fails closed.
  - Installation is forbidden unless verification result is `Verified`.

### PromptAndInstallAsync

- Description: Prompt user to install now or defer, and execute install if approved.
- Input:
  - `UpdateTransaction`
  - `UpdateTrustEnvelope`
  - `cancellationToken`
- Output:
  - `UpdateTransaction` in `Deferred`, `Installed`, or `Failed` state
- Guarantees:
  - User may defer without breaking the current install.
  - Installation failure leaves current app usable.

### RunAutoUpdateAsync

- Description: Run the full check, download, verify, and prompt/install flow as a non-blocking background operation.
- Input:
  - `cancellationToken`
- Output:
  - No direct return value; outcomes are expressed through lifecycle logs and persisted transaction state.
- Guarantees:
  - Expected failures are swallowed after logging.
  - The current installed app remains usable if any step fails.

## Behavioral Rules

- Service must treat GitHub Releases as the canonical source of available versions.
- Service must only consider Windows-compatible installer assets for the current channel.
- Service must automatically download update payloads once `UpdateAvailable` is established.
- Service must require explicit user choice before transitioning into `Installing`.
- Service must emit structured lifecycle events for check, download, verify, prompt, install, defer, and failure steps.

## Domain Outputs

- `UpdateDecision`
- `UpdateTransaction`
- `UpdateTrustEnvelope`

## Failure Semantics

- Rate limiting, offline state, invalid release metadata, signature mismatch, and install failure must be represented as domain-safe results rather than uncaught adapter exceptions.
- The background auto-update path must not surface uncaught exceptions to the UI shell.
