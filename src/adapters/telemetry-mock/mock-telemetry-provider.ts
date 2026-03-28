import type { TelemetryProvider } from '../../application/ports/telemetry-provider.js';
import type { TelemetrySnapshot } from '../../domain/telemetry/types.js';

interface SweepConfig {
  carPath: string;
  maxRpm: number;
  gearCount: number;
  positionOverall: number;
  brakeBiasPercent: number;
  tractionControlLevel: number | null;
  absLevel: number | null;
}

function baseSnapshot(overrides: Partial<TelemetrySnapshot>): TelemetrySnapshot {
  const nowMs = Date.now();
  const cycle = nowMs % 5000;
  const throttle = cycle < 2000 ? Math.min(1, cycle / 300) : 0;
  const brake = cycle > 2500 && cycle < 4000 ? Math.min(1, (cycle - 2500) / 200) : 0;
  const absActive = brake > 0.8 && (nowMs % 120 < 60);

  return {
    timestampMs: nowMs,
    driverCarId: 1,
    positionOverall: 12,
    carPath: 'bmwm4gt3',
    currentLap: 10,
    lapDistPct: 0.42,
    leaderLap: 10,
    leaderLapDistPct: 0.67,
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
    absLevel: 3,
    fuelLevel: 28.3,
    fuelPerLap: 2.8,
    throttle,
    brake,
    absActive,
    speedKmH: 120,
    ...overrides,
  };
}

function createSweepSnapshot(config: SweepConfig, nowMs: number): TelemetrySnapshot {
  const rampMs = 2400;
  const shiftMs = 400;
  const resetMs = 800;
  const gearWindowMs = rampMs + shiftMs;
  const cycleMs = config.gearCount * gearWindowMs + resetMs;
  const cycleProgressMs = nowMs % cycleMs;
  const inReset = cycleProgressMs >= config.gearCount * gearWindowMs;
  const completedCycles = Math.floor(nowMs / cycleMs);

  if (inReset) {
    return baseSnapshot({
      carPath: config.carPath,
      positionOverall: config.positionOverall,
      currentLap: 4 + completedCycles,
      lapDistPct: 0.02,
      leaderLap: 4 + completedCycles,
      leaderLapDistPct: 0.06,
      gear: 1,
      rpm: Math.round(config.maxRpm * 0.34),
      maxRpm: config.maxRpm,
      sessionLapsRemain: 6,
      sessionLapsTotal: 12,
      brakeBiasPercent: config.brakeBiasPercent,
      tractionControlLevel: config.tractionControlLevel,
      absLevel: config.absLevel,
    });
  }

  const gearIndex = Math.min(config.gearCount - 1, Math.floor(cycleProgressMs / gearWindowMs));
  const gearProgress = (cycleProgressMs % gearWindowMs) / gearWindowMs;
  const gear = gearIndex + 1;
  const rpmProgress = Math.min(1, gearProgress / (rampMs / gearWindowMs));
  const lapDistPct = (gearIndex + gearProgress) / config.gearCount;
  const minRpm = config.maxRpm * 0.42;
  const maxSweepRpm = config.maxRpm * 1.015;
  const rpm = Math.round(minRpm + (maxSweepRpm - minRpm) * rpmProgress);

  return baseSnapshot({
    carPath: config.carPath,
    positionOverall: config.positionOverall,
    currentLap: 4 + completedCycles,
    lapDistPct,
    leaderLap: 4 + completedCycles,
    leaderLapDistPct: Math.min(0.995, lapDistPct + 0.03),
    gear,
    rpm,
    maxRpm: config.maxRpm,
    sessionLapsRemain: 6,
    sessionLapsTotal: 12,
    brakeBiasPercent: config.brakeBiasPercent,
    tractionControlLevel: config.tractionControlLevel,
    absLevel: config.absLevel,
  });
}

function createFinishCountdownSnapshot(nowMs: number): TelemetrySnapshot {
  const cycleMs = 10_000;
  const progress = (nowMs % cycleMs) / cycleMs;

  if (progress < 0.55) {
    const lapDistPct = 0.12 + (progress / 0.55) * 0.82;
    return baseSnapshot({
      carPath: 'bmwm4gt3',
      currentLap: 20,
      lapDistPct,
      leaderLap: 20,
      leaderLapDistPct: Math.min(0.99, lapDistPct + 0.01),
      gear: lapDistPct > 0.72 ? 5 : 4,
      rpm: Math.round(6200 + 2300 * Math.min(1, lapDistPct)),
      maxRpm: 9000,
      sessionLapsRemain: 0,
      sessionLapsTotal: 20,
      positionOverall: 7,
      brakeBiasPercent: 53.8,
      tractionControlLevel: 2,
      absLevel: 3,
    });
  }

  const postFinishProgress = (progress - 0.55) / 0.45;
  return baseSnapshot({
    carPath: 'bmwm4gt3',
    currentLap: 21,
    lapDistPct: 0.03 + postFinishProgress * 0.12,
    leaderLap: 21,
    leaderLapDistPct: 0.06 + postFinishProgress * 0.12,
    gear: 3,
    rpm: Math.round(2500 + 500 * Math.sin(postFinishProgress * Math.PI)),
    maxRpm: 9000,
    sessionLapsRemain: 0,
    sessionLapsTotal: 20,
    positionOverall: 7,
    brakeBiasPercent: 53.8,
    tractionControlLevel: 2,
    absLevel: 3,
  });
}

function createFuelScenarioSnapshot(nowMs: number): TelemetrySnapshot {
  // Cycle through green → yellow → red every 9 seconds (3s each)
  const cycleMs = 9000;
  const phase = Math.floor((nowMs % cycleMs) / 3000);
  const lapsRemain = 10;
  const fuelPerLap = 3.0;
  // green: 10.5 laps of fuel, yellow: 9.4 laps, red: 8.2 laps
  const fuelLevel = [31.5, 28.2, 24.6][phase] ?? 31.5;

  return baseSnapshot({
    carPath: 'bmwm4gt3',
    gear: 4,
    rpm: 6800,
    maxRpm: 9000,
    sessionLapsRemain: lapsRemain,
    sessionLapsTotal: 20,
    fuelLevel,
    fuelPerLap,
    brakeBiasPercent: 53.8,
    tractionControlLevel: 2,
    absLevel: 3,
  });
}

export class MockTelemetryProvider implements TelemetryProvider {
  constructor(private readonly scenario: string = 'default') {}

  async start() {}
  async stop() {}

  tryReadSnapshot(): TelemetrySnapshot {
    const nowMs = Date.now();

    switch (this.scenario) {
      case 'finish':
      case 'finish-countdown':
        return createFinishCountdownSnapshot(nowMs);
      case 'fuel':
        return createFuelScenarioSnapshot(nowMs);
      case 'mazda-sweep':
        return createSweepSnapshot({
          carPath: 'mx5 mx52016',
          maxRpm: 7600,
          gearCount: 6,
          positionOverall: 3,
          brakeBiasPercent: 55.4,
          tractionControlLevel: null,
          absLevel: null,
        }, nowMs);
      case 'bmw-sweep':
        return createSweepSnapshot({
          carPath: 'bmwm4gt3',
          maxRpm: 9000,
          gearCount: 6,
          positionOverall: 7,
          brakeBiasPercent: 53.8,
          tractionControlLevel: 2,
          absLevel: 3,
        }, nowMs);
      case 'sfl-sweep':
        return createSweepSnapshot({
          carPath: 'superformulalights324',
          maxRpm: 9300,
          gearCount: 6,
          positionOverall: 2,
          brakeBiasPercent: 56.1,
          tractionControlLevel: null,
          absLevel: null,
        }, nowMs);
      case 'default':
      default:
        return baseSnapshot({});
    }
  }
}
