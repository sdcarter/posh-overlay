import type { TelemetryProvider } from '../../application/ports/telemetry-provider.js';
import type { TelemetrySnapshot } from '../../domain/telemetry/types.js';

/**
 * iRacing telemetry provider using node-irsdk.
 * Requires iRacing to be running on Windows.
 * Falls back gracefully when the SDK is unavailable (e.g. macOS dev).
 */
export class IRacingTelemetryProvider implements TelemetryProvider {
  private sdk: any = null;
  private latest: TelemetrySnapshot | null = null;

  async start() {
    try {
      const irsdk = await import('node-irsdk');
      this.sdk = irsdk.default?.init?.() ?? irsdk.init?.();
      if (this.sdk) {
        this.sdk.on('Telemetry', (evt: any) => {
          const d = evt.data;
          this.latest = {
            timestampMs: Date.now(),
            driverCarId: d.DriverCarIdx ?? 1,
            rpm: d.RPM ?? 0,
            maxRpm: d.PlayerCarSLShiftRPM ?? d.PlayerCarSLBlinkRPM ?? d.PlayerCarSLLastRPM ?? (d.RPM ?? 0) * 1.05,
            pitLimiterActive: !!d.EngineWarnings && (d.EngineWarnings & 0x10) !== 0,
            sessionLapsRemain: d.SessionLapsRemain ?? null,
            sessionLapsTotal: d.SessionLapsTotal ?? null,
            sessionTimeRemainSeconds: d.SessionTimeRemain ?? null,
            sessionLastLapTimeSeconds: d.LapLastLapTime ?? null,
            incidentCount: d.PlayerCarMyIncidentCount ?? d.PlayerCarDriverIncidentCount ?? 0,
            incidentLimit: null,
            brakeBiasPercent: d.dcBrakeBias ?? null,
            tractionControlLevel: d.dcTractionControl != null ? Math.round(d.dcTractionControl) : null,
          };
        });
      }
    } catch {
      console.log('node-irsdk not available — iRacing telemetry disabled.');
    }
  }

  async stop() {
    this.sdk = null;
    this.latest = null;
  }

  tryReadSnapshot(): TelemetrySnapshot | null {
    return this.latest;
  }
}
