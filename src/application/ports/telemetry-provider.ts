import type { TelemetrySnapshot } from '../../domain/telemetry/types.js';

export interface TelemetryProvider {
  start(): Promise<void>;
  stop(): Promise<void>;
  tryReadSnapshot(): TelemetrySnapshot | null;
}
