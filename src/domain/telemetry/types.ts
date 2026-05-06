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
  shiftIndicatorPct: number | null;
  pitLimiterActive: boolean;
  sessionLapsRemain: number | null;
  sessionLastLapTimeSeconds: number | null;
  sessionAvgLapTimeSeconds: number | null;
  incidentCount: number;
  incidentLimit: number | null;
  brakeBiasPercent: number | null;
  hasTracionControl: boolean;
  tractionControlLevel: number | null;
  // Multiple traction control channels (TC1, TC2, ...) if the car exposes them
  tractionControlLevels?: (number | null)[] | null;
  hasABSControl: boolean;
  absLevel: number | null;
  fuelLevel: number | null;
  fuelLevelPct: number | null;
  fuelPerLap: number | null;
  fuelLapCount: number | null;
  throttle: number;
  brake: number;
  clutch: number;
  absActive: boolean;
  speedKmH: number;
  sessionState: number;
  playerFinished: boolean;
  leaderFinished: boolean;
  isOnTrack: boolean;
  isReplayPlaying: boolean;
  sessionLapsTotal: number | null;
  sessionTimeRemainSeconds: number | null;
  sessionType: 'lap-based' | 'time-based';
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
