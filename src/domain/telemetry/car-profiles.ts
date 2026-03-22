import type { CarShiftProfile } from './types.js';

const DEFAULT_TRIGGERS = [0.55, 0.62, 0.69, 0.76, 0.82, 0.87, 0.91, 0.945, 0.97, 0.985];
const DEFAULT_COLORS = ['#22C55E', '#22C55E', '#84CC16', '#84CC16', '#EAB308', '#EAB308', '#F97316', '#F97316', '#EF4444', '#EF4444'];

export function resolveProfile(driverCarId: number): CarShiftProfile {
  return { carId: driverCarId, segmentTriggers: DEFAULT_TRIGGERS, segmentColors: DEFAULT_COLORS };
}
