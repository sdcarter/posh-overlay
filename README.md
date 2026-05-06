# 🐙 PoshDash

Transparent always-on-top [iRacing](https://www.iracing.com/) overlay. Real-time telemetry: RPM, incidents, brake bias, TC, ABS.

## Personal Project
Personal tool, not product. Built because dashboard obscured by FOV. Simple, focused.

## Features
- **Per-car LEDs:** Sourced from [Lovely Sim Racing data](https://github.com/Lovely-Sim-Racing/lovely-car-data). 67+ cars.
- **Shift indicators:** Sequential, symmetrical, outside-in patterns. Per-gear RPM thresholds.
- **Redline flash:** LEDs blink at shift point (except top gear).
- **Smart visibility:** No fake lights if car profile missing.
- **Telemetry ribbon:** RPM, incidents, BB/TC/ABS, multi-channel TC. Dynamic visibility.
- **Telemetry traces:** 10s throttle/brake/clutch history graph with live pedal bars (B/T/C).
- **Fuel laps:** Colored dot + conservative laps remaining (0.5 lap safety margin, green-flag-only average, IQR outlier rejection).
- **Session sync:** Locks lap counts when leader finishes. No glitches.
- **Scalable UI:** Proportional scaling on resize.
- **Transparency:** Click-through when locked.
- **Persistence:** Position/size saved.
- **Auto-update:** GitHub Releases integration.
- **Tray:** Controls for lock, visibility, updates, exit.

## Install
Installer at [Releases](https://github.com/sdcarter/posh-overlay/releases). Auto-updates provided.

## Usage
1. Launch PoshDash (tray icon).
2. Start iRacing (auto-connect).
3. Tray right-click -> unlock to move/resize.

Invisible to screen capture. Always on top.

## Development
```bash
npm install     # Deps
npm run mock    # Run w/ fake data
npm run storybook # Visual scenarios
npm run lint    # Lint
npm run build   # Build
npm run pack    # Local .exe
```
Node 24+. `irsdk-node` needs Windows. mock mode for macOS/Linux.

## Architecture
Hexagonal:
- `domain/`: Pure TS. Logic, types.
- `application/`: Use cases, ports.
- `adapters/`: SDK, mock, GitHub.
- `main/`: Electron.
- `renderer/`: React.

## Acknowledgements
- [Lovely Sim Racing](https://github.com/Lovely-Sim-Racing/lovely-car-data)
- [irsdk-node](https://github.com/nicordev/irsdk-node)
- [iRacing](https://www.iracing.com/)

## License
MIT
