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

  // Add a 0.2 lap safety buffer so Green means you're comfortably safe
  if (fuelLapsRemaining >= raceLapsRemaining + 0.2) {
    return 'green';
  }

  // Yellow if you have less than the safety buffer but at least enough to finish
  // Wait, actually, if deficit <= 1 it's yellow. Let's make it so if you're within 1 lap deficit
  // (meaning you're negative by up to 1 lap, OR positive but under the safety margin) it's yellow.
  const deficit = raceLapsRemaining - fuelLapsRemaining;
  return deficit <= 1.0 ? 'yellow' : 'red';
}
