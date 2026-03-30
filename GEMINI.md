# GEMINI.md

## Project: PoshDash (posh-overlay)

### Context & Goals
PoshDash is a personal iRacing telemetry overlay project. It provides a transparent, always-on-top overlay for RPM rev lights, incident counts, and other live data.
- **Primary Platform:** Windows (for iRacing), but supports macOS/Linux via mock telemetry.
- **Goal:** Minimal, focused, and high-performance overlay.

### Architecture: Hexagonal (Ports-and-Adapters)
Strict adherence to the hexagonal architecture is required.
- **`src/domain/`**: Pure TypeScript. Contains business logic, telemetry types, and formatting rules. **No dependencies** on application or adapters.
- **`src/application/`**: Use cases and port (interface) definitions.
- **`src/adapters/`**: Implementations of ports (iRacing SDK, Mock, GitHub Release).
- **`src/main/`**: Electron main process and preload.
- **`src/renderer/`**: React UI components (Overlay, TelemetryGraph, etc.).

### Engineering Standards
- **Performance:** Maintain low overhead. Telemetry polling and IPC updates are tuned to ~60Hz (16ms) to match iRacing telemetry frequency and reduce CPU load.
- **Separation of Concerns:** All telemetry processing and state computation (RevStripState, RibbonState) must happen in the main process/use-cases. Renderer should be purely presentational.
- **TypeScript:** Use strict typing. Avoid `any` where possible.
- **React:** Use functional components and hooks.
- **Naming:** Follow existing camelCase for variables/functions and PascalCase for components/types.
- **ESLint:** Adhere to the project's ESLint configuration (warn on `no-explicit-any` and `no-unused-vars` unless prefixed with `_`).
- **Imports:** Use explicit paths; ensure separation between domain, application, and adapters.

### Testing & Validation
- **Mocks:** Use the built-in mock telemetry system for development and validation, especially on non-Windows platforms.
- **Verification:** Always run `npm run lint` and `npm run build` to verify changes.
- **Reproduce:** For bug fixes, use/create a mock scenario to reproduce the issue before applying a fix.

### Tooling & Workflows
- **Speckit:** Use the integrated speckit commands (found in `.gemini/commands/`) for planning and task management.
- **Mocking:** Utilize `npm run mock:*` commands to test different car profiles and scenarios.
- **Auto-Update:** Be mindful of the `electron-updater` integration and GitHub release feed client.

### Mandates
- **No Sandbox:** I am running in a "no sandbox" environment. This means I have direct access to your local filesystem and shell. I will exercise extra caution when executing commands or modifying files.
- **Safety:** Never log or expose personal telemetry data or credentials if they appear.
- **Style:** Maintain the clean, "minimalist" aesthetic of the overlay.

## Recent Changes
- 003-add-speed-display: Added real-time speed display to the center stack.
- 004-session-sync-fix: Added `leaderFinished` detection to fix lap count glitches at the end of races.
