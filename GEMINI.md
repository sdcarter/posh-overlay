# GEMINI.md

## Project: PoshDash (posh-overlay)

### Context & Goals
iRacing telemetry overlay. Transparent, always-on-top. RPM, incidents, live data.
- **Platform:** Windows (native), macOS/Linux (mock).
- **Goal:** Minimal, high-perf.

### Architecture: Hexagonal
Strict ports-and-adapters.
- **`src/domain/`**: Pure TS. Logic, types, formatting. **No dependencies**.
- **`src/application/`**: Use cases, port interfaces.
- **`src/adapters/`**: Port implementations (iRacing SDK, Mock, GitHub).
- **`src/main/`**: Electron main + preload.
- **`src/renderer/`**: React UI. Presentational only.

### Engineering Standards
- **Performance:** 60Hz (16ms) polling/IPC. Low overhead.
- **Logic:** Telemetry processing + state computation in main/use-cases.
- **TS/React:** Strict typing. Functional components, hooks.
- **Style:** camelCase (vars/fns), PascalCase (types/comps). ESLint rules.
- **Imports:** Explicit paths. Enforce layer separation.

### Testing & Validation
- **Mocks:** Use mock telemetry for non-Windows dev.
- **Checks:** Run `npm run lint` + `npm run build`.
- **Reproduce:** Create mock scenario before fixing bugs.

### Tooling & Workflows
- **Speckit:** Use commands in `.gemini/commands/`.
- **Mocking:** `npm run mock:*` for car profiles/scenarios.
- **Auto-Update:** Mind `electron-updater` + GitHub client.

### Mandates
- **Environment:** No sandbox. Direct FS/shell access. Use caution.
- **Security:** No logging telemetry/creds.
- **Aesthetic:** Clean, minimalist.

## History & Regressions
Consult [CHANGELOG.md](./CHANGELOG.md) for full history. Check there when investigating regressions.

## Active Technologies
- TS 5.9, Vite 8, React 19, Storybook 8 (012).
