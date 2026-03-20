# Contract: Telemetry Provider Port

## Purpose

Define the application-facing telemetry contract used by Hexagonal adapters for live iRacing data and mock development data.

## Port Name

`TelemetryProvider`

## Operations

### StartAsync

- Description: Start provider acquisition loop and begin publishing snapshots.

- Input:
  - `cancellationToken`

- Output:
  - Completion signal

- Guarantees:
  - Non-blocking startup.
  - Safe to call once per provider instance.

### StopAsync

- Description: Stop acquisition and release provider resources.

- Input:
  - `cancellationToken`

- Output:
  - Completion signal

- Guarantees:
  - Idempotent shutdown semantics.

### TryReadSnapshot

- Description: Attempt to read latest normalized snapshot.

- Input:
  - none

- Output:
  - `hasValue` (bool)
  - `snapshot` (TelemetrySnapshot)

- Guarantees:
  - No exceptions for transient simulator disconnects.

## Snapshot Schema

- `timestampTicks`: int64
- `driverCarId`: int32
- `rpm`: float
- `maxRpm`: float
- `pitLimiterActive`: bool
- `sessionLapsRemain`: float|null
- `sessionLapsTotal`: float|null
- `sessionTimeRemainSeconds`: float|null
- `sessionLastLapTimeSeconds`: float|null
- `incidentCount`: int32
- `incidentLimit`: int32|null
- `brakeBiasPercent`: float|null
- `tractionControlLevel`: int32|null

## Behavioral Rules

- Providers must normalize source fields to this schema before publication.
- Adapter-specific exceptions must be translated into domain-safe detach/reconnect signals.
- Publication cadence target is 60 Hz.
- The provider contract must be compatible with channel-based handoff to render pipeline.

## Implementations

- `iRacingSdkTelemetryProvider` (Windows runtime adapter)
- `MockTelemetryProvider` (macOS/Parallels and automated validation adapter)
