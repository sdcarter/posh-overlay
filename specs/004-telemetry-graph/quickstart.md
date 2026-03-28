# Quickstart: Visual Telemetry Graph

## Development with Mock Telemetry
1. Ensure the overlay is configured to use the mock telemetry adapter (this is typically the default when not running iRacing).
2. Start the development server using `npm run dev`.
3. The overlay should appear on screen.
4. Observe the left side of the main central capsule; the new Visual Telemetry Graph will render automatically.
5. The mock emitter will feed oscillating throttle (green) and brake (red, occasionally turning yellow for ABS) values, flowing right-to-left.
