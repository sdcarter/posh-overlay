# 🐙 PoshDash

A transparent always-on-top overlay for [iRacing](https://www.iracing.com/) that displays real-time telemetry — RPM rev lights, incident count, brake bias, traction control, and ABS — directly on your screen while you race.

## Personal Project

This is a tool I created for my own use. I'm not building it as a product or planning large-scale development — just something I wanted to address for myself. Specifically, I built this because when your FOV is set correctly in many cars, you often can't see the dashboard, and I felt that rev lights were something I was missing. If you enjoy it, you're welcome to use it, but you should expect this to remain a relatively simple, focused project.

## Features

- **Per-car LED rev lights** — circular LEDs with colors, count, and growth pattern sourced from [Lovely Sim Racing car data](https://github.com/Lovely-Sim-Racing/lovely-car-data) for 67+ iRacing cars
- **Accurate shift indicators** — LEDs follow each car's real shift light pattern (sequential, symmetrical, outside-in) with per-gear RPM thresholds
- **Redline flash** — all LEDs rapidly blink the car's redline color when it's time to shift (suppressed in top gear)
- **Smart visibility** — cars without LED profiles show only the telemetry ribbon, no fake generic lights
- **Live telemetry ribbon** — RPM counter left, incidents/BB/TC/ABS right — settings hidden when the car doesn't support them
- **Fuel laps remaining** — colored dot (green/yellow/red) with laps of fuel left, based on current fuel level and consumption rate
- **Session synchronization** — handles end-of-race edge cases by locking lap counts when the leader finishes to prevent post-race display glitches
- **Scalable UI** — text and LEDs scale proportionally when you resize the overlay
- **Transparent overlay** — click-through when locked, draggable/resizable when unlocked
- **Position memory** — overlay position and size persist across restarts
- **Auto-update** — silently downloads new versions from GitHub Releases and prompts to restart
- **System tray** — show/hide, lock/unlock, check for updates, exit

## Install

Download the latest installer from [Releases](https://github.com/sdcarter/posh-overlay/releases). Run the `.exe` — PoshDash installs and launches automatically.

Updates are delivered automatically. When a new version is ready, you'll be prompted to restart.

## Usage

1. Launch PoshDash — it appears as an octopus icon in your system tray
2. Start iRacing — telemetry connects automatically
3. Right-click the tray icon to unlock the overlay, drag it where you want, then lock it back

The overlay is invisible to screen capture tools and stays on top of fullscreen applications.

## Development

```bash
# Install dependencies
npm install

# Run with mock telemetry (launches Electron with fake data)
npm run mock

# Browse visual scenarios in Storybook
npm run storybook

# Lint
npm run lint

# Build
npm run build

# Package (local .exe, no publish)
npm run pack
```

Requires Node.js 22+ and npm. The iRacing telemetry adapter (`irsdk-node`) only compiles on Windows — on macOS/Linux, the app runs with mock telemetry.

`npm run mock` launches the full Electron overlay with simulated telemetry. Car-specific scenarios (wide LED arrays, fuel estimation, race finishes, etc.) are available as Storybook stories via `npm run storybook`.

## Architecture

PoshDash uses a hexagonal (ports-and-adapters) architecture:

```text
domain/        Pure TypeScript — telemetry types, rev-strip evaluation, ribbon formatting
application/   Use cases and port interfaces
adapters/      iRacing SDK, mock telemetry, GitHub release feed
main/          Electron main process + preload
renderer/      React UI (Overlay, RevStrip)
```

## Acknowledgements

- [Lovely Sim Racing](https://github.com/Lovely-Sim-Racing/lovely-car-data) — open car data project providing LED profiles, colors, and per-gear RPM thresholds for 75+ cars. A collaboration between Lovely Sim Racing, [ATSR](https://atsr.net/), and [Gomez Sim Industries](https://www.gomezsimind.com/).
- [irsdk-node](https://github.com/nicordev/irsdk-node) — Node.js bindings for the iRacing SDK
- [iRacing](https://www.iracing.com/) — the sim racing platform

## License

MIT
