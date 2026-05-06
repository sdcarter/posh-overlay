import type { TelemetrySnapshot } from '../telemetry/types.js';

export function formatIncidents(s: TelemetrySnapshot): string {
  return s.incidentLimit != null ? `Inc ${s.incidentCount}/${s.incidentLimit}` : `Inc ${s.incidentCount}/-`;
}

export function brakeBias(s: TelemetrySnapshot): string | null {
  return s.brakeBiasPercent != null ? `BB ${s.brakeBiasPercent.toFixed(1)}%` : null;
}

export function tractionControl(s: TelemetrySnapshot): string | null {
  // Prefer multiple-channel display when available
  if (s.tractionControlLevels && s.tractionControlLevels.length > 0) {
    const levels = s.tractionControlLevels.filter((v): v is number => v != null);
    if (levels.length === 1) return `TC ${levels[0]}`;
    const parts = s.tractionControlLevels
      .map((v, i) => v != null ? `TC${i + 1} ${v}` : null)
      .filter((p): p is string => p != null);
    return parts.length > 0 ? parts.join(' • ') : null;
  }

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

  // For sessions longer than 24 hours, it's almost certainly a local test drive.
  if (s.sessionTimeRemainSeconds != null && s.sessionTimeRemainSeconds > 86400) {
    return 'TEST';
  }

  return s.sessionTimeRemainSeconds != null ? formatTime(s.sessionTimeRemainSeconds) : '--:--';
}
