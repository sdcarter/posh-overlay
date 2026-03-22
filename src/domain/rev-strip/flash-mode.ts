import type { TelemetrySnapshot } from '../telemetry/types.js';
import type { FlashMode } from './types.js';

export function resolveFlashMode(snapshot: TelemetrySnapshot): FlashMode {
  if (snapshot.pitLimiterActive) return 'pit-limiter';
  const ratio = snapshot.maxRpm > 0 ? snapshot.rpm / snapshot.maxRpm : 0;
  return ratio >= 0.95 ? 'shift-point' : 'none';
}
