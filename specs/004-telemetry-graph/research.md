# Research: Visual Telemetry Graph

## Mock Telemetry Emitter
**Decision**: Implement a simple mock telemetry emitter update in `src/adapters/telemetry-mock/` that generates dynamic values for throttle, brake, and ABS to simulate real driving.
**Rationale**: Posh-overlay uses a mock adapter for development without iRacing. We need to feed fake pedal data (throttle 0-100, brake 0-100, abs active boolean) into the system so the UI can be developed and verified without a running sim, keeping it as simple as possible per user request.
**Alternatives considered**: Playing back a pre-recorded telemetry file (rejected as too complex for this simple feature).

## UI Rendering Approach
**Decision**: Use SVG or simple div-based bars in a React component for the moving graph.
**Rationale**: Simple to implement and style with green/red/yellow colors. If performance becomes an issue (Principle II), we can drop to Canvas, but SVG/DOM should be sufficient for a small 2-5 second history window.
