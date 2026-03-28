import type { TelemetryProvider } from '../../application/ports/telemetry-provider.js';
import type { TelemetrySnapshot } from '../../domain/telemetry/types.js';

interface TelVar { value: number[] }
const UNLIMITED = 32767;
const val = (v: TelVar | undefined) => v?.value?.[0] ?? null;
const lapVal = (v: TelVar | undefined) => { const n = val(v); return n != null && n >= UNLIMITED ? null : n; };
const arrVal = (v: TelVar | undefined, idx: number | null | undefined) => (idx == null ? null : v?.value?.[idx] ?? null);

function findLeaderCarIdx(carIdxPosition: TelVar | undefined): number | null {
  const positions = carIdxPosition?.value;
  if (!positions) return null;

  const leaderIndex = positions.findIndex((position) => position === 1);
  return leaderIndex >= 0 ? leaderIndex : null;
}

interface SDK {
  startSDK(): void;
  waitForData(timeout: number): boolean;
  getTelemetry(): Record<string, TelVar>;
  getSessionData(): { DriverInfo?: { DriverCarIdx?: number; Drivers?: Array<{ CarIdx: number; CarPath: string }> } } | null;
}

interface SDKStatic {
  new (config: { autoEnableTelemetry: boolean }): SDK;
  IsSimRunning(): Promise<boolean>;
}

export class IRacingTelemetryProvider implements TelemetryProvider {
  private sdk: SDK | null = null;
  private latest: TelemetrySnapshot | null = null;
  private polling: ReturnType<typeof setInterval> | null = null;
  private carPath: string | null = null;
  private SDKClass: SDKStatic | null = null;

  async start() {
    try {
      const mod = await import('irsdk-node');
      this.SDKClass = mod.IRacingSDK as unknown as SDKStatic;
      this.polling = setInterval(() => this.poll(), 16);
    } catch {
      console.log('irsdk-node not available — iRacing telemetry disabled.');
    }
  }

  private async poll() {
    if (!this.SDKClass) return;

    if (!this.sdk) {
      try {
        if (await this.SDKClass.IsSimRunning()) {
          this.sdk = new this.SDKClass({ autoEnableTelemetry: true });
          this.sdk.startSDK();
        }
      } catch { /* not running yet */ }
      return;
    }

    if (!this.sdk.waitForData(0)) {
      if (!(await this.SDKClass!.IsSimRunning())) {
        this.sdk = null;
        this.carPath = null;
        this.latest = null;
      }
      return;
    }

    try {
      const t = this.sdk.getTelemetry();
      const session = this.sdk.getSessionData();

      const playerCarIdx = val(t.PlayerCarIdx);
      const leaderCarIdx = findLeaderCarIdx(t.CarIdxPosition);
      const overallPosition = val(t.PlayerCarPosition) ?? arrVal(t.CarIdxPosition, playerCarIdx);

      if (session) {
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
        driverCarId: playerCarIdx ?? 0,
        positionOverall: overallPosition != null ? Math.round(overallPosition) : null,
        carPath: this.carPath,
        currentLap: val(t.Lap) ?? arrVal(t.CarIdxLap, playerCarIdx),
        lapDistPct: val(t.LapDistPct) ?? arrVal(t.CarIdxLapDistPct, playerCarIdx),
        leaderLap: arrVal(t.CarIdxLap, leaderCarIdx),
        leaderLapDistPct: arrVal(t.CarIdxLapDistPct, leaderCarIdx),
        gear: val(t.Gear),
        rpm,
        maxRpm: val(t.PlayerCarSLShiftRPM) ?? val(t.PlayerCarSLBlinkRPM) ?? val(t.PlayerCarSLLastRPM) ?? rpm * 1.05,
        pitLimiterActive: ((val(t.EngineWarnings) ?? 0) & 0x10) !== 0,
        sessionLapsRemain: lapVal(t.SessionLapsRemainEx) ?? lapVal(t.SessionLapsRemain),
        sessionLapsTotal: lapVal(t.SessionLapsTotal),
        sessionTimeRemainSeconds: val(t.SessionTimeRemain),
        sessionLastLapTimeSeconds: val(t.LapLastLapTime),
        incidentCount: val(t.PlayerCarMyIncidentCount) ?? val(t.PlayerCarDriverIncidentCount) ?? 0,
        incidentLimit: null,
        brakeBiasPercent: val(t.dcBrakeBias),
        tractionControlLevel: val(t.dcTractionControl) != null ? Math.round(val(t.dcTractionControl)!) : null,
        absLevel: val(t.dcABS) != null ? Math.round(val(t.dcABS)!) : null,
        fuelLevel: val(t.FuelLevel),
        fuelPerLap: val(t.FuelUsePerHour) != null && val(t.LapLastLapTime) != null && val(t.LapLastLapTime)! > 0
          ? (val(t.FuelUsePerHour)! / 3600) * val(t.LapLastLapTime)!
          : null,
        throttle: val(t.Throttle) ?? 0,
        brake: val(t.Brake) ?? 0,
        absActive: false,
        speedKmH: (val(t.Speed) ?? 0) * 3.6,
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
