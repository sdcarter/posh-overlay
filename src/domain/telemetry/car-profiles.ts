import type { CarShiftProfile } from './types.js';
import type { LovelyCarData } from '../../adapters/car-data-lovely/lovely-car-data-client.js';

const DEFAULT_TRIGGERS = [0.55, 0.62, 0.69, 0.76, 0.82, 0.87, 0.91, 0.945, 0.97, 0.985];
const DEFAULT_COLORS = ['#22C55E', '#22C55E', '#84CC16', '#84CC16', '#EAB308', '#EAB308', '#F97316', '#F97316', '#EF4444', '#EF4444'];

export function resolveProfile(_driverCarId: number): CarShiftProfile {
  return { carId: _driverCarId, segmentTriggers: DEFAULT_TRIGGERS, segmentColors: DEFAULT_COLORS };
}

export function resolveProfileFromLovely(driverCarId: number, carData: LovelyCarData, gear: number | null, maxRpm: number): CarShiftProfile {
  const colors = parseColors(carData.ledColor);
  const ledCount = carData.ledNumber || colors.length;

  const gearKey = gear != null && gear > 0 ? String(gear) : null;
  const rpmEntry = carData.ledRpm?.[0];
  if (!rpmEntry || !maxRpm || maxRpm <= 0) {
    return { carId: driverCarId, segmentTriggers: DEFAULT_TRIGGERS.slice(0, ledCount), segmentColors: colors.slice(0, ledCount) };
  }

  // Find the RPM array for the current gear, fall back to highest available gear
  const rpmArray = (gearKey && rpmEntry[gearKey]) || findBestGearRpm(rpmEntry);
  if (!rpmArray || rpmArray.length < 2) {
    return { carId: driverCarId, segmentTriggers: DEFAULT_TRIGGERS.slice(0, ledCount), segmentColors: colors.slice(0, ledCount) };
  }

  // rpmArray[0] is redline, rpmArray[1..N] are LED thresholds
  const thresholds = rpmArray.slice(1, ledCount + 1);
  const triggers = thresholds.map((rpm) => Math.min(rpm / maxRpm, 1.0));

  return { carId: driverCarId, segmentTriggers: triggers, segmentColors: colors.slice(0, triggers.length) };
}

function parseColors(ledColor: string[]): string[] {
  if (!ledColor?.length) return DEFAULT_COLORS;
  // Skip first entry (redline color), rest are LED colors
  const leds = ledColor.slice(1);
  return leds.map((c) => {
    // Format: "#AARRGGBB" (ARGB) or "#RRGGBB" or color name
    if (c.startsWith('#') && c.length === 9) return '#' + c.slice(3); // strip alpha, keep RGB
    return c;
  });
}

function findBestGearRpm(entry: Record<string, number[]>): number[] | null {
  // Try highest numbered gear first
  const gears = Object.keys(entry).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(b) - Number(a));
  if (gears.length) return entry[gears[0]];
  // Fall back to R or N
  return entry['R'] || entry['N'] || null;
}
