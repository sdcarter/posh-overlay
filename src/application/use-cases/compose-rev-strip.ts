import type { TelemetrySnapshot, CarShiftProfile } from '../../domain/telemetry/types.js';
import type { RevStripState } from '../../domain/rev-strip/types.js';
import { evaluateActiveSegments } from '../../domain/rev-strip/segment-evaluator.js';
import { resolveFlashMode } from '../../domain/rev-strip/flash-mode.js';

export function composeRevStrip(snapshot: TelemetrySnapshot, profile: CarShiftProfile): RevStripState {
  return {
    activeSegments: evaluateActiveSegments(snapshot, profile),
    segmentColors: profile.segmentColors,
    flashMode: resolveFlashMode(snapshot),
  };
}
