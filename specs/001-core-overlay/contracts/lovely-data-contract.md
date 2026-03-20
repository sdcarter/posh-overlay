# Contract: Lovely Car Data Ingestion and Generated Lookup

## Purpose

Define build-time data ingestion and generation contract for Lovely car data used by rev strip logic.

## Source

- Repository path: `Lovely-Sim-Racing/lovely-car-data/data/iracing`

- Inputs:
  - `manifest.json`
  - per-car `*.json` profile files referenced by manifest

## Build-Time Sync Contract (`SyncLovelyData`)

- Trigger: pre-build target execution.

- Inputs:
  - Source repository data endpoint
  - Existing local cache in `Resources/CarData/`

- Outputs:
  - Updated `Resources/CarData/manifest.json`
  - Updated per-car profile files in `Resources/CarData/`

- Failure behavior:
  - Build fails when required manifest or referenced car profiles are unavailable.

## Source Generator Contract

- Input directory: `Resources/CarData/`

- Generated artifact:
  - Static `CarLookup` API with allocation-free lookup by `driverCarId`
  - Precomputed segment thresholds/colors and flash rules

- Runtime guarantees:
  - No runtime HTTP calls for car profiles
  - No runtime dynamic file I/O for car profiles

## Logical Schema (Required Fields)

### Manifest

- `version`: string
- `cars`: array
  - `carId`: int
  - `profilePath`: string

### Car Profile

- `carId`: int
- `segments`: array (15..20)
  - `rpmPercentTrigger`: number (0..1)
  - `colorHex`: string
- `pitLimiterFlash`:
  - `enabled`: bool
  - `frequencyHz`: number
  - `colorHex`: string
- `optimalShiftFlash`:
  - `enabled`: bool
  - `frequencyHz`: number
  - `colorHex`: string

## Validation Rules

- Manifest car IDs must be unique.
- Every manifest reference must resolve to a local file after sync.
- Segment trigger values must be monotonic.
- Generator fails fast on schema violations.
