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
    .replace(/[^a-z0-9]/g, '');
}

function lookupCar(carPath: string): LovelyCarData | null {
  const norm = normalize(carPath);
  
  // 1. Try exact normalized match
  const exact = normalizedBundle.get(norm);
  if (exact) return exact;

  // 2. Try stripping common suffixes if no match (e.g. '2024')
  const baseNorm = norm.replace('2024', '');
  const baseMatch = normalizedBundle.get(baseNorm);
  if (baseMatch) return baseMatch;

  // 3. Last ditch: try if the incoming path contains any of our known keys
  for (const [key, value] of normalizedBundle.entries()) {
    if (norm.includes(key) || key.includes(norm)) {
      return value;
    }
  }

  return null;
}

export function resolveProfile(driverCarId: number, carPath?: string | null, gear?: number | null, maxRpm?: number): CarShiftProfile | null {
  const carData = carPath ? lookupCar(carPath) : null;
  if (!carData || !maxRpm || maxRpm <= 0) return null;

  const ledCount = carData.ledNumber || DEFAULT_LED_COUNT;
  const rpmEntry = carData.ledRpm?.[0];
  if (!rpmEntry) return null;

  const gearKey = gear != null && gear > 0 ? String(gear) : null;
  const rpmArray = (gearKey && rpmEntry[gearKey]) || findBestGearRpm(rpmEntry);
  if (!rpmArray || rpmArray.length < 1) return null;

  const maxGear = Object.keys(rpmEntry).filter((k) => /^\d+$/.test(k)).reduce((m, k) => Math.max(m, Number(k)), 0);
  const isTopGear = gear != null && gear >= maxGear;

  const redlineRpm = rpmArray[0];
  
  // Decide whether to slice based on lengths. 
  // If rpmArray matches ledCount, use them all.
  // If rpmArray is ledCount + 1, it follows the legacy LSR format where first is overall redline.
  const useFullRpm = rpmArray.length === ledCount;
  const ledRpms = useFullRpm ? rpmArray : (rpmArray.length === 1 ? [rpmArray[0]] : rpmArray.slice(1, ledCount + 1));

  // Same logic for colors
  const useFullColors = carData.ledColor?.length === ledCount;
  const colorsSource = useFullColors ? carData.ledColor : carData.ledColor.slice(1, ledCount + 1);
  const colors = parseColors(colorsSource);

  const redlineColor = parseHex(carData.ledColor?.[0]) || DEFAULT_REDLINE_COLOR;
  const blinkInterval = carData.redlineBlinkInterval || DEFAULT_BLINK_INTERVAL;

  return { carId: driverCarId, ledRpms, ledColors: colors, redlineRpm, redlineColor, redlineBlinkInterval: blinkInterval, isTopGear };
}

function parseHex(color?: string): string | null {
  if (!color) return null;
  if (color.startsWith('#') && color.length === 9) return '#' + color.slice(3);
  return color === '#00000000' ? null : color;
}

function parseColors(ledColors: string[]): string[] {
  if (!ledColors?.length) return [];
  return ledColors.map((c) => {
    if (c === '#00000000') return 'transparent';
    return parseHex(c) || '#FFFFFF';
  });
}

function findBestGearRpm(entry: Record<string, number[]>): number[] | null {
  const gears = Object.keys(entry).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(b) - Number(a));
  if (gears.length) return entry[gears[0]];
  return entry['R'] || entry['N'] || null;
}
