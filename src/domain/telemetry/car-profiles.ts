import type { CarShiftProfile } from './types.js';
import carDataBundle from './lovely-car-data.json' with { type: 'json' };

const DEFAULT_TRIGGERS = [0.55, 0.62, 0.69, 0.76, 0.82, 0.87, 0.91, 0.945, 0.97, 0.985];
const DEFAULT_COLORS = ['#22C55E', '#22C55E', '#84CC16', '#84CC16', '#EAB308', '#EAB308', '#F97316', '#F97316', '#EF4444', '#EF4444'];

interface LovelyCarData {
  ledNumber: number;
  ledColor: string[];
  ledRpm: Array<Record<string, number[]>>;
}

const bundle = carDataBundle as Record<string, LovelyCarData>;

export function resolveProfile(driverCarId: number, carPath?: string | null, gear?: number | null, maxRpm?: number): CarShiftProfile {
  const carData = carPath ? bundle[carPath] : null;
  if (!carData || !maxRpm || maxRpm <= 0) {
    return { carId: driverCarId, segmentTriggers: DEFAULT_TRIGGERS, segmentColors: DEFAULT_COLORS };
  }

  const colors = parseColors(carData.ledColor);
  const ledCount = carData.ledNumber || colors.length;
  const rpmEntry = carData.ledRpm?.[0];
  if (!rpmEntry) {
    return { carId: driverCarId, segmentTriggers: DEFAULT_TRIGGERS.slice(0, ledCount), segmentColors: colors.slice(0, ledCount) };
  }

  const gearKey = gear != null && gear > 0 ? String(gear) : null;
  const rpmArray = (gearKey && rpmEntry[gearKey]) || findBestGearRpm(rpmEntry);
  if (!rpmArray || rpmArray.length < 2) {
    return { carId: driverCarId, segmentTriggers: DEFAULT_TRIGGERS.slice(0, ledCount), segmentColors: colors.slice(0, ledCount) };
  }

  const thresholds = rpmArray.slice(1, ledCount + 1);
  const triggers = thresholds.map((rpm) => Math.min(rpm / maxRpm, 1.0));
  return { carId: driverCarId, segmentTriggers: triggers, segmentColors: colors.slice(0, triggers.length) };
}

function parseColors(ledColor: string[]): string[] {
  if (!ledColor?.length) return DEFAULT_COLORS;
  const leds = ledColor.slice(1);
  return leds.map((c) => {
    if (c.startsWith('#') && c.length === 9) return '#' + c.slice(3);
    return c;
  });
}

function findBestGearRpm(entry: Record<string, number[]>): number[] | null {
  const gears = Object.keys(entry).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(b) - Number(a));
  if (gears.length) return entry[gears[0]];
  return entry['R'] || entry['N'] || null;
}
