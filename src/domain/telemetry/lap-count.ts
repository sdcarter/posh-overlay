import type { TelemetrySnapshot } from './types.js';

function clampLapPercent(value: number | null): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function totalRaceLapsForDriver(snapshot: TelemetrySnapshot): number | null {
  if (snapshot.sessionLapsTotal == null || Number.isNaN(snapshot.sessionLapsTotal)) {
    return null;
  }

  const sessionTotal = Math.max(0, snapshot.sessionLapsTotal);
  if (
    snapshot.currentLap == null ||
    snapshot.leaderLap == null ||
    snapshot.currentLap <= 0 ||
    snapshot.leaderLap <= 0
  ) {
    return sessionTotal;
  }

  const playerDistance = snapshot.currentLap + clampLapPercent(snapshot.lapDistPct);
  const leaderDistance = snapshot.leaderLap + clampLapPercent(snapshot.leaderLapDistPct);
  const lapDeficit = Math.max(0, Math.floor(leaderDistance - playerDistance));

  return Math.max(0, sessionTotal - lapDeficit);
}

export function lapsRemainingForDriver(snapshot: TelemetrySnapshot): number | null {
  const adjustedTotal = totalRaceLapsForDriver(snapshot);
  if (adjustedTotal != null) {
    if (snapshot.currentLap == null || Number.isNaN(snapshot.currentLap) || snapshot.currentLap <= 0) {
      return Math.ceil(adjustedTotal);
    }

    return Math.max(0, Math.ceil(adjustedTotal) - snapshot.currentLap + 1);
  }

  if (snapshot.sessionLapsRemain == null || Number.isNaN(snapshot.sessionLapsRemain)) {
    return null;
  }

  return Math.max(0, Math.ceil(snapshot.sessionLapsRemain + 1));
}

export function isDriverFinished(snapshot: TelemetrySnapshot): boolean {
  const lapsRemaining = lapsRemainingForDriver(snapshot);
  return lapsRemaining != null && lapsRemaining <= 0;
}
