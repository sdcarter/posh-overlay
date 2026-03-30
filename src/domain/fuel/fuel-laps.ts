export type FuelStatus = 'green' | 'yellow' | 'red' | 'stabilizing';

const roundToSingleDecimal = (value: number): number => Math.round(value * 10) / 10;

export function isLapConsumptionOutlier(consumed: number, average: number): boolean {
  if (average <= 0) return false;
  const deviation = Math.abs(consumed - average) / average;
  return deviation > 0.2;
}

export function calculateFuelLapsRemaining(fuelLevel: number, fuelPerLap: number): number {
  if (!Number.isFinite(fuelLevel) || !Number.isFinite(fuelPerLap) || fuelPerLap <= 0) {
    return 0;
  }

  const laps = fuelLevel / fuelPerLap;
  if (!Number.isFinite(laps) || laps < 0) {
    return 0;
  }

  return roundToSingleDecimal(laps);
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
