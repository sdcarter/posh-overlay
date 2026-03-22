import type { TelemetrySnapshot } from '../telemetry/types.js';

export function formatIncidents(s: TelemetrySnapshot): string {
  return s.incidentLimit != null ? `Inc ${s.incidentCount}/${s.incidentLimit}` : `Inc ${s.incidentCount}/-`;
}

export function brakeBias(s: TelemetrySnapshot): string | null {
  return s.brakeBiasPercent != null ? `BB ${s.brakeBiasPercent.toFixed(1)}%` : null;
}

export function tractionControl(s: TelemetrySnapshot): string | null {
  return s.tractionControlLevel != null ? `TC ${s.tractionControlLevel}` : null;
}

export function absLevel(s: TelemetrySnapshot): string | null {
  return s.absLevel != null ? `ABS ${s.absLevel}` : null;
}

export function lapProgress(s: TelemetrySnapshot): string {
  if (s.sessionLapsTotal != null && s.sessionLapsRemain != null) {
    const completed = s.sessionLapsTotal - s.sessionLapsRemain;
    return `Laps ${completed.toFixed(1)}/${s.sessionLapsTotal.toFixed(1)}`;
  }
  if (s.sessionTimeRemainSeconds != null && s.sessionLastLapTimeSeconds != null && s.sessionLastLapTimeSeconds > 0) {
    const est = s.sessionTimeRemainSeconds / s.sessionLastLapTimeSeconds;
    return `Est laps left ${est.toFixed(1)}`;
  }
  return 'Laps -/-';
}
