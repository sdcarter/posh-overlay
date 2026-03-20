# Data Model: Installed Packaging and Auto-Update

## Entity: InstalledApplicationRecord

- Description: Local representation of an installed PrecisionDash instance.

- Fields:
  - `productId` (string, required)
  - `installedVersion` (string, required)
  - `installLocation` (string, required)
  - `channel` (string, required, default `stable`)
  - `installedAtUtc` (datetime string, required)
  - `packageIdentity` (string, required)

- Validation Rules:
  - `installedVersion` must be a valid semantic version or prerelease label recognized by the update policy.
  - `installLocation` must resolve to an existing installed package path.
  - `packageIdentity` must match the signed package identity used for upgrade eligibility.

## Entity: ReleaseDescriptor

- Description: Normalized metadata for the latest compatible GitHub release.

- Fields:
  - `version` (string, required)
  - `publishedAtUtc` (datetime string, required)
  - `releaseUrl` (string, required)
  - `channel` (string, required)
  - `installerAssetName` (string, required)
  - `installerAssetUrl` (string, required)
  - `appInstallerManifestUrl` (string, required)
  - `signatureFingerprint` (string, required)
  - `isPrerelease` (bool, required)

- Validation Rules:
  - `version` must compare cleanly against installed version.
  - Asset URLs must be absolute HTTPS URLs.
  - Stable channel must not consume prerelease assets unless explicitly enabled.

## Entity: UpdateDecision

- Description: Result of evaluating installed state against the newest compatible release.

- Fields:
  - `status` (enum: UpToDate, UpdateAvailable, Ineligible, CheckFailed)
  - `currentVersion` (string, required)
  - `availableVersion` (string, optional)
  - `reason` (string, optional)
  - `checkedAtUtc` (datetime string, required)

- Validation Rules:
  - `availableVersion` is required when `status = UpdateAvailable`.
  - `reason` is required when `status = Ineligible` or `status = CheckFailed`.

## Entity: UpdateTrustEnvelope

- Description: Trust and verification data attached to a downloaded update payload.

- Fields:
  - `assetPath` (string, required)
  - `signatureState` (enum: Verified, Invalid, Missing, UntrustedPublisher)
  - `publisherSubject` (string, optional)
  - `fingerprint` (string, optional)
  - `verifiedAtUtc` (datetime string, required)

- Validation Rules:
  - Update installation may proceed only when `signatureState = Verified`.
  - `fingerprint` must match release metadata when present.

## Entity: UpdateTransaction

- Description: One lifecycle instance of downloading, validating, and installing an update.

- Fields:
  - `transactionId` (string, required)
  - `targetVersion` (string, required)
  - `state` (enum: Started, Downloaded, Verified, Prompted, Deferred, Installing, Installed, Failed)
  - `startedAtUtc` (datetime string, required)
  - `completedAtUtc` (datetime string, optional)
  - `failureReason` (string, optional)
  - `userDecision` (enum: InstallNow, Defer, None)

- Validation Rules:
  - `failureReason` is required when `state = Failed`.
  - `userDecision` is required when `state = Deferred` or `state = Installing` after prompt.

## Entity: AppInstallerManifest

- Description: Published Windows update manifest describing install source and update behavior.

- Fields:
  - `uri` (string, required)
  - `mainPackageName` (string, required)
  - `mainPackageVersion` (string, required)
  - `publisher` (string, required)
  - `hoursBetweenUpdateChecks` (int, required)
  - `showPrompt` (bool, required)

- Validation Rules:
  - `uri` must resolve to the published GitHub-hosted manifest.
  - `mainPackageVersion` must match the release descriptor version.
  - `showPrompt` must align with approved update interaction model.

## Relationships

- One `InstalledApplicationRecord` yields one `UpdateDecision` per check.
- One `ReleaseDescriptor` may produce zero or one `UpdateTransaction` for a given installed instance.
- One `UpdateTransaction` must reference one `UpdateTrustEnvelope` before entering `Installing` state.
- One published `ReleaseDescriptor` must align with one `AppInstallerManifest` for installer/update discovery.

## State Transitions

- Update discovery lifecycle:
  - `UpToDate` -> `UpdateAvailable` when a higher compatible version is published.
  - `UpdateAvailable` -> `CheckFailed` when metadata fetch or parsing fails.

- Update transaction lifecycle:
  - `Started` -> `Downloaded` -> `Verified` -> `Prompted`
  - `Prompted` -> `Deferred` when user postpones install
  - `Prompted` -> `Installing` when user approves install
  - `Installing` -> `Installed` on success
  - Any state -> `Failed` on download, verification, or install error
