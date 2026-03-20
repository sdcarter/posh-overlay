# Feature Specification: Installed Packaging and Auto-Update

**Feature Branch**: `002-packaged-auto-update`  
**Created**: 2026-03-20  
**Status**: Draft  
**Input**: User description: "I want to make a significant change here to the packaging, deployment and updating. So, more specifically, I want the application to move to be a packaged deployment that is installed. It should be able to be launched from the windows start menu and it should look on GitHub for the newest package available and update it if it's out there. This will allow me to more quickly iterate on my changes since I'm having to download the zip after each build."

## Clarifications

### Session 2026-03-20

- Q: What update trust model should be required for installer/update payloads? -> A: Require cryptographic signature verification and fail closed when verification fails.
- Q: What update interaction model should be used for normal releases? -> A: Automatically download updates, then prompt user to install now or defer.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Installable Desktop App (Priority: P1)

As a Windows user, I want PrecisionDash installed like a normal desktop app so I can launch it from Start Menu without manually extracting a zip.

**Why this priority**: Reliable installation and launcher integration are prerequisites for any update flow and remove the biggest day-to-day friction immediately.

**Independent Test**: Can be fully tested by installing on a clean Windows machine and confirming Start Menu launch works without manual file extraction.

**Acceptance Scenarios**:

1. **Given** no prior install, **When** the user runs the installer package, **Then** PrecisionDash is installed and appears in Start Menu.
2. **Given** PrecisionDash is installed, **When** the user launches from Start Menu, **Then** the app starts successfully with expected runtime behavior.

---

### User Story 2 - Automatic Update Detection and Install (Priority: P2)

As an installed user, I want the app to check GitHub for a newer release and update itself so I do not manually download each new version.

**Why this priority**: This directly addresses iteration speed by removing repeated manual download and replacement steps.

**Independent Test**: Can be tested by running an older installed version while a newer GitHub release exists and verifying that update discovery and installation complete successfully.

**Acceptance Scenarios**:

1. **Given** an installed version older than the latest GitHub release, **When** update check runs, **Then** the app identifies that a newer version is available.
2. **Given** a newer version is available and user approves update, **When** update is performed, **Then** the app updates to the new version and relaunches successfully.
3. **Given** no newer release exists, **When** update check runs, **Then** the app reports that it is up to date and takes no update action.

---

### User Story 3 - Safe and Predictable Update Experience (Priority: P3)

As a user, I want update failures or connectivity issues handled safely so the installed app remains usable and I always know update status.

**Why this priority**: Robust error handling prevents broken installs and reduces support burden as update automation is introduced.

**Independent Test**: Can be tested by simulating network unavailability and invalid release assets, then verifying the current installed version remains functional with clear status messaging.

**Acceptance Scenarios**:

1. **Given** network access is unavailable, **When** update check runs, **Then** the app continues running current version and shows a non-blocking update error state.
2. **Given** an update payload is invalid or installation fails, **When** update is attempted, **Then** the current installed version remains launchable and update failure is clearly reported.

### Edge Cases

- Update check is rate-limited or temporarily unavailable from GitHub.
- User launches app while an update install is pending or in progress.
- Installed version metadata is missing or unreadable.
- New release exists but no compatible Windows installer asset is present.
- User has insufficient privileges for installation/update operation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST produce a Windows installable package artifact as part of release delivery.
- **FR-002**: Installer flow MUST register PrecisionDash for Start Menu launch.
- **FR-003**: Installed app MUST be launchable from Start Menu without requiring manual extraction steps.
- **FR-004**: Installed app MUST check GitHub releases for a newer available version.
- **FR-005**: System MUST compare installed version against latest available compatible release version.
- **FR-006**: When a newer version is available, system MUST automatically download the update payload.
- **FR-007**: System MUST prompt the user to install now or defer after a valid update payload is ready.
- **FR-008**: After successful update, system MUST preserve ability to launch app normally.
- **FR-009**: If update check fails, system MUST keep current version usable and present a clear non-blocking status message.
- **FR-010**: If update install fails, system MUST not leave the user in an unusable state.
- **FR-011**: System MUST record structured install/update lifecycle events for diagnostics.
- **FR-012**: Release process MUST publish installer artifacts in a predictable format suitable for update detection.
- **FR-013**: System MUST verify cryptographic signatures of installer/update payloads before installation.
- **FR-014**: System MUST reject update installation when signature verification fails.

### Constitution Constraints *(mandatory)*

- **CC-001**: Feature MUST preserve the preferred Native AOT single-file,
  self-contained, trimmed delivery path where technically compatible, and MUST
  document any Windows packaging-driven release-shape exception with size
  evidence and rationale.
- **CC-002**: Feature MUST preserve zero-allocation behavior on the hot path
  (Telemetry Read -> Math Transform -> Render) during normal operation.
- **CC-003**: Feature MUST preserve telemetry/render concurrency via
  `System.Threading.Channels` where cross-thread messaging is required.
- **CC-004**: Feature MUST not regress 100% unit test coverage expectations for
  `TelemetryMath` and `PhysicsEngine`.
- **CC-005**: Feature MUST preserve overlay click-through behavior and actionable
  data presentation rules.

### Key Entities *(include if feature involves data)*

- **Installed Application Record**: Local installation identity including current version and install location metadata.
- **Release Descriptor**: Parsed representation of latest compatible release metadata fetched from GitHub.
- **Update Decision**: Result of comparing installed and available versions, including up-to-date/update-available states.
- **Update Transaction**: Single update attempt lifecycle with states for started, downloaded, validated, installed, failed.
- **Update Trust Envelope**: Verification metadata and signature-validation result used to authorize or reject update payload installation.

## Assumptions

- GitHub Releases remains the canonical source of distributable Windows installer artifacts.
- Update checks target stable releases by default.
- Update installs are user-prompted after automatic download (install now or defer).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of validation installs on clean Windows machines complete successfully and produce Start Menu launch entry; initial implementation evidence MAY be captured from a single clean-machine validation run, while release sign-off SHOULD accumulate at least 3 validation installs across distinct clean Windows environments.
- **SC-002**: At least 95% of update checks against published releases correctly identify up-to-date vs update-available status.
- **SC-003**: At least 95% of successful update attempts complete without requiring manual reinstallation.
- **SC-004**: Manual download-and-replace workflow usage for routine updates is reduced by at least 80% during pilot usage.

### Performance and Runtime Outcomes *(mandatory for implementation specs)*

- **PR-001**: 60 Hz telemetry polling remains stable under representative load.
- **PR-002**: Active-session working set remains <= 20 MB on target hardware class.
- **PR-003**: Active-session total CPU utilization remains < 0.3% on target
  hardware class.
- **PR-004**: Release artifact size is measured and justified for the chosen
  delivery model, and any deviation from preferred Native AOT, single-file,
  self-contained, and trimmed output is explicitly explained.
