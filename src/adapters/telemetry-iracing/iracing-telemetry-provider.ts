import type { TelemetryProvider } from '../../application/ports/telemetry-provider.js';
import type { TelemetrySnapshot } from '../../domain/telemetry/types.js';
import { isLapConsumptionOutlier, isGreenFlagCondition } from '../../domain/fuel/fuel-laps.js';

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

  private fuelUsedHistory: number[] = [];
  private lastLapFuelLevel: number | null = null;
  private computedFuelPerLap: number | null = null;
  private playerCheckeredLap: number | null = null;
  private lapTimeHistory: number[] = [];
  private firstRecordedLap: number | null = null; // to detect and exclude the out-lap
  private lapWasGreen: boolean = true; // tracks whether the current lap has been all-green

  async start() {
    try {
      const mod = await import('irsdk-node');
      this.SDKClass = mod.IRacingSDK as unknown as SDKStatic;
      this.polling = setInterval(() => this.poll(), 8);
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

      const leaderFlags = arrVal(t.CarIdxSessionFlags, leaderCarIdx) ?? 0;
      const leaderFinished = (leaderFlags & 0x10) !== 0;

      if (session) {
        const idx = session.DriverInfo?.DriverCarIdx;
        const drivers = session.DriverInfo?.Drivers;
        if (idx != null && drivers) {
          const me = drivers.find((d) => d.CarIdx === idx);
          if (me?.CarPath) this.carPath = me.CarPath;
        }
      }

      const rpm = val(t.RPM) ?? 0;
      const currentLap = val(t.Lap) ?? arrVal(t.CarIdxLap, playerCarIdx);
      const fuelLevel = val(t.FuelLevel);
      const sessionState = val(t.SessionState) ?? 0;
      const isOnTrack = Boolean(t.IsOnTrack?.value?.[0] ?? false);
      const isReplayPlaying = Boolean(t.IsReplayPlaying?.value?.[0] ?? false);

      if (sessionState === 5 && this.playerCheckeredLap == null && currentLap != null) {
        this.playerCheckeredLap = currentLap;
      } else if (sessionState < 5) {
        this.playerCheckeredLap = null;
      }

      let playerFinished = false;
      if (sessionState >= 6) {
        playerFinished = true;
      } else if (sessionState === 5 && this.playerCheckeredLap != null && currentLap != null && currentLap > this.playerCheckeredLap) {
        playerFinished = true;
      }

      // Track whether the current lap has been fully green (no caution/yellow/red)
      const sessionFlags = val(t.SessionFlags) ?? 0;
      if (!isGreenFlagCondition(sessionFlags)) {
        this.lapWasGreen = false;
      }

      if (currentLap != null && fuelLevel != null) {
        if (this.lastLapFuelLevel == null) {
          this.lastLapFuelLevel = fuelLevel;
          this.firstRecordedLap = currentLap;
        } else if (this.latest != null && this.latest.currentLap != null && currentLap > this.latest.currentLap) {
          const consumed = this.lastLapFuelLevel - fuelLevel;
          const completedLap = this.latest.currentLap;
          const isOutLap = completedLap === this.firstRecordedLap;

          if (consumed > 0.01 && consumed < 150 && !isOutLap && this.lapWasGreen) {
            const isOutlier = isLapConsumptionOutlier(consumed, this.fuelUsedHistory);

            if (!isOutlier) {
              this.fuelUsedHistory.push(consumed);
              if (this.fuelUsedHistory.length > 5) this.fuelUsedHistory.shift();
              this.computedFuelPerLap = this.fuelUsedHistory.reduce((a, b) => a + b, 0) / this.fuelUsedHistory.length;
            }
          }
          this.lastLapFuelLevel = fuelLevel;
          this.lapWasGreen = true; // reset for the new lap
        }
      }

      // Track lap times for rolling average (timed race estimation)
      const lastLapTime = val(t.LapLastLapTime);
      if (this.latest != null && this.latest.currentLap != null && currentLap != null && currentLap > this.latest.currentLap) {
        if (lastLapTime != null && lastLapTime > 0) {
          this.lapTimeHistory.push(lastLapTime);
          if (this.lapTimeHistory.length > 3) this.lapTimeHistory.shift();
        }
      }

      const sessionAvgLapTime = this.lapTimeHistory.length > 0
        ? this.lapTimeHistory.reduce((a, b) => a + b, 0) / this.lapTimeHistory.length
        : null;

      const leaderCompleted = arrVal(t.CarIdxLap, leaderCarIdx);

      const sessionLapsTotal = lapVal(t.SessionLapsTotal);
      const sessionType: 'lap-based' | 'time-based' = sessionLapsTotal != null ? 'lap-based' : 'time-based';

      // NASCAR cars often return 0 for these variables. We need a non-zero maxRpm.
      const slShift = val(t.PlayerCarSLShiftRPM);
      const slBlink = val(t.PlayerCarSLBlinkRPM);
      const slLast = val(t.PlayerCarSLLastRPM);
      const sdkMaxRpm = (slShift && slShift > 0) ? slShift : (slBlink && slBlink > 0) ? slBlink : (slLast && slLast > 0) ? slLast : null;
      const maxRpm = sdkMaxRpm ?? (rpm > 0 ? rpm * 1.05 : 1);

      this.latest = {
        timestampMs: Date.now(),
        driverCarId: playerCarIdx ?? 0,
        positionOverall: overallPosition != null ? Math.round(overallPosition) : null,
        carPath: this.carPath,
        currentLap,
        lapDistPct: val(t.LapDistPct) ?? arrVal(t.CarIdxLapDistPct, playerCarIdx),
        leaderLap: leaderCompleted != null ? leaderCompleted + 1 : null,
        leaderLapDistPct: arrVal(t.CarIdxLapDistPct, leaderCarIdx),
        gear: val(t.Gear),
        rpm,
        maxRpm,
        shiftIndicatorPct: val(t.ShiftIndicatorPct),
        pitLimiterActive: ((val(t.EngineWarnings) ?? 0) & 0x10) !== 0,
        sessionLapsRemain: lapVal(t.SessionLapsRemainEx) ?? lapVal(t.SessionLapsRemain),
        sessionLapsTotal,
        sessionTimeRemainSeconds: val(t.SessionTimeRemain),
        sessionLastLapTimeSeconds: val(t.LapLastLapTime),
        sessionAvgLapTimeSeconds: sessionAvgLapTime,
        incidentCount: val(t.PlayerCarMyIncidentCount) ?? val(t.PlayerCarDriverIncidentCount) ?? 0,
        incidentLimit: null,
        brakeBiasPercent: val(t.dcBrakeBias),
        // Collect multiple traction control channels (dcTractionControl, dcTractionControl2, ...)
        tractionControlLevels: (() => {
          const keys = Object.keys(t).filter(k => k.startsWith('dcTractionControl'));
          if (keys.length === 0) return null;
          keys.sort((a, b) => {
            const na = a.match(/(\d+)$/);
            const nb = b.match(/(\d+)$/);
            if (!na && !nb) return a.localeCompare(b);
            if (!na) return -1;
            if (!nb) return 1;
            return Number(na[1]) - Number(nb[1]);
          });
          return keys.map(k => {
            const v = val((t as Record<string, TelVar>)[k]);
            return v != null ? Math.round(v) : null;
          });
        })(),
        tractionControlLevel: (() => {
          const v = val(t.dcTractionControl);
          return v != null ? Math.round(v) : null;
        })(),
        absLevel: val(t.dcABS) != null ? Math.round(val(t.dcABS)!) : null,
        fuelLevel,
        fuelLevelPct: val(t.FuelLevelPct),
        fuelPerLap: this.computedFuelPerLap,
        fuelLapCount: this.fuelUsedHistory.length,
        throttle: val(t.Throttle) ?? 0,
        brake: val(t.Brake) ?? 0,
        clutch: val(t.Clutch) ?? 0,
        absActive: Boolean(t.BrakeABSactive?.value?.[0] ?? false),
        speedKmH: (val(t.Speed) ?? 0) * 3.6,
        sessionState,
        playerFinished,
        leaderFinished,
        isOnTrack,
        isReplayPlaying,
        sessionType,
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
