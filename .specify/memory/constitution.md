# PoshDash Constitution

## Core Principles

### Hexagonal Architecture
All code follows a ports-and-adapters (hexagonal) architecture. Domain logic lives in `src/domain/` with zero framework dependencies. Application use cases live in `src/application/` and depend only on domain types and port interfaces. Adapters in `src/adapters/` implement ports for external systems (iRacing SDK, GitHub API). The Electron main process (`src/main/`) and React renderer (`src/renderer/`) are infrastructure concerns that wire adapters to use cases.

### ESM-First
The project uses native ES modules (`"type": "module"` in package.json). All main-process and domain code compiles to ESM via `NodeNext` module resolution. Use `import`/`export` exclusively — never `require()`. The sole exception is the Electron preload script (`src/main/preload.cts`) which must be CommonJS due to Electron's sandbox requirement. Use `import.meta.url` and `fileURLToPath` instead of `__dirname`/`__filename`. CJS-only dependencies (e.g. `electron-updater`) must use default import with destructuring: `import mod from 'pkg'; const { named } = mod;`.

### Type Safety
TypeScript strict mode is enabled across all tsconfig files. No `any` types in production code — use explicit interfaces, `unknown` with type narrowing, or `Record<string, unknown>` for dynamic data. Prefer importing types from well-typed packages over hand-rolled type declarations.

### Transparent Overlay Integrity
The app is a fullscreen transparent always-on-top Electron window. The overlay widget is positioned via CSS `position: absolute` within the transparent window. When locked, the window is click-through (`setIgnoreMouseEvents(true)`). When unlocked, the window accepts input (`setIgnoreMouseEvents(false)`) and the overlay is draggable/resizable via React mouse events. Never use `{ forward: true }` options on `setIgnoreMouseEvents` — use plain boolean toggling only. Never toggle `resizable`, `movable`, or `focusable` after window creation — these trigger Windows DWM chrome recomposition on transparent windows.

### Minimal Dependencies
Keep the dependency tree small. Prefer built-in Node.js and Electron APIs over third-party packages. Every new dependency must justify its inclusion. Windows-only native addons (like `irsdk-node`) go in `optionalDependencies` so CI and development work cross-platform.

### Clean Separation of Concerns
React components in `src/renderer/` are purely presentational — they receive data via IPC and render it. All telemetry processing, rev-strip computation, and ribbon formatting happen in domain/application layers in the main process. The preload script (`src/main/preload.cts`) exposes a minimal `electronAPI` surface via `contextBridge`.

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
- Linting: ESLint 9.x flat config (`eslint.config.mjs`) with typescript-eslint and react-hooks plugin
- CI/CD: GitHub Actions (actions/checkout@v6, actions/setup-node@v5) — lint + build on push, build + publish on `v*` tags

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
  renderer/        React UI (App, Overlay, RevStrip, Ribbon)
scripts/
  fetch-car-data.mjs   Fetches Lovely Sim Racing car data at build time
assets/
  icon.png             Source icon (1333x1333)
  icon-256.png         App icon for electron-builder
  tray-icon.png        System tray icon (32x32)
```

## Rev Strip (LED) Rules

- Each LED has an absolute RPM threshold from Lovely car data — LED lights when `rpm >= threshold`
- LED colors, count, and growth pattern are per-car (sequential, symmetrical, or any pattern the data defines)
- Spacer LEDs (`#00000000` in Lovely data) render as transparent and are excluded from flash
- At redline RPM (`ledRpm[gear][0]`), all non-spacer LEDs flash between the car's redline color (`ledColor[0]`) and white at the car's `redlineBlinkInterval`
- Pit limiter flashes all LEDs yellow
- LEDs render as circles, scaled proportionally to the overlay width
- Cars without Lovely data fall back to a 10-LED green→yellow→red gradient with ratio-based thresholds

## Ribbon Rules

- RPM counter displayed left-justified
- Incidents, brake bias, traction control, ABS displayed right-justified
- Settings that return null from telemetry (car doesn't support them) are hidden, not shown as dashes
- All text scales proportionally with overlay width via `em` units on a dynamic base font size

## Coding Standards

- All source files use named exports (no default exports)
- Import paths in main-process code use `.js` extensions (`NodeNext` resolution requires explicit extensions)
- JSON imports use `with { type: 'json' }` import attributes (ESM requirement)
- Renderer imports use bare specifiers (Vite resolves them)
- ESLint must pass with zero warnings (`--max-warnings 0`) before any commit
- TypeScript must compile cleanly with no errors on both `tsconfig.main.json` and `tsconfig.json`
- Inline styles in React components (no CSS files) — the overlay is a single self-contained widget
- Platform-specific dependencies go in `optionalDependencies` with dynamic `import()` and try/catch
- No `postinstall` scripts — electron-builder handles native dep rebuilding during `electron-builder build`

## Electron Window Rules

- BrowserWindow is created once at startup spanning the primary display
- Properties set at creation and never mutated: `frame: false`, `transparent: true`, `alwaysOnTop: true`, `skipTaskbar: true`, `resizable: false`, `movable: false`, `focusable: true`, `hasShadow: false`, `roundedCorners: false`
- `setAlwaysOnTop(true, 'screen-saver', 1)` for maximum z-order
- `Menu.setApplicationMenu(null)` to remove menu bar
- Lock/unlock toggles only `setIgnoreMouseEvents(boolean)` and sends IPC to renderer
- System tray provides show/hide, lock/unlock, update check, and exit
- Overlay position and size persist to `overlay-layout.json` in `app.getPath('userData')`

## Auto-Update Rules

- `electron-updater` checks GitHub Releases 10 seconds after app start
- Downloads happen silently in the background
- When ready, a synchronous dialog prompts "Restart Now" or "Later" with HTML-stripped release notes
- "Restart Now" calls `autoUpdater.quitAndInstall()`
- Releases are triggered by pushing a `v*` tag; CI builds and publishes with `--publish always`

## Build Pipeline

- `npm run build` executes: fetch car data → compile TypeScript → bundle renderer with Vite
- Car data (`lovely-car-data.json`) is a build artifact fetched from GitHub, not committed to git
- CI runs lint then build on every push (ubuntu-latest)
- Release builds run on windows-latest (required for native addon compilation and NSIS packaging)

## Versioning and Release

- Semantic versioning: `MAJOR.MINOR.PATCH`
- Version is maintained in `package.json` and must match the git tag
- All releases are published via `--publish always` (required for electron-updater)
- Release workflow runs on `windows-latest`

## Governance

Changes to this constitution require updating this file and committing with a clear rationale in the commit message.

**Version**: 3.0 | **Ratified**: 2026-03-22 | **Last Amended**: 2026-03-22
