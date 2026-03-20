# Tasks: Installed Packaging and Auto-Update

**Input**: Design documents from `/specs/002-packaged-auto-update/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Constitution constraints and feature requirements make test tasks mandatory for this feature. Contract, unit, and integration coverage is included for each user story where behavior must be independently verifiable.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the project scaffolding and packaging assets required before update-specific behavior is implemented.

- [x] T001 Create update adapter projects and add them to `PrecisionDash.sln` in `src/PrecisionDash.Adapters.Update.GitHub/PrecisionDash.Adapters.Update.GitHub.csproj` and `src/PrecisionDash.Adapters.Update.Windows/PrecisionDash.Adapters.Update.Windows.csproj`
- [x] T002 Create the application unit test project and add it to `PrecisionDash.sln` in `tests/PrecisionDash.Application.Unit/PrecisionDash.Application.Unit.csproj`
- [x] T003 [P] Add shared update/package dependencies and project references in `Directory.Packages.props` and `src/PrecisionDash.App/PrecisionDash.App.csproj`
- [x] T004 [P] Scaffold Windows packaging asset templates in `packaging/Windows/Package.appxmanifest` and `packaging/Windows/PrecisionDash.appinstaller`
- [x] T005 Configure release workflow inputs for packaged artifacts in `.github/workflows/release-windows.yml`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared domain and application contracts that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Create installed-app and release metadata domain models in `src/PrecisionDash.Domain/Updates/InstalledApplicationRecord.cs` and `src/PrecisionDash.Domain/Updates/ReleaseDescriptor.cs`
- [x] T007 [P] Create update decision and transaction domain models in `src/PrecisionDash.Domain/Updates/UpdateDecision.cs` and `src/PrecisionDash.Domain/Updates/UpdateTransaction.cs`
- [x] T008 [P] Create trust and manifest domain models in `src/PrecisionDash.Domain/Updates/UpdateTrustEnvelope.cs` and `src/PrecisionDash.Domain/Updates/AppInstallerManifest.cs`
- [x] T009 Define the application update service port in `src/PrecisionDash.Application/Ports/IUpdateService.cs`
- [x] T010 [P] Define release feed and installer ports in `src/PrecisionDash.Application/Ports/IReleaseFeedClient.cs` and `src/PrecisionDash.Application/Ports/IPackageInstaller.cs`
- [x] T011 [P] Define install metadata and lifecycle logging ports in `src/PrecisionDash.Application/Ports/IInstalledApplicationStore.cs` and `src/PrecisionDash.Application/Ports/IUpdateLifecycleLogger.cs`
- [x] T012 Add foundational unit coverage for update entities and state transitions in `tests/PrecisionDash.Application.Unit/UpdateDomainModelTests.cs`

**Checkpoint**: Shared update models, ports, and validation rules are in place. User story implementation can begin.

---

## Phase 3: User Story 1 - Installable Desktop App (Priority: P1) 🎯 MVP

**Goal**: Ship a signed installed Windows package that registers Start Menu launch and preserves existing PrecisionDash runtime behavior.

**Independent Test**: Install the packaged build on a clean Windows machine and verify that PrecisionDash appears in Start Menu and launches without manual extraction.

### Tests for User Story 1

- [x] T013 [P] [US1] Add contract coverage for packaged release asset naming and metadata in `tests/PrecisionDash.Contracts/ReleasePackageContractTests.cs`
- [x] T014 [P] [US1] Add integration coverage for packaged install and Start Menu launch expectations in `tests/PrecisionDash.Adapters.Integration/InstalledPackagingStartupTests.cs`

### Implementation for User Story 1

- [x] T015 [P] [US1] Implement installed application metadata persistence in `src/PrecisionDash.Adapters.Update.Windows/InstalledApplicationStore.cs`
- [x] T016 [P] [US1] Implement the Windows package installer adapter in `src/PrecisionDash.Adapters.Update.Windows/PackageInstaller.cs`
- [x] T017 [US1] Produce signed MSIX and App Installer release artifacts in `.github/workflows/release-windows.yml`
- [x] T018 [US1] Register packaged update services and install logging in `src/PrecisionDash.App/Composition/UpdateServiceFactory.cs` and `src/PrecisionDash.App/StartupLog.cs`
- [ ] T019 [US1] Capture fresh-install validation evidence in `specs/002-packaged-auto-update/quickstart.md`

**Checkpoint**: PrecisionDash can be installed from a packaged release and launched from Start Menu independently of update automation.

---

## Phase 4: User Story 2 - Automatic Update Detection and Install (Priority: P2)

**Goal**: Detect newer GitHub releases from an installed app, download them automatically, and prompt the user to install now or defer.

**Independent Test**: Run an older installed version while a newer compatible GitHub release exists and verify update detection, automatic download, and install-now/defer behavior.

### Tests for User Story 2

- [x] T020 [P] [US2] Add contract coverage for GitHub release descriptor parsing and version selection in `tests/PrecisionDash.Contracts/GitHubReleaseDescriptorContractTests.cs`
- [x] T021 [P] [US2] Add integration coverage for update discovery and install-now/defer behavior in `tests/PrecisionDash.Adapters.Integration/AutoUpdateFlowTests.cs`

### Implementation for User Story 2

- [x] T022 [P] [US2] Implement GitHub release discovery in `src/PrecisionDash.Adapters.Update.GitHub/GitHubReleaseFeedClient.cs`
- [x] T023 [P] [US2] Implement update download and signature verification adapters in `src/PrecisionDash.Adapters.Update.Windows/UpdatePackageDownloader.cs` and `src/PrecisionDash.Adapters.Update.Windows/SignatureVerifier.cs`
- [x] T024 [US2] Implement release check and staged download orchestration in `src/PrecisionDash.Application/UseCases/CheckForUpdatesUseCase.cs` and `src/PrecisionDash.Application/UseCases/DownloadAndStageUpdateUseCase.cs`
- [x] T025 [US2] Implement verification and prompt/install orchestration in `src/PrecisionDash.Application/UseCases/VerifyUpdateUseCase.cs` and `src/PrecisionDash.Application/UseCases/PromptAndInstallUpdateUseCase.cs`
- [x] T026 [US2] Implement the application update service façade in `src/PrecisionDash.Application/UseCases/UpdateService.cs`
- [x] T027 [US2] Surface automatic update checks and install-now/defer prompts in `src/PrecisionDash.App/WindowsStartup.cs`
- [x] T042 [P] [US2] Parse release notes from the `ReleaseDescriptor` and include them in the install-now/defer prompt in `src/PrecisionDash.App/WindowsStartup.cs`

**Checkpoint**: An installed PrecisionDash build can discover, download, and apply a newer GitHub release while preserving a user-controlled install moment.

---

## Phase 5: User Story 3 - Safe and Predictable Update Experience (Priority: P3)

**Goal**: Keep the installed app usable through offline, invalid-signature, and install-failure scenarios while exposing clear non-blocking status.

**Independent Test**: Simulate network failures, invalid signatures, and install failures; confirm the current installed version remains launchable and update status is clearly reported.

### Tests for User Story 3

- [x] T028 [P] [US3] Add unit coverage for failure-safe update state handling in `tests/PrecisionDash.Application.Unit/UpdateFailureHandlingTests.cs`
- [x] T029 [P] [US3] Add integration coverage for offline, invalid-signature, and failed-install recovery in `tests/PrecisionDash.Adapters.Integration/UpdateFailureRecoveryTests.cs`

### Implementation for User Story 3

- [x] T030 [P] [US3] Add `Polly` retry and backoff policies for release fetch and download failures in `src/PrecisionDash.Adapters.Update.GitHub/GitHubReleaseFeedClient.cs` and `src/PrecisionDash.Adapters.Update.Windows/UpdatePackageDownloader.cs`
- [x] T031 [P] [US3] Implement structured update lifecycle logging in `src/PrecisionDash.Adapters.Update.Windows/UpdateLifecycleLogger.cs`
- [x] T032 [US3] Persist deferred and failed update state in `src/PrecisionDash.Adapters.Update.Windows/InstalledApplicationStore.cs` and `src/PrecisionDash.Domain/Updates/UpdateTransaction.cs`
- [x] T033 [US3] Surface non-blocking update failure status without affecting overlay interaction in `src/PrecisionDash.App/WindowsStartup.cs` and `src/PrecisionDash.App/StartupLog.cs`
- [x] T038 [P] [US3] Handle rate-limited and temporarily unavailable GitHub API responses gracefully in `src/PrecisionDash.Adapters.Update.GitHub/GitHubReleaseFeedClient.cs`
- [x] T039 [P] [US3] Handle missing or unreadable installed version metadata gracefully in `src/PrecisionDash.Adapters.Update.Windows/InstalledApplicationStore.cs`
- [x] T040 [P] [US3] Handle absence of a compatible Windows installer asset in the current release in `src/PrecisionDash.Adapters.Update.GitHub/GitHubReleaseFeedClient.cs` and `src/PrecisionDash.Application/UseCases/CheckForUpdatesUseCase.cs`
- [x] T041 [P] [US3] Detect and surface insufficient user privileges for install and update operations in `src/PrecisionDash.Adapters.Update.Windows/PackageInstaller.cs` and `src/PrecisionDash.App/WindowsStartup.cs`

**Checkpoint**: Update failures are safe, diagnosable, and non-destructive, with the installed app remaining usable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate cross-story evidence, runtime constraints, and release documentation.

- [x] T034 [P] Refresh install/update validation steps and evidence capture in `specs/002-packaged-auto-update/quickstart.md`
- [x] T035 [P] Capture artifact size evidence and packaged-delivery rationale in `specs/002-packaged-auto-update/quickstart.md` and `specs/002-packaged-auto-update/plan.md`
- [x] T036 [P] Reconcile published artifact expectations with the implementation in `specs/002-packaged-auto-update/contracts/release-package-contract.md` and `specs/002-packaged-auto-update/contracts/update-service-port.md`
- [x] T037 Verify runtime-budget, hot-path allocation, and click-through regression coverage after update integration in `tests/PrecisionDash.Adapters.Integration/DeterministicStartupTests.cs` and `tests/PrecisionDash.Adapters.Integration/TelemetryLifecycleLoggingTests.cs`
- [x] T043 Verify preferred Native AOT single-file payload path succeeds where technically compatible, or confirm the packaged Windows exception is documented with technical rationale and size evidence in `specs/002-packaged-auto-update/quickstart.md` and `specs/002-packaged-auto-update/plan.md` (CC-001 gate)
- [x] T044 [P] Run `tests/PrecisionDash.Domain.Unit/` and confirm `TelemetryMath` and `PhysicsEngine` unit test coverage remains at 100%; block merge if regressed (CC-004 gate)
- [ ] T045 [P] Record SC-002 and SC-003 threshold measurement outcomes against real update check and install results in `specs/002-packaged-auto-update/quickstart.md`; note SC-004 pilot reduction rate is a post-release business metric outside implementation scope

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: No dependencies; start immediately.
- **Phase 2: Foundational**: Depends on Phase 1 and blocks all user story work.
- **Phase 3: User Story 1**: Depends on Phase 2; delivers the MVP installed packaging flow.
- **Phase 4: User Story 2**: Depends on Phase 2 and the packaged delivery baseline from User Story 1.
- **Phase 5: User Story 3**: Depends on Phase 2 and the update flow established in User Story 2.
- **Phase 6: Polish**: Depends on the user stories you intend to ship.

### User Story Dependencies

- **US1 (P1)**: No dependencies beyond the Foundational phase.
- **US2 (P2)**: Depends on US1 because update orchestration requires installed-package identity and published packaged artifacts.
- **US3 (P3)**: Depends on US2 because failure handling and safe recovery build on the update discovery/install path.

### Within Each User Story

- Write the listed tests first and confirm they fail before implementation.
- Implement adapters before wiring them into application use cases.
- Complete application orchestration before surfacing behavior in `PrecisionDash.App`.
- Do not mark a story complete until its independent test passes.

## Parallel Opportunities

- **Setup**: T003 and T004 can run in parallel after T001 and T002 begin scaffolding.
- **Foundational**: T007, T008, T010, and T011 can run in parallel after T006 and T009 establish the base update model and service contract.
- **US1**: T013 and T014 can run together; T015 and T016 can run together after the tests exist.
- **US2**: T020 and T021 can run together; T022 and T023 can run together before orchestration tasks T024-T027; T042 can run in parallel with T027.
- **US3**: T028 and T029 can run together; T030 and T031 can run together before T032 and T033; T038, T039, T040, and T041 can run in parallel once T033 is complete.
- **Polish**: T034, T035, T036, T043, T044, and T045 can run in parallel once implementation is stable.

## Parallel Example: User Story 1

```text
T013 [US1] Add contract coverage for packaged release asset naming and metadata in tests/PrecisionDash.Contracts/ReleasePackageContractTests.cs
T014 [US1] Add integration coverage for packaged install and Start Menu launch expectations in tests/PrecisionDash.Adapters.Integration/InstalledPackagingStartupTests.cs

T015 [US1] Implement installed application metadata persistence in src/PrecisionDash.Adapters.Update.Windows/InstalledApplicationStore.cs
T016 [US1] Implement the Windows package installer adapter in src/PrecisionDash.Adapters.Update.Windows/PackageInstaller.cs
```

## Parallel Example: User Story 2

```text
T020 [US2] Add contract coverage for GitHub release descriptor parsing and version selection in tests/PrecisionDash.Contracts/GitHubReleaseDescriptorContractTests.cs
T021 [US2] Add integration coverage for update discovery and install-now/defer behavior in tests/PrecisionDash.Adapters.Integration/AutoUpdateFlowTests.cs

T022 [US2] Implement GitHub release discovery in src/PrecisionDash.Adapters.Update.GitHub/GitHubReleaseFeedClient.cs
T023 [US2] Implement update download and signature verification adapters in src/PrecisionDash.Adapters.Update.Windows/UpdatePackageDownloader.cs and src/PrecisionDash.Adapters.Update.Windows/SignatureVerifier.cs
```

## Parallel Example: User Story 3

```text
T028 [US3] Add unit coverage for failure-safe update state handling in tests/PrecisionDash.Application.Unit/UpdateFailureHandlingTests.cs
T029 [US3] Add integration coverage for offline, invalid-signature, and failed-install recovery in tests/PrecisionDash.Adapters.Integration/UpdateFailureRecoveryTests.cs

T030 [US3] Add Polly retry and backoff policies for release fetch and download failures in src/PrecisionDash.Adapters.Update.GitHub/GitHubReleaseFeedClient.cs and src/PrecisionDash.Adapters.Update.Windows/UpdatePackageDownloader.cs
T031 [US3] Implement structured update lifecycle logging in src/PrecisionDash.Adapters.Update.Windows/UpdateLifecycleLogger.cs
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate the packaged install and Start Menu launch flow on Windows.
5. Stop here if the immediate goal is to eliminate manual zip extraction.

### Incremental Delivery

1. Deliver US1 to establish installable packaging.
2. Add US2 to automate update discovery and install orchestration.
3. Add US3 to harden failure handling and user-visible status.
4. Finish with Phase 6 evidence capture and release validation.

### Parallel Team Strategy

1. One developer completes Phase 1 and Phase 2 scaffolding.
2. After the foundation is ready:
   - Developer A can own US1 packaging and installer work.
   - Developer B can own US2 release discovery and update orchestration.
   - Developer C can own US3 failure handling and logging once US2 contracts stabilize.

## Notes

- `[P]` tasks are safe to run in parallel because they target different files and do not depend on unfinished work.
- `[US1]`, `[US2]`, and `[US3]` labels map each task back to the user stories in `spec.md`.
- Each user story is independently testable at its checkpoint.
- Package size remains an evidence-and-justification concern; do not trade away correct Windows packaging behavior to satisfy an artificial size threshold.
