import type { TelemetrySnapshot } from './types.js';

function clampLapPercent(value: number | null): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function calculateEstimatedSessionTotal(snapshot: TelemetrySnapshot): number | null {
  const timeRemain = snapshot.sessionTimeRemainSeconds;
  const lapTime = snapshot.sessionLastLapTimeSeconds;
  const currentLap = snapshot.currentLap;

  if (timeRemain == null || lapTime == null || lapTime <= 0 || currentLap == null || currentLap <= 0) {
    return null;
  }

  const elapsedLaps = (currentLap - 1) + clampLapPercent(snapshot.lapDistPct);
  const remainingLaps = timeRemain / lapTime;
  
  // By rounding the sum of continuous elapsed laps and remaining laps, we 
  // lock in an "Estimated Session Laps Total" that only changes if the pace 
  // drastically alters, avoiding S/F line crossing cancellation.
  return Math.max(0, Math.round(elapsedLaps + remainingLaps));
}

export function totalRaceLapsForDriver(snapshot: TelemetrySnapshot): number | null {
  // 1. Timed Race (Unlimited Laps)
  if (snapshot.sessionLapsTotal == null || Number.isNaN(snapshot.sessionLapsTotal)) {
    return calculateEstimatedSessionTotal(snapshot);
  }

  // 2. Fixed Lap Race
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
  if (snapshot.playerFinished) return 0;

  // Edge case fix: When the overall leader crosses the finish line, the Checkered 
  // Flag drops (sessionState = 5). Regardless of the math, the race effectively ends 
  // for you the next time you cross the S/F line. We lock laps remaining to 1 here 
  // to avoid erratic values caused by post-race timer resets.
  if (snapshot.sessionState >= 5 || snapshot.leaderFinished) return 1;

  const adjustedTotal = totalRaceLapsForDriver(snapshot);
  if (adjustedTotal != null) {
    if (snapshot.currentLap == null || Number.isNaN(snapshot.currentLap) || snapshot.currentLap <= 0) {
      return Math.ceil(adjustedTotal);
    }
    return Math.max(0, Math.ceil(adjustedTotal) - snapshot.currentLap + 1);
  }

  // 3. Fallback when neither Lap Total nor Timed logic could compute a total
  if (snapshot.sessionLapsRemain == null || Number.isNaN(snapshot.sessionLapsRemain)) {
    return null;
  }

  return Math.max(0, Math.ceil(snapshot.sessionLapsRemain + 1));
}

export function isDriverFinished(snapshot: TelemetrySnapshot): boolean {
  if (snapshot.playerFinished) return true;
  const lapsRemaining = lapsRemainingForDriver(snapshot);
  return lapsRemaining != null && lapsRemaining <= 0;
}
