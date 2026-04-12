# Implementation Plan: Adaptive UI Layout & LED Collision Avoidance

**Branch**: `015-adaptive-ui-led-collision` | **Date**: 2026-04-12 | **Spec**: [specs/015-adaptive-ui-led-collision/spec.md](spec.md)
**Input**: Feature specification from `/specs/015-adaptive-ui-led-collision/spec.md`

## Summary
Migrate session data to raw iRacing SDK sources (`SessionLaps`, `SessionTimeRemain`), expand UI containers to rectangles (120x60), and reposition the RPM LED array with dynamic scaling to prevent overlap, while enforcing "On-Track Only" visibility logic.

## Technical Context

**Language/Version**: TypeScript 5.9+, React 19.x  
**Primary Dependencies**: irsdk-node v4.x, Vite 8.x  
**Storage**: N/A  
**Testing**: Storybook v8, Mock Telemetry Scenarios  
**Target Platform**: Windows (iRacing)  
**Project Type**: Desktop-app (Electron)  
**Performance Goals**: 60Hz Telemetry Polling, zero UI latency  
**Constraints**: 10px LED/UI buffer, click-through transparency  
**Scale/Scope**: Single-screen overlay

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Personal Utility First**: Directly addresses a visibility issue for wide-dash cars.
- [x] **Solo Developer Workflow**: Coarse-grained implementation tasks designed for a single `/speckit.implement` pass.
- [x] **Performance is the Product**: Uses raw SDK values directly, reducing computation overhead.
- [x] **Pragmatic Testing**: Verified via Mock Scenarios and Storybook.
- [x] **Windows-Native Simplicity**: Maintains existing Electron/iRacing SDK stack.
- [x] **Hexagonal Architecture**: Logic remains in domain/application layers.

## Specialist Consultation

- [x] **Telemetry Impact?**: Consulted **@telemetry-expert** for `SessionLaps` and `IsOnTrack` SDK mappings.
- [x] **UI/UX Changes?**: Consulted **@ui-stylist** for rectangular geometry and "Safe Zone" calculations.

## Project Structure

### Documentation (this feature)

```text
specs/015-adaptive-ui-led-collision/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec validation
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── telemetry/
│   │   ├── types.ts     # Update TelemetrySnapshot
│   │   └── lap-count.ts # Update with raw SDK logic
│   └── rev-strip/
│       └── types.ts     # Update with geometry metadata
├── application/
│   └── use-cases/
│       ├── compose-ribbon.ts    # Format session strings
│       └── compose-rev-strip.ts # Calculate dynamic offsets
├── adapters/
│   └── telemetry-iracing/
│       └── iracing-telemetry-provider.ts # Map raw variables
└── renderer/
    └── components/
        └── Overlay.tsx # Rectangular boxes, visibility, dynamic scaling
```

**Structure Decision**: Single project (DEFAULT).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       |            |                                     |
