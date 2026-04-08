# Implementation Plan: Add Storybook

**Branch**: `012-add-storybook` | **Date**: 2026-04-08 | **Spec**: [Link to spec](../spec.md)
**Input**: Feature specification from `/specs/012-add-storybook/spec.md`

## Summary

Add Storybook 8 with the `@storybook/react-vite` framework as a visual development environment for the Overlay component, enabling iteration without Electron. The setup will be minimal, feeding the story direct mock data from the `MockTelemetryProvider` for multiple car scenarios.

## Technical Context

**Language/Version**: TypeScript 5.9+  
**Primary Dependencies**: Vite 8.x, React 19.x, `storybook` (v8), `@storybook/react-vite`, `@storybook/react`  
**Storage**: N/A  
**Testing**: Storybook visual validation
**Target Platform**: Browser (Dev tooling only)
**Project Type**: Desktop app overlay
**Performance Goals**: Fast startup time for Storybook  
**Constraints**: Keep dev dependencies and config minimal. No disruption to `npm run build` or the electron package.
**Scale/Scope**: ~3 core stories (RPM sweeps for Mazda, BMW, SF Lights) initially.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Personal Utility First**: Yes. Simplifies local dev iteration.
- **Performance is the Product**: Yes. This is a dev-only tool and won't affect runtime FPS.
- **Pragmatic Testing**: Yes. Focuses on visual validation (data mapping).
- **Windows-Native Simplicity**: Yes. Does not affect production Windows deployment.
- **Minimal Dependencies**: Yes. Only adding necessary devDependencies for Storybook, avoiding extraneous addons.

## Project Structure

### Documentation (this feature)

```text
specs/012-add-storybook/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
```

### Source Code (repository root)

```text
.storybook/
├── main.ts
└── preview.ts

src/renderer/
└── Overlay.stories.tsx
```

**Structure Decision**: A standard `.storybook` config directory at the root, with a `.stories.tsx` file placed alongside the React component it tests (`src/renderer/Overlay.stories.tsx`).

## Complexity Tracking

None. No unjustifiable deviations from the constitution. No runtime dependencies added.
