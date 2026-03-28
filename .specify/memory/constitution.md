<!--
Sync Impact Report
- Version change: 4.0 → 5.0.0
- List of modified principles:
  - Hexagonal Architecture → (Moved to Technical Architecture)
  - ESM-First → (Moved to Technical Architecture)
  - Type Safety → (Moved to Technical Architecture)
  - Transparent Overlay Integrity → (Moved to Technical Architecture)
  - Minimal Dependencies → (Moved to Technical Architecture)
  - Clean Separation of Concerns → (Moved to Technical Architecture)
- Added sections:
  - Core Principles (New set of 5 focus principles)
- Removed sections:
  - None (reorganized)
- Templates requiring updates:
  - ✅ Updated/Validated: .specify/templates/plan-template.md, .specify/templates/spec-template.md, .specify/templates/tasks-template.md
- Follow-up TODOs: None
-->

# posh-overlay Constitution

## Core Principles

### I. Personal Utility First
The primary goal is an overlay that works perfectly for my iRacing setup. If a community request complicates my personal use, it’s out of scope. The project exists to solve a specific personal need; community sharing is a secondary benefit.

### II. Performance is the Product
Since this is a racing overlay, frame-time and system resource usage are the most critical 'features.' Every planned change must evaluate the impact on game FPS. The overlay must never cause stutter or input lag in the simulation.

### III. Pragmatic Testing
No high-overhead automated UI testing suites. Focus on 'Data Integrity'—ensure the telemetry coming from the iRacing SDK is mapped correctly. If the telemetry data is solid, the UI 'looks' are secondary. Verification should prioritize raw data accuracy over visual regression testing.

### IV. Windows-Native Simplicity
Ensure the installation and startup are low-friction. I want to spend my time racing, not troubleshooting my overlay. Keep the stack as thin as possible and avoid unnecessary abstraction layers that complicate the Windows deployment.

### V. Security via Transparency
Since this interacts with game telemetry, keep the code simple and readable so users can see exactly how their data is handled. No 'black box' logic or complex obfuscation. Security is maintained through simple, auditable code.

## Technical Architecture & Standards

### Hexagonal Architecture
All code follows a ports-and-adapters (hexagonal) architecture. Domain logic lives in `src/domain/` with zero framework dependencies. Application use cases live in `src/application/` and depend only on domain types and port interfaces. Adapters in `src/adapters/` implement ports for external systems (iRacing SDK, GitHub API). The Electron main process (`src/main/`) and React renderer (`src/renderer/`) are infrastructure concerns that wire adapters to use cases.

### ESM-First
The project uses native ES modules (`"type": "module"` in package.json). All main-process and domain code compiles to ESM via `NodeNext` module resolution. Use `import`/`export` exclusively — never `require()`. The sole exception is the Electron preload script (`src/main/preload.cts`) which must be CommonJS due to Electron's sandbox requirement.

### Type Safety
TypeScript strict mode is enabled across all tsconfig files. No `any` types in production code — use explicit interfaces, `unknown` with type narrowing, or `Record<string, unknown>` for dynamic data.

### Transparent Overlay Integrity
The app is a fullscreen transparent always-on-top Electron window. When locked, the window is click-through (`setIgnoreMouseEvents(true)`). When unlocked, the window accepts input and the overlay is draggable/resizable. Never toggle `resizable`, `movable`, or `focusable` after window creation to avoid Windows DWM chrome recomposition issues.

### Minimal Dependencies
Keep the dependency tree small. Prefer built-in Node.js and Electron APIs over third-party packages. Every new dependency must justify its inclusion based on Principle IV (Simplicity).

### Clean Separation of Concerns
React components in `src/renderer/` are purely presentational. All telemetry processing, rev-strip computation, and ribbon formatting happen in domain/application layers in the main process.

## Technology Stack

- Runtime: Electron 40.x (Chromium-based, Windows target)
- Language: TypeScript 5.9+, strict mode, ESM throughout
- Module system: Native ES modules (`"type": "module"`, `NodeNext` resolution)
- Renderer: React 19.x, Vite 8.x (Rolldown bundler)
- Main process: Compiled with `tsc` to ESM (`NodeNext` module resolution)
- Telemetry: `irsdk-node` v4.x (optional, Windows-only native addon)
- Car data: [Lovely Sim Racing car data](https://github.com/Lovely-Sim-Racing/lovely-car-data), fetched at build time
- Packaging: electron-builder 26.x, NSIS installer for Windows
- Auto-update: electron-updater via GitHub Releases (`--publish always`)
- Linting: ESLint 9.x flat config (`eslint.config.mjs`)
- CI/CD: GitHub Actions (lint + build on push, build + publish on `v*` tags)

## Project Structure

```
src/
  domain/          Pure TypeScript domain logic (no framework deps)
    telemetry/     Telemetry types, car profiles, lovely-car-data.json (build artifact)
    rev-strip/     Per-LED evaluation, flash modes
    ribbon/        Incident/bias/TC/ABS formatting
    updates/       Release descriptor types and factories
  application/     Use cases and port interfaces
    use-cases/     composeRevStrip, composeRibbon
    ports/         TelemetryProvider, ReleaseFeedClient interfaces
  adapters/        Port implementations
    telemetry-iracing/   iRacing SDK adapter (irsdk-node, optional)
    telemetry-mock/      Mock telemetry for development
    update-github/       GitHub release feed client
  main/            Electron main process (index.ts) + preload (preload.cts)
  renderer/        React UI (App, Overlay, RevStrip)
scripts/
  fetch-car-data.mjs   Fetches Lovely Sim Racing car data at build time
assets/
  icon.png             Source icon
  icon-256.png         App icon for electron-builder
  tray-icon.png        System tray icon
```

## Rev Strip (LED) Rules

- Each LED has an absolute RPM threshold from Lovely car data — LED lights when `rpm >= threshold`
- LED colors, count, and growth pattern are per-car (sequential, symmetrical, or any pattern the data defines)
- Spacer LEDs (`#00000000` in Lovely data) render as transparent and are excluded from flash
- At redline RPM, all non-spacer LEDs flash between the car's redline color and white
- Redline flash is suppressed in top gear
- Pit limiter flashes all LEDs yellow
- Car path lookup is normalized to match iRacing `CarPath` against Lovely `carId`

## Renderer Architecture

- `Overlay.tsx` is the top-level renderer component — it renders the capsule layout, rev dots, pills, AND the ribbon inline.
- There is no separate Ribbon component. The ribbon is rendered directly in `Overlay.tsx` as `lowerItems`.
- `Overlay.tsx` builds `lowerItems` from `frame.ribbon.*` fields and renders them as a horizontal bar with `|` separators.
- Any new ribbon data must be: added to `TelemetrySnapshot` → computed in `composeRibbon` → added to `RibbonState` → rendered in `Overlay.tsx`.

## Ribbon Rules

- Incidents, brake bias, traction control, ABS displayed in the lower ribbon strip
- Fuel laps remaining displayed with a colored status dot (green/yellow/red)
- Settings that return null from telemetry (car doesn't support them) are hidden
- Ribbon has `flexShrink: 0` — it never gets compressed by the rev strip
- All text scales proportionally with overlay height

## Coding Standards

- All source files use named exports (no default exports)
- Import paths in main-process code use `.js` extensions
- JSON imports use `with { type: 'json' }` import attributes
- ESLint must pass with zero warnings before any commit
- TypeScript must compile cleanly with no errors
- Inline styles in React components for self-contained widgets
- Platform-specific dependencies go in `optionalDependencies`

## Electron Window Rules

- BrowserWindow is created once at startup spanning the primary display
- Properties: `frame: false`, `transparent: true`, `alwaysOnTop: true`, `skipTaskbar: true`, `resizable: false`, `movable: false`, `focusable: true`
- `setAlwaysOnTop(true, 'screen-saver', 1)` for maximum z-order
- Lock/unlock toggles only `setIgnoreMouseEvents(boolean)`
- Overlay position and size persist to `overlay-layout.json`

## Auto-Update Rules

- `electron-updater` checks GitHub Releases 10 seconds after app start
- Downloads happen silently in the background
- Synchronous dialog prompts "Restart Now" or "Later" when ready
- Releases are triggered by pushing a `v*` tag

## Build Pipeline

- `npm run build` executes: fetch car data → compile TypeScript → bundle renderer
- Release builds run on `windows-latest`
- CI runs lint then build on every push

## Versioning and Release

- Semantic versioning: `MAJOR.MINOR.PATCH`
- Version in `package.json` must match the git tag
- Always bump `package.json` version before creating the git tag

## Git Identity

- All commits authored as `sdcarter <sdcarter@users.noreply.github.com>`
- Repo-level git config enforces this

## Governance

Changes to this constitution require updating this file and committing with a clear rationale in the commit message. Amendments must be evaluated against the five Core Principles.

**Version**: 5.0.0 | **Ratified**: 2026-03-25 | **Last Amended**: 2026-03-25
