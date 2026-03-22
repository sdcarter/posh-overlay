# PrecisionDash Constitution

## Core Principles

### Hexagonal Architecture
All code follows a ports-and-adapters (hexagonal) architecture. Domain logic lives in `src/domain/` with zero framework dependencies. Application use cases live in `src/application/` and depend only on domain types and port interfaces. Adapters in `src/adapters/` implement ports for external systems (iRacing SDK, GitHub API). The Electron main process (`src/main/`) and React renderer (`src/renderer/`) are infrastructure concerns that wire adapters to use cases.

### Type Safety
TypeScript strict mode is enabled across all tsconfig files. No `any` types in production code — use explicit interfaces, `unknown` with type narrowing, or `Record<string, unknown>` for dynamic data. Type declarations for untyped dependencies go in `src/types/`.

### Transparent Overlay Integrity
The app is a fullscreen transparent always-on-top Electron window. The overlay widget is positioned via CSS `position: absolute` within the transparent window. When locked, the window is click-through (`setIgnoreMouseEvents(true)`). When unlocked, the window accepts input (`setIgnoreMouseEvents(false)`) and the overlay is draggable/resizable via React mouse events. Never use `{ forward: true }` options on `setIgnoreMouseEvents` — use plain boolean toggling only. Never toggle `resizable`, `movable`, or `focusable` after window creation — these trigger Windows DWM chrome recomposition on transparent windows.

### Minimal Dependencies
Keep the dependency tree small. Prefer built-in Node.js and Electron APIs over third-party packages. Every new dependency must justify its inclusion. Current runtime dependencies are limited to `react`, `react-dom`, and `electron-updater`.

### Clean Separation of Concerns
React components in `src/renderer/` are purely presentational — they receive data via IPC and render it. All telemetry processing, rev-strip computation, and ribbon formatting happen in domain/application layers in the main process. The preload script (`src/main/preload.ts`) exposes a minimal `electronAPI` surface via `contextBridge`.

## Technology Stack

- Runtime: Electron 40.x (Chromium-based, Windows target)
- Language: TypeScript 5.x, strict mode
- Renderer: React 19.x, Vite 8.x (Rolldown bundler)
- Main process: Compiled with `tsc` to CommonJS (`Node16` module resolution)
- Packaging: electron-builder 26.x, NSIS installer for Windows
- Auto-update: electron-updater via GitHub Releases (non-draft, `releaseType: "release"`)
- Linting: ESLint 9.x flat config with typescript-eslint and react-hooks plugin
- CI/CD: GitHub Actions — lint + build on push, build + publish on `v*` tags

## Project Structure

```
src/
  domain/          Pure TypeScript domain logic (no framework deps)
    telemetry/     Telemetry types, car profiles
    rev-strip/     RPM segment evaluation, flash modes
    ribbon/        Incident/bias/TC formatting
    updates/       Release descriptor types and factories
  application/     Use cases and port interfaces
    use-cases/     composeRevStrip, composeRibbon
    ports/         TelemetryProvider, ReleaseFeedClient interfaces
  adapters/        Port implementations
    telemetry-iracing/   iRacing SDK adapter (node-irsdk)
    telemetry-mock/      Mock telemetry for development
    update-github/       GitHub release feed client
  main/            Electron main process + preload
  renderer/        React UI (App, Overlay, RevStrip, Ribbon)
  types/           Type declarations for untyped dependencies
```

## Coding Standards

- All source files use named exports (no default exports)
- Import paths in main-process code use `.js` extensions (Node16 resolution)
- Renderer imports use bare specifiers (Vite resolves them)
- ESLint must pass with zero warnings (`--max-warnings 0`) before any commit
- TypeScript must compile cleanly with no errors on both `tsconfig.main.json` and `tsconfig.json`
- Inline styles in React components (no CSS files) — the overlay is a single self-contained widget

## Electron Window Rules

- BrowserWindow is created once at startup spanning the primary display
- Properties set at creation and never mutated: `frame: false`, `transparent: true`, `alwaysOnTop: true`, `skipTaskbar: true`, `resizable: false`, `movable: false`, `focusable: true`, `hasShadow: false`, `roundedCorners: false`
- `setAlwaysOnTop(true, 'screen-saver', 1)` for maximum z-order
- `Menu.setApplicationMenu(null)` to remove menu bar
- Lock/unlock toggles only `setIgnoreMouseEvents(boolean)` and sends IPC to renderer
- System tray provides show/hide, lock/unlock, update check, and exit

## Auto-Update Rules

- `electron-updater` checks GitHub Releases 10 seconds after app start
- Downloads happen silently in the background
- When ready, a synchronous dialog prompts "Restart Now" or "Later"
- "Restart Now" calls `autoUpdater.quitAndInstall()`
- Releases are triggered by pushing a `v*` tag; CI builds and publishes the NSIS installer

## Versioning and Release

- Semantic versioning: `MAJOR.MINOR.PATCH`
- Version is maintained in `package.json` and must match the git tag
- All releases are non-draft GitHub Releases (required for electron-updater)
- CI runs on `windows-latest` for release builds

## Governance

Changes to this constitution require updating this file and committing with a clear rationale in the commit message.

**Version**: 1.0 | **Ratified**: 2026-03-22 | **Last Amended**: 2026-03-22
