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
    fuelLevelPct: 0.42,
    fuelPerLap: 2.8,
    fuelLapCount: 4,
    throttle,
    brake,
    clutch: overrides.clutch ?? 0,
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

  // Ensure tractionControlLevels exists for newer UI; prefer explicit override, otherwise derive from tractionControlLevel if present
  const snapAny = snapshot as unknown as { tractionControlLevels?: (number | null)[] | null; tractionControlLevel?: number | null };
  if (snapAny.tractionControlLevels === undefined) {
    if (snapAny.tractionControlLevel !== undefined && snapAny.tractionControlLevel != null) {
      snapAny.tractionControlLevels = [snapAny.tractionControlLevel];
    } else {
      snapAny.tractionControlLevels = null;
    }
  }

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
  // 12s cycle: last lap (6s) → leader finished / checkered (3s) → player finished / DONE (3s)
  const cycleMs = 12_000;
  const progress = (nowMs % cycleMs) / cycleMs;

  if (progress < 0.5) {
    const lapDistPct = 0.5 + (progress / 0.5) * 0.49;
    return baseSnapshot({
      currentLap: 20,
      lapDistPct,
      leaderLap: 20,
      leaderLapDistPct: Math.min(0.99, lapDistPct + 0.03),
      sessionLapsRemain: 0,
      sessionLapsTotal: 20,
    });
  }

  if (progress < 0.75) {
    const sub = (progress - 0.5) / 0.25;
    return baseSnapshot({
      currentLap: 20,
      lapDistPct: 0.99 + sub * 0.005,
      leaderLap: 21,
      leaderLapDistPct: 0.02 + sub * 0.05,
      sessionLapsRemain: 0,
      sessionLapsTotal: 20,
      leaderFinished: true,
    });
  }

  const sub = (progress - 0.75) / 0.25;
  return baseSnapshot({
    currentLap: 21,
    lapDistPct: 0.02 + sub * 0.1,
    leaderLap: 21,
    leaderLapDistPct: 0.1 + sub * 0.1,
    sessionLapsRemain: 0,
    sessionLapsTotal: 20,
    leaderFinished: true,
    playerFinished: true,
  });
}
function createFuelScenarioSnapshot(nowMs: number): TelemetrySnapshot {
  // Cycle through green → yellow → red every 9 seconds (3s each)
  const cycleMs = 9000;
  const phase = Math.floor((nowMs % cycleMs) / 3000);
  const lapsRemain = 10;
  const fuelPerLap = 3.0;
  // green: 13.5 laps of fuel, yellow: 10.5 laps, red: 8.2 laps
  const fuelLevel = [40.5, 31.5, 24.6][phase] ?? 40.5;

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
  // 15s cycle: clock counting down (6s) → clock at 0 (3s) → leader finishes (3s) → player finishes (3s)
  const cycleMs = 15_000;
  const progress = (nowMs % cycleMs) / cycleMs;

  if (progress < 0.4) {
    const timeRemain = Math.max(0, 30 * (1 - progress / 0.4));
    return baseSnapshot({
      currentLap: 12,
      lapDistPct: 0.3 + (progress / 0.4) * 0.6,
      sessionLapsRemain: null,
      sessionLapsTotal: null,
      sessionTimeRemainSeconds: timeRemain,
      sessionLastLapTimeSeconds: 91.2,
      sessionAvgLapTimeSeconds: 90.5,
    });
  }

  if (progress < 0.6) {
    const sub = (progress - 0.4) / 0.2;
    return baseSnapshot({
      currentLap: 13,
      lapDistPct: 0.1 + sub * 0.85,
      sessionLapsRemain: null,
      sessionLapsTotal: null,
      sessionTimeRemainSeconds: 0,
      sessionLastLapTimeSeconds: 91.2,
      sessionAvgLapTimeSeconds: 90.5,
    });
  }

  if (progress < 0.8) {
    const sub = (progress - 0.6) / 0.2;
    return baseSnapshot({
      currentLap: 13,
      lapDistPct: 0.95 + sub * 0.04,
      leaderLap: 14,
      leaderLapDistPct: 0.02 + sub * 0.05,
      sessionLapsRemain: null,
      sessionLapsTotal: null,
      sessionTimeRemainSeconds: 0,
      leaderFinished: true,
    });
  }

  const sub = (progress - 0.8) / 0.2;
  return baseSnapshot({
    currentLap: 14,
    lapDistPct: 0.02 + sub * 0.1,
    leaderLap: 14,
    leaderLapDistPct: 0.1 + sub * 0.1,
    sessionLapsRemain: null,
    sessionLapsTotal: null,
    sessionTimeRemainSeconds: 0,
    leaderFinished: true,
    playerFinished: true,
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

function createPitWindowScenarioSnapshot(nowMs: number): TelemetrySnapshot {
  // 12s cycle: before window (4s) → in window / pulsing (4s) → after pit (4s)
  const cycleMs = 12_000;
  const phase = Math.floor((nowMs % cycleMs) / 4000);
  const tankCapacity = 67;
  const fuelPerLap = 3.0;

  // Phase 0: too early to pit — full tank can't cover remaining laps
  // Phase 1: pit window open — full tank covers it, current fuel doesn't
  // Phase 2: just pitted — current fuel covers remaining laps
  const fuelLevel = [45, 20, 60][phase] ?? 45;
  const lapsRemain = [25, 10, 8][phase] ?? 25;
  const currentLap = [5, 20, 22][phase] ?? 5;

  return baseSnapshot({
    carPath: 'bmwm4gt3',
    gear: 4,
    rpm: 6800,
    maxRpm: 9000,
    currentLap,
    sessionLapsRemain: lapsRemain,
    sessionLapsTotal: 30,
    fuelLevel,
    fuelLevelPct: fuelLevel / tankCapacity,
    fuelPerLap,
    fuelLapCount: 4,
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
      case 'pit-window':
        return createPitWindowScenarioSnapshot(nowMs);
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
          carPath: 'stockcars2 mustang2019',
          maxRpm: 8400,
          gearCount: 4,
          positionOverall: 1,
          brakeBiasPercent: 50.0,
          tractionControlLevel: null,
          absLevel: null,
        }, nowMs);
      case 'mustang-nextgen':
        return createSweepSnapshot({
          carPath: 'stockcars ford mustang nextgen 2024',
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
      case 'no-leds':
        return createSweepSnapshot({
          carPath: 'unknown-car-no-leds',
          maxRpm: 7200,
          gearCount: 5,
          positionOverall: 5,
          brakeBiasPercent: 52.0,
          tractionControlLevel: null,
          absLevel: null,
        }, nowMs);
      case 'practice-long':
        return baseSnapshot({
          sessionTimeRemainSeconds: 168 * 3600, // 168 hours
          sessionType: 'time-based',
        });
      case 'road-finish':
        return createFinishCountdownSnapshot(nowMs);
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
