export interface TelemetrySnapshot {
  timestampMs: number;
  driverCarId: number;
  positionOverall: number | null;
  carPath: string | null;
  currentLap: number | null;
  lapDistPct: number | null;
  leaderLap: number | null;
  leaderLapDistPct: number | null;
  gear: number | null;
  rpm: number;
  maxRpm: number;
  pitLimiterActive: boolean;
  sessionLapsRemain: number | null;
  sessionLapsTotal: number | null;
  sessionTimeRemainSeconds: number | null;
  sessionLastLapTimeSeconds: number | null;
  incidentCount: number;
  incidentLimit: number | null;
  brakeBiasPercent: number | null;
  tractionControlLevel: number | null;
  absLevel: number | null;
  fuelLevel: number | null;
  fuelPerLap: number | null;
  throttle: number;
  brake: number;
  absActive: boolean;
  speedKmH: number;
  sessionState: number;
  playerFinished: boolean;
  leaderFinished: boolean;
}

export interface CarShiftProfile {
  carId: number;
  ledRpms: number[];
  ledColors: string[];
  redlineRpm: number;
  redlineColor: string;
  redlineBlinkInterval: number;
  isTopGear: boolean;
}
