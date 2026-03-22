import type { TelemetryProvider } from '../../application/ports/telemetry-provider.js';
import type { TelemetrySnapshot } from '../../domain/telemetry/types.js';

interface IRacingSDKInstance {
  on(event: string, callback: (evt: { data: Record<string, unknown> }) => void): void;
}

export class IRacingTelemetryProvider implements TelemetryProvider {
  private sdk: IRacingSDKInstance | null = null;
  private latest: TelemetrySnapshot | null = null;
  private carPath: string | null = null;

  async start() {
    try {
      const irsdk = await import('node-irsdk');
      this.sdk = irsdk.default?.init?.() ?? irsdk.init?.();
      if (this.sdk) {
        this.sdk.on('SessionInfo', (evt) => {
          const info = evt.data as { DriverInfo?: { DriverCarIdx?: number; Drivers?: Array<{ CarPath?: string; CarIdx?: number }> } };
          const idx = info.DriverInfo?.DriverCarIdx;
          const drivers = info.DriverInfo?.Drivers;
          if (idx != null && drivers) {
            const me = drivers.find((d) => d.CarIdx === idx);
            if (me?.CarPath) this.carPath = me.CarPath;
          }
        });

        this.sdk.on('Telemetry', (evt) => {
          const d = evt.data;
          this.latest = {
            timestampMs: Date.now(),
            driverCarId: (d.DriverCarIdx as number) ?? 1,
            carPath: this.carPath,
            gear: (d.Gear as number) ?? null,
            rpm: (d.RPM as number) ?? 0,
            maxRpm: (d.PlayerCarSLShiftRPM as number) ?? (d.PlayerCarSLBlinkRPM as number) ?? (d.PlayerCarSLLastRPM as number) ?? ((d.RPM as number) ?? 0) * 1.05,
            pitLimiterActive: !!d.EngineWarnings && ((d.EngineWarnings as number) & 0x10) !== 0,
            sessionLapsRemain: (d.SessionLapsRemain as number) ?? null,
            sessionLapsTotal: (d.SessionLapsTotal as number) ?? null,
            sessionTimeRemainSeconds: (d.SessionTimeRemain as number) ?? null,
            sessionLastLapTimeSeconds: (d.LapLastLapTime as number) ?? null,
            incidentCount: (d.PlayerCarMyIncidentCount as number) ?? (d.PlayerCarDriverIncidentCount as number) ?? 0,
            incidentLimit: null,
            brakeBiasPercent: (d.dcBrakeBias as number) ?? null,
            tractionControlLevel: d.dcTractionControl != null ? Math.round(d.dcTractionControl as number) : null,
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
