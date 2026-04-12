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

  const snapshot: TelemetrySnapshot = {
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
    sessionAvgLapTimeSeconds: null,
    incidentCount: 2,
    incidentLimit: 17,
    brakeBiasPercent: 54.2,
    tractionControlLevel: 2,
    absLevel: 3,
    fuelLevel: 28.3,
    fuelPerLap: 2.8,
    fuelLapCount: 4,
    throttle,
    brake,
    absActive,
    speedKmH: 120,
    sessionState: 4,
    playerFinished: false,
    leaderFinished: false,
    isOnTrack: true,
    isReplayPlaying: false,
    sessionType: 'lap-based',
    ...overrides,
    shiftIndicatorPct: overrides.shiftIndicatorPct ?? ((overrides.rpm ?? 5500) / (overrides.maxRpm ?? 9000)),
  };

  // Enforce sessionType based on total laps
  snapshot.sessionType = snapshot.sessionLapsTotal != null ? 'lap-based' : 'time-based';

  return snapshot;
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

  // Speed ramp: from 60 KMPH to 280 KMPH across all gears
  const speedKmH = Math.round(60 + (220 * lapDistPct));

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
    speedKmH,
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
    leaderFinished: true,
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
    fuelLapCount: 4,
    brakeBiasPercent: 53.8,
    tractionControlLevel: 2,
    absLevel: 3,
  });
}

function createTimedRaceSnapshot(nowMs: number): TelemetrySnapshot {
  // 30s cycle: 0-20s mid-race with timer counting down, 20-26s timer expired (pre-checkered),
  // 26-30s leader finished (checkered flag)
  const cycleMs = 30_000;
  const progress = (nowMs % cycleMs) / cycleMs;

  if (progress < 0.67) {
    // Mid-race: timer counting down from 180s to 0
    const timeRemain = Math.max(0, 180 * (1 - progress / 0.67));
    const lapFraction = (progress / 0.67) * 5; // ~5 laps over this phase
    const currentLap = 8 + Math.floor(lapFraction);
    const lapDistPct = lapFraction % 1;
    return baseSnapshot({
      carPath: 'bmwm4gt3',
      currentLap,
      lapDistPct,
      leaderLap: currentLap,
      leaderLapDistPct: Math.min(0.99, lapDistPct + 0.05),
      gear: 4,
      rpm: Math.round(5500 + 2000 * lapDistPct),
      maxRpm: 9000,
      sessionLapsRemain: null,
      sessionLapsTotal: null,
      sessionTimeRemainSeconds: timeRemain,
      sessionLastLapTimeSeconds: 91.2,
      sessionAvgLapTimeSeconds: 90.5,
      positionOverall: 5,
      brakeBiasPercent: 53.8,
      tractionControlLevel: 2,
      absLevel: 3,
    });
  }

  if (progress < 0.87) {
    // Timer expired but leader hasn't crossed the line yet
    const lapDistPct = 0.3 + ((progress - 0.67) / 0.2) * 0.65;
    return baseSnapshot({
      carPath: 'bmwm4gt3',
      currentLap: 13,
      lapDistPct,
      leaderLap: 13,
      leaderLapDistPct: Math.min(0.99, lapDistPct + 0.05),
      gear: lapDistPct > 0.7 ? 5 : 4,
      rpm: Math.round(5500 + 2500 * lapDistPct),
      maxRpm: 9000,
      sessionLapsRemain: null,
      sessionLapsTotal: null,
      sessionTimeRemainSeconds: 0,
      sessionLastLapTimeSeconds: 91.2,
      sessionAvgLapTimeSeconds: 90.5,
      positionOverall: 5,
      brakeBiasPercent: 53.8,
      tractionControlLevel: 2,
      absLevel: 3,
    });
  }

  // Leader has finished — checkered flag
  const postProgress = (progress - 0.87) / 0.13;
  return baseSnapshot({
    carPath: 'bmwm4gt3',
    currentLap: 14,
    lapDistPct: 0.05 + postProgress * 0.4,
    leaderLap: 14,
    leaderLapDistPct: 0.1 + postProgress * 0.4,
    gear: 3,
    rpm: Math.round(3000 + 1000 * Math.sin(postProgress * Math.PI)),
    maxRpm: 9000,
    sessionLapsRemain: null,
    sessionLapsTotal: null,
    sessionTimeRemainSeconds: 0,
    sessionLastLapTimeSeconds: 91.2,
    sessionAvgLapTimeSeconds: 90.5,
    positionOverall: 5,
    brakeBiasPercent: 53.8,
    tractionControlLevel: 2,
    absLevel: 3,
    leaderFinished: true,
  });
}

function createStabilizingFuelScenarioSnapshot(nowMs: number): TelemetrySnapshot {
  const cycleMs = 25000; // 5 seconds per phase (1-5 laps)
  const phase = Math.min(4, Math.floor((nowMs % cycleMs) / 5000));
  const lapsInHistory = phase; // 0, 1, 2, 3, 4
  const fuelLevel = 50 - (phase * 3);
  const fuelPerLap = 3.0;

  return baseSnapshot({
    carPath: 'bmwm4gt3',
    gear: 4,
    rpm: 6800,
    maxRpm: 9000,
    sessionLapsRemain: 15 - phase,
    sessionLapsTotal: 20,
    fuelLevel,
    fuelPerLap: lapsInHistory > 0 ? fuelPerLap : null,
    fuelLapCount: lapsInHistory,
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
      case 'timed':
        return createTimedRaceSnapshot(nowMs);
      case 'fuel':
        return createFuelScenarioSnapshot(nowMs);
      case 'stabilizing-fuel':
        return createStabilizingFuelScenarioSnapshot(nowMs);
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
      case 'mustang-sweep':
        return createSweepSnapshot({
          carPath: 'stockcars2-oreillyford',
          maxRpm: 8400,
          gearCount: 4,
          positionOverall: 1,
          brakeBiasPercent: 50.0,
          tractionControlLevel: null,
          absLevel: null,
        }, nowMs);
      case 'mustang-nextgen':
        return createSweepSnapshot({
          carPath: 'stockcars-nascarnextgenford',
          maxRpm: 9200,
          gearCount: 5,
          positionOverall: 4,
          brakeBiasPercent: 50.0,
          tractionControlLevel: null,
          absLevel: null,
        }, nowMs);
      case 'wide-led-collision':
        return createSweepSnapshot({
          carPath: 'porsche991rsr',
          maxRpm: 9400,
          gearCount: 6,
          positionOverall: 2,
          brakeBiasPercent: 54.5,
          tractionControlLevel: 1,
          absLevel: 2,
        }, nowMs);
      case 'road-finish':

        return createRoadFinishScenarioSnapshot(nowMs);
      case 'garage':
        return baseSnapshot({ isOnTrack: false, isReplayPlaying: false, rpm: 0, gear: 0, speedKmH: 0 });
      case 'replay':
        return baseSnapshot({ isOnTrack: true, isReplayPlaying: true });
      case 'default':
      default:
        return baseSnapshot({});
    }
  }
}

function createRoadFinishScenarioSnapshot(nowMs: number): TelemetrySnapshot {
  // 30s cycle: 0-20s final lap, 20-25s leader finishes, 25-30s player finishes
  const cycleMs = 30_000;
  const progress = (nowMs % cycleMs) / cycleMs;

  if (progress < 0.67) {
    // Final lap - leader and player closing in
    const lapDistPct = 0.8 + (progress / 0.67) * 0.19;
    return baseSnapshot({
      carPath: 'bmwm4gt3',
      currentLap: 20,
      lapDistPct,
      leaderLap: 20,
      leaderLapDistPct: Math.min(0.995, lapDistPct + 0.05),
      gear: 5,
      rpm: Math.round(6500 + 1500 * (progress / 0.67)),
      maxRpm: 9000,
      speedKmH: Math.round(180 + 40 * (progress / 0.67)),
      sessionLapsRemain: 0,
      sessionLapsTotal: 20,
      positionOverall: 4,
      brakeBiasPercent: 53.8,
      tractionControlLevel: 2,
      absLevel: 3,
    });
  }

  if (progress < 0.83) {
    // Leader has finished, player still racing
    const subProgress = (progress - 0.67) / 0.16;
    const lapDistPct = 0.99 + subProgress * 0.005; // very close to line
    return baseSnapshot({
      carPath: 'bmwm4gt3',
      currentLap: 20,
      lapDistPct: Math.min(0.999, lapDistPct),
      leaderLap: 21,
      leaderLapDistPct: 0.05 + subProgress * 0.05,
      gear: 5,
      rpm: 8200,
      maxRpm: 9000,
      speedKmH: 225,
      sessionLapsRemain: 0,
      sessionLapsTotal: 20,
      positionOverall: 4,
      brakeBiasPercent: 53.8,
      tractionControlLevel: 2,
      absLevel: 3,
      leaderFinished: true,
      playerFinished: false,
    });
  }

  // Both have finished
  const subProgress = (progress - 0.83) / 0.17;
  return baseSnapshot({
    carPath: 'bmwm4gt3',
    currentLap: 21,
    lapDistPct: 0.05 + subProgress * 0.1,
    leaderLap: 21,
    leaderLapDistPct: 0.1 + subProgress * 0.1,
    gear: 3,
    rpm: Math.round(4000 - 1500 * subProgress),
    maxRpm: 9000,
    speedKmH: Math.round(120 - 60 * subProgress),
    sessionLapsRemain: 0,
    sessionLapsTotal: 20,
    positionOverall: 4,
    brakeBiasPercent: 53.8,
    tractionControlLevel: 2,
    absLevel: 3,
    leaderFinished: true,
    playerFinished: true,
  });
}
