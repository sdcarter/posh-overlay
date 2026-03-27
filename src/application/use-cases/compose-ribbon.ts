import type { TelemetrySnapshot } from '../../domain/telemetry/types.js';
import type { RibbonState } from '../../domain/ribbon/types.js';
import { lapProgress, formatIncidents, brakeBias, tractionControl, absLevel } from '../../domain/ribbon/formatters.js';
import { calculateFuelLapsRemaining, evaluateFuelStatus } from '../../domain/fuel/fuel-laps.js';

export function composeRibbon(snapshot: TelemetrySnapshot): RibbonState {
  const fuelLaps = (snapshot.fuelLevel != null && snapshot.fuelPerLap != null)
    ? calculateFuelLapsRemaining(snapshot.fuelLevel, snapshot.fuelPerLap)
    : null;
  const fuelStatus = (fuelLaps != null && snapshot.sessionLapsRemain != null)
    ? evaluateFuelStatus(fuelLaps, snapshot.sessionLapsRemain)
    : null;

  return {
    lapProgressText: lapProgress(snapshot),
    incidentsText: formatIncidents(snapshot),
    brakeBiasText: brakeBias(snapshot),
    tractionControlText: tractionControl(snapshot),
    absText: absLevel(snapshot),
    fuelLapsText: fuelLaps != null ? fuelLaps.toFixed(1) : null,
    fuelStatus,
  };
}
