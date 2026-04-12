import type { CarShiftProfile } from './types.js';
import carDataBundle from './lovely-car-data.json' with { type: 'json' };

const DEFAULT_REDLINE_COLOR = '#3B82F6';
const DEFAULT_BLINK_INTERVAL = 100;
const DEFAULT_LED_COUNT = 10;

interface LovelyCarData {
  ledNumber: number;
  redlineBlinkInterval: number;
  ledColor: string[];
  ledRpm: Array<Record<string, number[]>>;
}

const bundle = carDataBundle as Record<string, LovelyCarData>;

const normalizedBundle = new Map<string, LovelyCarData>();
for (const [key, value] of Object.entries(bundle)) {
  normalizedBundle.set(normalize(key), value);
}

function normalize(s: string): string {
  return s.toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function lookupCar(carPath: string): LovelyCarData | null {
  return normalizedBundle.get(normalize(carPath)) ?? null;
}

export function resolveProfile(driverCarId: number, carPath?: string | null, gear?: number | null, maxRpm?: number): CarShiftProfile | null {
  const carData = carPath ? lookupCar(carPath) : null;
  if (!carData || !maxRpm || maxRpm <= 0) return null;

  const ledCount = carData.ledNumber || DEFAULT_LED_COUNT;
  const colors = parseColors(carData.ledColor, ledCount);
  const redlineColor = parseHex(carData.ledColor?.[0]) || DEFAULT_REDLINE_COLOR;
  const blinkInterval = carData.redlineBlinkInterval || DEFAULT_BLINK_INTERVAL;

  const rpmEntry = carData.ledRpm?.[0];
  if (!rpmEntry) return null;

  const gearKey = gear != null && gear > 0 ? String(gear) : null;
  const rpmArray = (gearKey && rpmEntry[gearKey]) || findBestGearRpm(rpmEntry);
  if (!rpmArray || rpmArray.length < 1) return null;

  const maxGear = Object.keys(rpmEntry).filter((k) => /^\d+$/.test(k)).reduce((m, k) => Math.max(m, Number(k)), 0);
  const isTopGear = gear != null && gear >= maxGear;

  const redlineRpm = rpmArray[0];
  // If only 1 RPM is provided, it's a single shift light. Otherwise, slice from index 1.
  const ledRpms = rpmArray.length === 1 ? [rpmArray[0]] : rpmArray.slice(1, ledCount + 1);

  return { carId: driverCarId, ledRpms, ledColors: colors, redlineRpm, redlineColor, redlineBlinkInterval: blinkInterval, isTopGear };
}

function parseHex(color?: string): string | null {
  if (!color) return null;
  if (color.startsWith('#') && color.length === 9) return '#' + color.slice(3);
  return color === '#00000000' ? null : color;
}

function parseColors(ledColor: string[], ledCount: number): string[] {
  if (!ledColor?.length) return [];
  // If only 1 color is provided, use it for the one LED. Otherwise slice from index 1.
  const leds = (ledCount === 1 && ledColor.length === 1) ? [ledColor[0]] : ledColor.slice(1, ledCount + 1);
  return leds.map((c) => {
    if (c === '#00000000') return 'transparent';
    return parseHex(c) || '#FFFFFF';
  });
}

function findBestGearRpm(entry: Record<string, number[]>): number[] | null {
  const gears = Object.keys(entry).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(b) - Number(a));
  if (gears.length) return entry[gears[0]];
  return entry['R'] || entry['N'] || null;
}
