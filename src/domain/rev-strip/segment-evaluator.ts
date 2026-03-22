import type { CarShiftProfile } from '../telemetry/types.js';

export function evaluateLedStates(rpm: number, profile: CarShiftProfile): boolean[] {
  return profile.ledRpms.map((threshold) => rpm >= threshold);
}
