import type { TelemetrySnapshot } from '../../domain/telemetry/types.js';
import type { RibbonState } from '../../domain/ribbon/types.js';
import { lapProgress, formatIncidents, brakeBias, tractionControl, absLevel } from '../../domain/ribbon/formatters.js';

export function composeRibbon(snapshot: TelemetrySnapshot): RibbonState {
  return {
    lapProgressText: lapProgress(snapshot),
    incidentsText: formatIncidents(snapshot),
    brakeBiasText: brakeBias(snapshot),
    tractionControlText: tractionControl(snapshot),
    absText: absLevel(snapshot),
  };
}
