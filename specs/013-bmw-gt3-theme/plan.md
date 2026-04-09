# Implementation Plan: BMW M4 GT3 Styling

**Branch**: `013-bmw-gt3-theme` | **Date**: 2026-04-09 | **Spec**: [specs/013-bmw-gt3-theme/spec.md](specs/013-bmw-gt3-theme/spec.md)
**Input**: Feature specification from `/specs/013-bmw-gt3-theme/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Pivot visual styling to a BMW M4 GT3 Motorsport aesthetic. Layout is implemented as a rigid 3-column flex structure to ensure the central RPM/Speed/Gear stack is mathematically locked to the center, with side elements (Position, Laps) occupying equal flexible columns. 

## Technical Context

**Language/Version**: TypeScript 5.9+  
**Primary Dependencies**: React 19.x, Vanilla CSS, Vite 8.x  
**Storage**: N/A  
**Testing**: Storybook
**Target Platform**: Electron (Windows target)
**Project Type**: Desktop UI App (Racing Overlay)
**Performance Goals**: <= 16ms render loop (60fps)
**Constraints**: Keep UI entirely presentational, centralize math to domain. Do not exceed resource budget.
**Scale/Scope**: Rendering layers inside a transparent borderless Chrome window

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Personal Utility First**: Yes, addresses a direct visual preference for racing.
- **Solo Developer Workflow**: Yes, design can be implemented in a single pass.
- **Performance is the Product**: Yes, explicitly avoiding heavy UI logic in React.
- **Pragmatic Testing**: Yes, utilizing Storybook and Mock telemetry rather than heavy UI testing suites.
- **Windows-Native Simplicity**: Yes, using CSS variables rather than introducing a heavy styling framework.
- **Security via Transparency**: Yes, clear separation of data vs styling layers.
- **Hexagonal Architecture**: Yes, data translation remains strictly in `src/domain/rev-strip`.

## Specialist Consultation

- [x] **Telemetry Impact?**: Consulted **@telemetry-expert** to enforce universal mapping in the domain instead of hardcoded car profiles.
- [x] **UI/UX Changes?**: Consulted **@ui-stylist** to lock in the absolute `0px` border-radius and exact color HEX mapping.

## Project Structure

### Documentation (this feature)

```text
specs/013-bmw-gt3-theme/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Documenting UI/Telemetry decisions
├── data-model.md        # Documenting explicit Domain state changes
├── quickstart.md        # How to test via Storybook
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── domain/
│   └── rev-strip/       # Update logic to consume universal Shift Indicator telemetry
├── renderer/
│   ├── index.css        # Define exact BMW CSS variables and base tokens
│   └── components/
│       ├── Overlay.tsx  # Apply new 0px structures and 1px white border capsules
│       └── RevStrip.tsx # Apply rectangular M-Sport blocks
```

**Structure Decision**: Standard Hexagonal layout. Layout follows a 3-column architecture in `src/renderer/components/Overlay.tsx`. RPM logic preserves vehicle-specific `lovely-car-data` profiles (mapped in `src/domain/telemetry/car-profiles.ts`) to ensure shift lights behave realistically for each car while applying the new M-Sport rectangular visual theme.

## Complexity Tracking

*(No constitution violations to track)*
