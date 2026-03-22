# 🐙 PoshDash

A transparent always-on-top overlay for [iRacing](https://www.iracing.com/) that displays real-time telemetry — RPM rev lights, incident count, brake bias, traction control, and ABS — directly on your screen while you race.

## Features

- **Per-car LED rev lights** — colors, count, growth pattern, and redline behavior sourced from [Lovely Sim Racing car data](https://github.com/Lovely-Sim-Racing/lovely-car-data) for 67+ iRacing cars
- **Accurate shift indicators** — LEDs follow each car's real shift light pattern (sequential, symmetrical, outside-in) with per-gear RPM thresholds
- **Redline flash** — all LEDs rapidly blink the car's redline color when it's time to shift
- **Live telemetry ribbon** — incidents, brake bias, TC, and ABS displayed when the car supports them
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

# Run in dev mode (mock telemetry, no iRacing needed)
POSHDASH_USE_MOCK=true npm start

# Lint
npm run lint

# Build
npm run build

# Package (local .exe, no publish)
npm run pack
```

Requires Node.js 22+ and npm. The iRacing telemetry adapter (`irsdk-node`) only compiles on Windows — on macOS/Linux, the app runs with mock telemetry.

## Architecture

PoshDash uses a hexagonal (ports-and-adapters) architecture:

```
domain/        Pure TypeScript — telemetry types, rev-strip evaluation, ribbon formatting
application/   Use cases and port interfaces
adapters/      iRacing SDK, mock telemetry, GitHub release feed
main/          Electron main process + preload
renderer/      React UI (Overlay, RevStrip, Ribbon)
```

## Acknowledgements

- [Lovely Sim Racing](https://github.com/Lovely-Sim-Racing/lovely-car-data) — open car data project providing LED profiles, colors, and per-gear RPM thresholds for 67+ cars. A collaboration between Lovely Sim Racing, [ATSR](https://atsr.net/), and [Gomez Sim Industries](https://www.gomezsimind.com/).
- [irsdk-node](https://github.com/nicordev/irsdk-node) — Node.js bindings for the iRacing SDK
- [iRacing](https://www.iracing.com/) — the sim racing platform

## License

MIT
