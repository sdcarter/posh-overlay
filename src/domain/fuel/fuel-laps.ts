export type FuelStatus = 'green' | 'yellow' | 'red' | 'stabilizing';

const roundToSingleDecimal = (value: number): number => Math.round(value * 10) / 10;

// Safety margin subtracted from displayed laps remaining to be conservative
const SAFETY_MARGIN_LAPS = 0.5;

// Session flag bits indicating non-green conditions
const FLAG_YELLOW  = 0x00004000;
const FLAG_CAUTION = 0x00008000;
const FLAG_RED     = 0x00010000;
export const CAUTION_FLAGS_MASK = FLAG_YELLOW | FLAG_CAUTION | FLAG_RED;

export function isGreenFlagCondition(sessionFlags: number): boolean {
  return (sessionFlags & CAUTION_FLAGS_MASK) === 0;
}

export function isLapConsumptionOutlier(consumed: number, history: number[]): boolean {
  // Need at least 2 laps before we can make meaningful comparisons
  if (history.length < 2) return false;

  const average = history.reduce((a, b) => a + b, 0) / history.length;
  if (average <= 0) return false;

  // With fewer than 3 laps use a wider simple deviation check
  if (history.length < 3) {
    return Math.abs(consumed - average) / average > 0.30;
  }

  // IQR-based outlier detection (robust for small samples)
  const sorted = [...history].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 2.0 * iqr;
  const upper = q3 + 2.0 * iqr;

  // Keep laps within 15% of mean regardless, to avoid over-filtering consistent sessions
  const withinTolerance = Math.abs(consumed - average) <= average * 0.15;
  return !withinTolerance && (consumed < lower || consumed > upper);
}

export function calculateFuelLapsRemaining(fuelLevel: number, fuelPerLap: number): number {
  if (!Number.isFinite(fuelLevel) || !Number.isFinite(fuelPerLap) || fuelPerLap <= 0) {
    return 0;
  }

  const laps = fuelLevel / fuelPerLap;
  if (!Number.isFinite(laps) || laps < 0) {
    return 0;
  }

  // Subtract safety margin to keep the displayed number conservative
  return roundToSingleDecimal(Math.max(0, laps - SAFETY_MARGIN_LAPS));
}

export function evaluateFuelStatus(
  fuelLapsRemaining: number,
  raceLapsRemaining: number,
  lapCount: number | null = 4
): FuelStatus {
  if (!Number.isFinite(fuelLapsRemaining) || !Number.isFinite(raceLapsRemaining)) {
    return 'red';
  }

  if (lapCount !== null && lapCount > 0 && lapCount < 4) {
    return 'stabilizing';
  }

  // Add a 0.2 lap safety buffer so Green means you're comfortably safe
  if (fuelLapsRemaining >= raceLapsRemaining + 0.2) {
    return 'green';
  }

  const deficit = raceLapsRemaining - fuelLapsRemaining;
  return deficit <= 1.0 ? 'yellow' : 'red';
}

export function isPitWindowOpen(
  fuelLevel: number,
  fuelLevelPct: number,
  fuelPerLap: number,
  raceLapsRemaining: number,
  fuelLapCount: number | null,
): boolean {
  if (fuelLapCount == null || fuelLapCount < 4) return false;
  if (fuelLevelPct <= 0 || fuelPerLap <= 0) return false;

  const tankCapacity = fuelLevel / fuelLevelPct;
  const tankCapacityLaps = tankCapacity / fuelPerLap;
  const fuelLaps = fuelLevel / fuelPerLap;

  return tankCapacityLaps >= raceLapsRemaining && fuelLaps < raceLapsRemaining;
}