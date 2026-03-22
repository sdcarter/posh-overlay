export interface TelemetrySnapshot {
  timestampMs: number;
  driverCarId: number;
  carPath: string | null;
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
