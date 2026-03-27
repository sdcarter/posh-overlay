export type FuelStatus = 'green' | 'yellow' | 'red';

const roundToSingleDecimal = (value: number): number => Math.round(value * 10) / 10;

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
  raceLapsRemaining: number
): FuelStatus {
  if (!Number.isFinite(fuelLapsRemaining) || !Number.isFinite(raceLapsRemaining)) {
    return 'red';
  }

  if (fuelLapsRemaining >= raceLapsRemaining) {
    return 'green';
  }

  const deficit = raceLapsRemaining - fuelLapsRemaining;
  return deficit <= 1 ? 'yellow' : 'red';
}
