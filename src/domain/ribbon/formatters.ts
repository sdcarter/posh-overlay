import type { TelemetrySnapshot } from '../telemetry/types.js';
import { lapsRemainingForDriver, totalRaceLapsForDriver } from '../telemetry/lap-count.js';

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
  const adjustedTotal = totalRaceLapsForDriver(s);
  if (adjustedTotal != null) {
    const currentLap = s.currentLap ?? 0;
    const lapDistPct = Math.min(1, Math.max(0, s.lapDistPct ?? 0));
    const completed = currentLap > 0 ? Math.max(0, (currentLap - 1) + lapDistPct) : 0;
    const remaining = lapsRemainingForDriver(s);
    return `Laps ${completed.toFixed(1)}/${adjustedTotal.toFixed(1)}${remaining != null ? ` (${remaining} left)` : ''}`;
  }
  if (s.sessionTimeRemainSeconds != null && s.sessionLastLapTimeSeconds != null && s.sessionLastLapTimeSeconds > 0) {
    const est = s.sessionTimeRemainSeconds / s.sessionLastLapTimeSeconds;
    return `Est laps left ${est.toFixed(1)}`;
  }
  return 'Laps -/-';
}
