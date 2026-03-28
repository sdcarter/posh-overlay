```markdown
# Feature Spec: Fuel Laps Remaining Indicator

## Summary
Displays the estimated laps of fuel remaining in the lower ribbon, alongside a colored fuel status dot indicating whether the driver can safely finish the race.

## Motivation
The driver needs a quick, minimal glance indicator of whether they have enough fuel to finish the session without pit stops. This should be highly legible and unobtrusive, integrated into the telemetry ribbon.

## Behavior

### Data Source
- Derived from telemetry fields `FuelLevel` and `FuelPerLap` via domain function `calculateFuelLapsRemaining(level, perLap)`.
- Compared with `SessionLapsRemain` to compute color status via `evaluateFuelStatus(remLaps, sessionLaps)`.

### Display
- Shown in the lower ribbon’s rightmost cluster.
- Formatted as a numeric value with one decimal place, e.g. `9.4`.
- **Suffix "F" removed as of v5.0.0** — the colored dot sufficiently indicates fuel context.
- Value hidden if either `FuelLevel` or `FuelPerLap` is unavailable in telemetry.

### Color Status Dot
- Drawn to the left of the numeric value.
- Colors:
  - Green `#26d07c` → Enough fuel to finish race
  - Yellow `#facc15` → Borderline fuel
  - Red `#f43f5e` → Insufficient fuel
  - Gray `rgba(173,185,199,0.72)` → Unknown/uninitialized
- Circle size scales with overlay height: base diameter `7px` at 150px overlay height.

### Placement Rules
- Always last in the ribbon sequence, following incidents/brake bias/TC/ABS.
- Hidden if `fuelLapsText == null`.
- Separated by a vertical `|` divider from the previous item.

### Scaling
- Font size scales linearly with overlay height (`~12px` at base height).
- Dot and spacing scale accordingly (`gap ~4–5px` around 150px height).

## Implementation Details

### Domain
- Function: `calculateFuelLapsRemaining(fuelLevel, fuelPerLap)` returns numeric laps remaining.
- Function: `evaluateFuelStatus(fuelLaps, sessionLapsRemain)` returns `"green" | "yellow" | "red" | null`.

### Application
- `composeRibbon.ts` constructs `fuelLapsText` as `fuelLaps.toFixed(1)` (numeric string only).
- Provides `fuelStatus` color category for the renderer.

### Renderer
- The ribbon section for fuel uses an inline `span` cluster:
  - Colored circle (via inline `backgroundColor`)
  - Adjacent numeric label (no suffix)
- Shown conditionally only when `fuelLapsText != null`.

## Acceptance Criteria
- ✅ Fuel laps show a one-decimal numeric (e.g. `8.9`) without any suffix.
- ✅ Dot color and numeric value update live as telemetry changes.
- ✅ Ribbon hides the fuel cluster when telemetry fields are null.
- ✅ Layout, font scaling, and separator behavior match other ribbon elements.
- ✅ Passing `tsc` strict and `eslint` with zero warnings.

## Version History
- **Added:** v4.2.0 — Initial fuel laps remaining indicator including “F” suffix  
- **Amended:** v5.0.0 — Removed “F” suffix per overlay simplification initiative
```