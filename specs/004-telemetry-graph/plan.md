# Implementation Plan: Visual Telemetry Graph

**Branch**: `004-telemetry-graph` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-telemetry-graph/spec.md`

## Summary

Implement a visual telemetry graph as an extension on the left side of the main overlay capsule. The graph will display right-to-left flowing telemetry traces representing throttle (green) and brake pressure (red, recoloring to yellow during ABS activation). A mock telemetry emitter will be updated to allow seamless browser-based testing and development without requiring iRacing to be running.

## Technical Context

**Language/Version**: TypeScript 5.9+  
**Primary Dependencies**: React 19.x, Electron  
**Storage**: N/A  
**Testing**: Manual Visual Verification (using mock telemetry adapter)
**Target Platform**: Windows Desktop (Electron)  
**Project Type**: desktop-app  
**Performance Goals**: Minimum 60 fps rendering for the graph animation  
**Constraints**: Keep it extremely simple with minimal dependencies; no complex chart libraries  
**Scale/Scope**: Single new UI component and minor domain type updates  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Personal Utility First**: Passes. Fulfills the specific request for racing telemetry visual feedback.
- **II. Performance is the Product**: Passes. Graph will be built with simple DOM elements (e.g. SVG or Divs) to prevent any overhead or stutter. 
- **III. Pragmatic Testing**: Passes. Tested by injecting fake telemetry data via the mock adapter. 
- **IV. Windows-Native Simplicity**: Passes. Doesn't introduce any new heavyweight dependencies.
- **V. Security via Transparency**: Passes. Simple readable React component.

## Project Structure

### Documentation (this feature)

```text
specs/004-telemetry-graph/
├── plan.md              # This file
├── research.md          # Technical decisions
├── data-model.md        # Telemetry data structures
├── quickstart.md        # Testing guide
└── tasks.md             # Task breakdown (to be generated next)
```

### Source Code (repository root)

```text
src/
├── domain/
│   └── telemetry/         # Add throttle, brake, absActive domain types
├── adapters/
│   └── telemetry-mock/    # Update mock adapter to emit dynamic pedal data
└── renderer/
    └── TelemetryGraph.tsx # New presentational component
```

**Structure Decision**: Added a new component in `src/renderer/` and updated the `telemetry` domain types and `telemetry-mock` adapter. This strictly follows the Hexagonal architecture outlined in the constitution without adding any unnecessary layers.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*(No violations. Plan kept explicitly simple in accordance with user request).*
