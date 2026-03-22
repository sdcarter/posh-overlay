import type { TelemetrySnapshot, CarShiftProfile } from '../telemetry/types.js';

export function evaluateActiveSegments(snapshot: TelemetrySnapshot, profile: CarShiftProfile): number {
  if (profile.segmentTriggers.length === 0 || snapshot.maxRpm <= 0) return 0;
  const ratio = snapshot.rpm / snapshot.maxRpm;
  let active = 0;
  for (let i = 0; i < profile.segmentTriggers.length; i++) {
    if (ratio >= profile.segmentTriggers[i]) active = i + 1;
  }
  return active;
}
