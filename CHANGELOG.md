# CHANGELOG.md

## v1.2.2
- **fix**: mock telemetry now sends realistic clutch data (brief press on upshift/downshift).
- **fix**: pit window indicator replaced with a subtle BMW M blue dot instead of "PIT!" text.

## v1.2.1
- **fix**: clutch bar and trace now blue (not amber) and correctly inverted (1.0 = pedal pressed).
- **fix**: phantom TC3 channel no longer appears on cars with only TC1/TC2.

## v1.2.0
- **feat**: live telemetry traces (throttle, brake, clutch) with 10s history, shown left of position box.
- **feat**: live pedal bar indicators (B/T/C) to the right of telemetry trace.
- **feat**: multiple TC channels displayed in ribbon (TC1, TC2, etc.).
- **feat**: clutch added to telemetry trace and all providers.
- **fix**: LED strip and ribbon now overhang the main container top/bottom for a cleaner layout.
- **fix**: RPM/Speed/Gear centered vertically with proper breathing room.
- **fix**: fuel estimation robustness — green-flag-only laps, out-lap exclusion, IQR outlier detection, 5-lap window, 0.5-lap safety margin.
- **chore**: wider telemetry trace panel (240px), tray icon update, package updates.

## v1.1.1
- **fix**: LED bar overlap and layout polish.

## v1.1.0
- **fix**: add `.npmrc` for ESLint peer dependency compatibility.

## v1.0.1
- **fix**: ABS detection, LED overflow, leader-finished indicator, and session logic.

## v1.0.0
- **chore**: release v1.0.0.

## v0.9.19
- **fix**: final car lookup fix with corrected data.

## v0.9.18
- **fix**: fuzzy car lookup and debug car path.

## v0.9.17
- **fix**: bulletproof car profile lookup logic.

## v0.9.16
- **fix**: correctly parse 9 LEDs for NASCAR Next Gen.

## v0.9.15
- **feat**: show `TEST` for sessions > 24h instead of countdown.

## v0.9.14
- **chore**: full native car path matching for NASCAR 2024.

## v0.9.13
- **fix**: mapping for iRacing NASCAR 2024 versions.

## v0.9.12
- **fix**: NASCAR RPM fallback for cars with 0 SDK shift RPMs.

## v0.9.11
- **fix**: session time overflow in long practice sessions.

## v0.9.10
- **chore**: move car data source to `sdcarter` fork.

## v0.9.9
- **chore**: bump version to 0.9.9.

## v0.9.8
- **chore**: bump version to 0.9.8.

## v0.9.7
- **fix**: stabilize timed race lap countdown with rolling average.

## v0.9.6
- **feat**: prevent multiple instances with single-instance lock.

## v0.9.5
- **chore**: bump version to 0.9.5.

## v0.9.4
- **feat**: session synchronization and performance polish.

## v0.9.3
- **fix**: telemetry lap/fuel logic.

## v0.9.2
- **fix**: fuel tracking and finish lap logic.

## v0.9.1
- **fix**: draft validation from electron builder schema.

## v0.9.0
- **chore**: consolidate all feature specifications into root specs.
