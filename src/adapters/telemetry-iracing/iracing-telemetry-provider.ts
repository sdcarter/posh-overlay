import type { TelemetryProvider } from '../../application/ports/telemetry-provider.js';
import type { TelemetrySnapshot } from '../../domain/telemetry/types.js';

interface TelVar { value: number[] }
const val = (v: TelVar | undefined) => v?.value?.[0] ?? null;

interface SDK {
  startSDK(): void;
  waitForData(timeout: number): boolean;
  getTelemetry(): Record<string, TelVar>;
  getSessionData(): { DriverInfo?: { DriverCarIdx?: number; Drivers?: Array<{ CarIdx: number; CarPath: string }> } } | null;
}

interface SDKConstructor {
  new (config: { autoEnableTelemetry: boolean }): SDK;
  IsSimRunning(): boolean;
}

export class IRacingTelemetryProvider implements TelemetryProvider {
  private sdk: SDK | null = null;
  private latest: TelemetrySnapshot | null = null;
  private polling: ReturnType<typeof setInterval> | null = null;
  private carPath: string | null = null;
  private SDKClass: SDKConstructor | null = null;

  async start() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('irsdk-node');
      this.SDKClass = mod.IRacingSDK;
      this.polling = setInterval(() => this.poll(), 16);
    } catch {
      console.log('irsdk-node not available — iRacing telemetry disabled.');
    }
  }

  private poll() {
    if (!this.SDKClass) return;

    if (!this.sdk) {
      try {
        if (this.SDKClass.IsSimRunning()) {
          this.sdk = new this.SDKClass({ autoEnableTelemetry: true });
          this.sdk.startSDK();
        }
      } catch { /* not running yet */ }
      return;
    }

    if (!this.sdk.waitForData(0)) return;

    try {
      const t = this.sdk.getTelemetry();
      const session = this.sdk.getSessionData();

      if (!this.carPath && session) {
        const idx = session.DriverInfo?.DriverCarIdx;
        const drivers = session.DriverInfo?.Drivers;
        if (idx != null && drivers) {
          const me = drivers.find((d) => d.CarIdx === idx);
          if (me?.CarPath) this.carPath = me.CarPath;
        }
      }

      const rpm = val(t.RPM) ?? 0;
      this.latest = {
        timestampMs: Date.now(),
        driverCarId: val(t.PlayerCarIdx) ?? 0,
        carPath: this.carPath,
        gear: val(t.Gear),
        rpm,
        maxRpm: val(t.PlayerCarSLShiftRPM) ?? val(t.PlayerCarSLBlinkRPM) ?? val(t.PlayerCarSLLastRPM) ?? rpm * 1.05,
        pitLimiterActive: ((val(t.EngineWarnings) ?? 0) & 0x10) !== 0,
        sessionLapsRemain: val(t.SessionLapsRemain),
        sessionLapsTotal: val(t.SessionLapsTotal),
        sessionTimeRemainSeconds: val(t.SessionTimeRemain),
        sessionLastLapTimeSeconds: val(t.LapLastLapTime),
        incidentCount: val(t.PlayerCarMyIncidentCount) ?? val(t.PlayerCarDriverIncidentCount) ?? 0,
        incidentLimit: null,
        brakeBiasPercent: val(t.dcBrakeBias),
        tractionControlLevel: val(t.dcTractionControl) != null ? Math.round(val(t.dcTractionControl)!) : null,
      };
    } catch {
      this.sdk = null;
      this.carPath = null;
    }
  }

  async stop() {
    if (this.polling) clearInterval(this.polling);
    this.sdk = null;
    this.latest = null;
  }

  tryReadSnapshot(): TelemetrySnapshot | null {
    return this.latest;
  }
}
