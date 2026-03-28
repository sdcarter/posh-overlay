# Implementation Plan: Add Speed Display in km/h

**Branch**: `003-add-speed-display` | **Date**: 2026-03-28 | **Spec**: [specs/003-add-speed-display/spec.md](spec.md)
**Input**: Feature specification from `/specs/003-add-speed-display/spec.md`

## Summary
Add a real-time speed display in km/h to the telemetry row of the PoshDash overlay. The display will follow a horizontal `[Speed] | [RPM] | [Gear]` layout, with RPMs receiving visual emphasis via font size and a "high-impact" style, as requested for passion project performance and personal utility.

## Technical Context

**Language/Version**: TypeScript 5.9+, ESM-First  
**Primary Dependencies**: React 19, Electron 40, irsdk-node 4.x  
**Storage**: N/A  
**Testing**: Mock telemetry validation (`npm run mock`)  
**Target Platform**: Windows (Desktop App)
**Project Type**: Desktop-app (Electron)  
**Performance Goals**: 60 fps, low resource usage  
**Constraints**: <200ms p95 latency, transparent overlay integrity  
**Scale/Scope**: Personal utility project, single screen overlay

## Constitution Check

*GATE: Passed - Design adheres to Hexagonal Architecture, Performance-first, and Windows-Native Simplicity principles.*

1. **Hexagonal Architecture**: All data flows from `adapters/` through `domain/` to `renderer/`.
2. **Performance**: Minimal computation added (single float multiplication in adapter).
3. **Pragmatic Testing**: Verified via mock telemetry provider.
4. **Minimal Dependencies**: No new dependencies required.
5. **Transparency**: Simple, readable code in `Overlay.tsx`.

## Project Structure

### Documentation (this feature)

```text
specs/003-add-speed-display/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/          # Validation checklists
│   └── requirements.md
└── tasks.md             # To be created by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── domain/
│   └── telemetry/
│       └── types.ts            # Update TelemetrySnapshot
├── adapters/
│   ├── telemetry-iracing/
│   │   └── iracing-telemetry-provider.ts # Map Speed (m/s) to km/h
│   └── telemetry-mock/
│       └── mock-telemetry-provider.ts    # Add speed to mock scenarios
└── renderer/
    └── components/
        └── Overlay.tsx         # Update UI layout and fonts
```

**Structure Decision**: Standard hexagonal layout as defined in the Constitution. No structural changes needed.
