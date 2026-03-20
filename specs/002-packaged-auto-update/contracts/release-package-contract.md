# Contract: Release Package and Update Feed

## Purpose

Define the published Windows package/update artifacts that GitHub Releases must expose for installed PrecisionDash clients.

## Release Channel Contract

- Canonical source: GitHub Releases for repository `sdcarter/posh-overlay`
- Channel: `stable` by default
- Version source: Git tag / release version string

## Required Published Assets Per Stable Release

- Signed MSIX package
- App Installer manifest
- SHA-256 checksum asset for the MSIX payload
- Optional publisher fingerprint metadata if published separately
- Release notes entry suitable for update message display

## Asset Naming Rules

- Asset names must be deterministic and versioned.
- Names must clearly identify architecture and package type.
- App Installer manifest must point to the exact MSIX package version for the release.

## Required Metadata Fields

### Release Descriptor

- `version`
- `publishedAtUtc`
- `installerAssetName`
- `installerAssetUrl`
- `appInstallerManifestUrl`
- `signatureFingerprint` (optional; may be empty when trust is established from embedded Authenticode signature only)
- `channel`
- `isPrerelease`
- `releaseNotes`

### App Installer Manifest

- `mainPackageName`
- `mainPackageVersion`
- `publisher`
- `uri`
- `hoursBetweenUpdateChecks`
- `showPrompt`

## Validation Rules

- Stable release must expose exactly one compatible installer package for the primary Windows target architecture.
- App Installer manifest version must match release version.
- When publisher fingerprint metadata is published, it must match the package actually downloaded.
- SHA-256 checksum asset must match the MSIX package actually downloaded.
- Prerelease assets must not be selected by stable-channel clients unless prerelease consumption is explicitly enabled.

## Consumer Guarantees

- Installed clients can discover whether a newer compatible version exists.
- Installed clients can download the next version without scraping human-readable release notes.
- Installed clients can reject untrusted or mismatched assets before install.
