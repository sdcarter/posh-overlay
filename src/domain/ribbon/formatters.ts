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

export function formatTime(seconds: number): string {
  if (seconds < 0) return '00:00';
  if (seconds >= 360000) return '>99:59:59';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function lapInfo(s: TelemetrySnapshot): string {
  if (s.sessionType === 'lap-based') {
    const current = s.currentLap ?? 0;
    const total = s.sessionLapsTotal ?? 0;
    return `${current} / ${total}`;
  }
  return s.sessionTimeRemainSeconds != null ? formatTime(s.sessionTimeRemainSeconds) : '--:--';
}
