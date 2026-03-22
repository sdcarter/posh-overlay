import type { TelemetryProvider } from '../../application/ports/telemetry-provider.js';
import type { TelemetrySnapshot } from '../../domain/telemetry/types.js';

export class MockTelemetryProvider implements TelemetryProvider {
  async start() {}
  async stop() {}

  tryReadSnapshot(): TelemetrySnapshot {
    return {
      timestampMs: Date.now(),
      driverCarId: 1,
      carPath: 'bmwm4gt3',
      gear: 4,
      rpm: 5500,
      maxRpm: 9000,
      pitLimiterActive: false,
      sessionLapsRemain: 11,
      sessionLapsTotal: 20,
      sessionTimeRemainSeconds: null,
      sessionLastLapTimeSeconds: 92.3,
      incidentCount: 2,
      incidentLimit: 17,
      brakeBiasPercent: 54.2,
      tractionControlLevel: 2,
    };
  }
}
