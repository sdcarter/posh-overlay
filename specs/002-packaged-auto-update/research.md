# Research: Installed Packaging and Auto-Update

## Decision 1: Windows delivery uses signed MSIX packaging plus App Installer manifest

- Decision: Package PrecisionDash as a signed MSIX and publish a companion App Installer manifest for Windows-native installation and upgrade orchestration.
- Rationale: MSIX provides Start Menu integration, explicit install identity, clean upgrade semantics, and a built-in trust model that aligns with the requirement to verify signed payloads before installation.
- Alternatives considered:
  - Continue shipping zip archives: rejected because it does not provide installation identity, Start Menu presence, or ergonomic updates.
  - MSI-only delivery: rejected because update orchestration and package discovery would require more custom machinery for a GitHub-hosted feed.
  - Squirrel-style updater packaging: rejected because the design should stay close to Windows-native installation and signing primitives.

## Decision 2: GitHub Releases remains the canonical update source

- Decision: Use GitHub Releases as the single source of truth for version discovery and installer asset hosting.
- Rationale: The repository already publishes tagged release assets there, and the user explicitly wants iteration to flow through GitHub-hosted packages rather than manual zip retrieval.
- Alternatives considered:
  - Separate package feed or CDN: rejected because it adds operational overhead and diverges from the current release workflow.
  - In-repo artifact storage only: rejected because update discovery requires a stable user-accessible release surface.

## Decision 3: Update behavior is auto-download followed by user-prompted install

- Decision: On detecting a newer compatible release, the app downloads the signed update payload in the background and then prompts the user to install now or defer.
- Rationale: This reduces iteration friction while avoiding silent replacement during active driving sessions or while the app is in use.
- Alternatives considered:
  - Silent automatic install: rejected because it risks interrupting active use at unsafe times.
  - Notify-only flow: rejected because it leaves too much of the current manual update friction in place.
  - Manual browser handoff: rejected because it defeats the purpose of in-app update automation.

## Decision 4: Signature verification is mandatory and fail-closed

- Decision: Require cryptographic signature validation of installer/update payloads before the package can be applied, and abort installation when validation fails.
- Rationale: Auto-update introduces a supply-chain trust boundary; signed-payload enforcement is the most important control for preventing tampered or spoofed releases from being installed.
- Alternatives considered:
  - Trust GitHub release origin only: rejected because origin trust without payload validation is insufficient.
  - Hash-only verification: rejected because it does not establish publisher identity.

## Decision 5: Artifact size is a measured tradeoff, not a hard-governance ceiling

- Decision: Preserve smallest-practical payload discipline for the PrecisionDash executable and installer, but treat artifact size as an evidence-and-justification concern rather than a hard threshold that can override a technically correct packaging/update solution.
- Rationale: Installer metadata, signing material, and update descriptors can legitimately increase package size; correct delivery and update behavior matters more than forcing a size target that may not be technically achievable.
- Alternatives considered:
  - Keep a fixed hard size ceiling: rejected because it can force the wrong deployment design when installer/update requirements require larger artifacts.
  - Ignore artifact size entirely: rejected because release footprint still matters and must be measured, minimized, and justified.

## Decision 6: Update orchestration belongs in application control flow, not the telemetry/render path

- Decision: Add a dedicated update coordinator and release descriptor model in the application layer, with installer interaction and release metadata access isolated behind ports/adapters.
- Rationale: This preserves the current hot-path isolation and makes packaging/update behavior testable without entangling it with simulator or rendering code.
- Alternatives considered:
  - Place update logic directly in app startup UI code: rejected because it would couple policy, network, and install operations to shell/bootstrap code.
  - Handle updates entirely in CI without app awareness: rejected because the user explicitly wants the installed app to discover and apply updates.
