import type { TelemetrySnapshot, CarShiftProfile } from '../../domain/telemetry/types.js';
import type { RevStripState } from '../../domain/rev-strip/types.js';
import { evaluateLedStates } from '../../domain/rev-strip/segment-evaluator.js';
import { resolveFlashMode } from '../../domain/rev-strip/flash-mode.js';

export function composeRevStrip(snapshot: TelemetrySnapshot, profile: CarShiftProfile | null): RevStripState | null {
  if (!profile) return null;
  return {
    ledOn: evaluateLedStates(snapshot.rpm, profile),
    ledColors: profile.ledColors,
    flashMode: resolveFlashMode(snapshot, profile),
    redlineColor: profile.redlineColor,
    redlineBlinkInterval: profile.redlineBlinkInterval,
  };
}
