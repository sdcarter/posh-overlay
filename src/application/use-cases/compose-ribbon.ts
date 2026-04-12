import type { TelemetrySnapshot } from '../../domain/telemetry/types.js';
import type { RibbonState } from '../../domain/ribbon/types.js';
import { lapInfo, formatIncidents, brakeBias, tractionControl, absLevel } from '../../domain/ribbon/formatters.js';
import { calculateFuelLapsRemaining, evaluateFuelStatus } from '../../domain/fuel/fuel-laps.js';
import { lapsRemainingForDriver, isDriverFinished } from '../../domain/telemetry/lap-count.js';

export function composeRibbon(snapshot: TelemetrySnapshot): RibbonState {
  const fuelLaps = (snapshot.fuelLevel != null && snapshot.fuelPerLap != null)
    ? calculateFuelLapsRemaining(snapshot.fuelLevel, snapshot.fuelPerLap)
    : null;
  const lapsRemain = lapsRemainingForDriver(snapshot);
  const finished = isDriverFinished(snapshot);
  const fuelStatus = (fuelLaps != null && lapsRemain != null)
    ? evaluateFuelStatus(fuelLaps, lapsRemain, snapshot.fuelLapCount)
    : null;

  return {
    incidentsText: formatIncidents(snapshot),
    brakeBiasText: brakeBias(snapshot),
    tractionControlText: tractionControl(snapshot),
    absText: absLevel(snapshot),
    fuelLapsText: fuelLaps != null ? fuelLaps.toFixed(1) : null,
    fuelStatus,
    lapsRemaining: lapsRemain,
    finished,
    lapInfoText: lapInfo(snapshot),
    visible: snapshot.isOnTrack && !snapshot.isReplayPlaying,
  };
}
