# Data Model: PrecisionDash Core Overlay

## Entity: CarProfileManifest

- Description: Build-time manifest index for all supported iRacing car profiles.

- Fields:
  - `version` (string, required)
  - `generatedAtUtc` (datetime string, required)
  - `cars` (array of CarProfileRef, required, min length 1)

- Validation Rules:
  - `version` must be non-empty.
  - Every `cars[*].carId` must be unique.
  - Every profile reference must resolve to an existing source file at build time.

- Relationships:
  - One-to-many with `CarShiftProfile`.

## Entity: CarProfileRef

- Description: Lightweight manifest record linking iRacing car identity to profile source.

- Fields:
  - `carId` (int, required)
  - `carName` (string, required)
  - `profilePath` (string, required)

- Validation Rules:
  - `carId` must be positive.
  - `profilePath` must be relative to `Resources/CarData/`.

## Entity: CarShiftProfile

- Description: Per-car shift-light and visual behavior definition used by the rev strip.

- Fields:
  - `carId` (int, required)
  - `segments` (array of RevSegmentRule, required, size 15..20)
  - `pitLimiterFlash` (FlashRule, required)
  - `optimalShiftFlash` (FlashRule, required)

- Validation Rules:
  - `segments` length must be between 15 and 20.
  - Segment thresholds must be monotonic by RPM percentage.
  - Hex colors must be valid 8-digit ARGB or 6-digit RGB values.

- Relationships:
  - Many-to-one with `CarProfileManifest`.
  - One-to-many with `RevSegmentRule`.

## Entity: RevSegmentRule

- Description: Threshold and color mapping for a single rev strip segment.

- Fields:
  - `index` (int, required)
  - `rpmPercentTrigger` (decimal, required)
  - `colorHex` (string, required)

- Validation Rules:
  - `index` must be contiguous and start at 0.
  - `rpmPercentTrigger` must be within 0.0..1.0.

## Entity: FlashRule

- Description: Controls flashing behavior for limiter/shift conditions.

- Fields:
  - `enabled` (bool, required)
  - `frequencyHz` (decimal, required)
  - `colorHex` (string, required)

- Validation Rules:
  - `frequencyHz` must be > 0 when `enabled=true`.

## Entity: TelemetrySnapshot

- Description: Immutable frame-level telemetry payload passed from provider to pipeline.

- Fields:
  - `timestampTicks` (long, required)
  - `driverCarId` (int, required)
  - `rpm` (float, required)
  - `maxRpm` (float, required)
  - `pitLimiterActive` (bool, required)
  - `sessionLapsRemain` (float, optional)
  - `sessionLapsTotal` (float, optional)
  - `sessionTimeRemainSeconds` (float, optional)
  - `sessionLastLapTimeSeconds` (float, optional)
  - `incidentCount` (int, required)
  - `incidentLimit` (int, optional)
  - `brakeBiasPercent` (float, optional)
  - `tractionControlLevel` (int, optional)

- Validation Rules:
  - `maxRpm` must be > 0.
  - `rpm` must be clamped to 0..`maxRpm`.
  - If `sessionLapsTotal` is absent, progress estimation requires both remaining time and last lap time.

## Entity: RevStripState

- Description: Render-ready rev strip model derived from snapshot and shift profile.

- Fields:
  - `activeSegments` (int, required)
  - `segmentColors` (array of string, required)
  - `flashMode` (enum: None, PitLimiter, ShiftPoint)

- Validation Rules:
  - `activeSegments` must be within 0..segment count.

## Entity: RibbonState

- Description: Render-ready ribbon model for progress, safety, and vehicle controls.

- Fields:
  - `lapProgressText` (string, required)
  - `incidentsText` (string, required)
  - `brakeBiasText` (string, optional)
  - `tractionControlText` (string, optional)

- Validation Rules:
  - `lapProgressText` and `incidentsText` must always be non-empty placeholders when source values are unavailable.

## Entity: OverlayWindowState

- Description: Window configuration constraints for race-safe overlay behavior.

- Fields:
  - `isTopMost` (bool, required, expected true)
  - `isLayered` (bool, required, expected true)
  - `isTransparent` (bool, required, expected true)
  - `backgroundColor` (string, required, default `#CC000000`)

- Validation Rules:
  - Layered and transparent flags must be enabled simultaneously.

## State Transitions

- Telemetry lifecycle:
  - `Detached` -> `Attaching` -> `Attached` -> `Reconnecting` -> `Attached`
  - `Attached` -> `Detached` when simulator stops.

- Rendering lifecycle:
  - `Idle` -> `Running` when first valid snapshot arrives.
  - `Running` -> `Degraded` when profile/snapshot fields are partially missing.
  - `Degraded` -> `Running` when valid fields recover.
