import type { FlashMode } from './types.js';
import type { TelemetrySnapshot } from '../telemetry/types.js';
import type { CarShiftProfile } from '../telemetry/types.js';

export function resolveFlashMode(snapshot: TelemetrySnapshot, profile: CarShiftProfile): FlashMode {
  if (snapshot.pitLimiterActive) return 'pit-limiter';
  if (!profile.isTopGear && profile.redlineRpm > 0 && snapshot.rpm >= profile.redlineRpm) return 'redline';
  return 'none';
}
