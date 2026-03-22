import type { CarShiftProfile } from './types.js';
import carDataBundle from './lovely-car-data.json' with { type: 'json' };

const DEFAULT_LED_COUNT = 10;
const DEFAULT_COLORS = ['#22C55E', '#22C55E', '#84CC16', '#84CC16', '#EAB308', '#EAB308', '#F97316', '#F97316', '#EF4444', '#EF4444'];
const DEFAULT_REDLINE_COLOR = '#3B82F6';
const DEFAULT_BLINK_INTERVAL = 100;

interface LovelyCarData {
  ledNumber: number;
  redlineBlinkInterval: number;
  ledColor: string[];
  ledRpm: Array<Record<string, number[]>>;
}

const bundle = carDataBundle as Record<string, LovelyCarData>;

export function resolveProfile(driverCarId: number, carPath?: string | null, gear?: number | null, maxRpm?: number): CarShiftProfile {
  const carData = carPath ? bundle[carPath] : null;
  if (!carData || !maxRpm || maxRpm <= 0) {
    return defaultProfile(driverCarId, maxRpm ?? 0);
  }

  const ledCount = carData.ledNumber || DEFAULT_LED_COUNT;
  const colors = parseColors(carData.ledColor, ledCount);
  const redlineColor = parseHex(carData.ledColor?.[0]) || DEFAULT_REDLINE_COLOR;
  const blinkInterval = carData.redlineBlinkInterval || DEFAULT_BLINK_INTERVAL;

  const rpmEntry = carData.ledRpm?.[0];
  if (!rpmEntry) {
    return defaultProfile(driverCarId, maxRpm);
  }

  const gearKey = gear != null && gear > 0 ? String(gear) : null;
  const rpmArray = (gearKey && rpmEntry[gearKey]) || findBestGearRpm(rpmEntry);
  if (!rpmArray || rpmArray.length < 2) {
    return defaultProfile(driverCarId, maxRpm);
  }

  const redlineRpm = rpmArray[0];
  const ledRpms = rpmArray.slice(1, ledCount + 1);

  return { carId: driverCarId, ledRpms, ledColors: colors, redlineRpm, redlineColor, redlineBlinkInterval: blinkInterval };
}

function defaultProfile(carId: number, maxRpm: number): CarShiftProfile {
  const triggers = [0.55, 0.62, 0.69, 0.76, 0.82, 0.87, 0.91, 0.945, 0.97, 0.985];
  return {
    carId,
    ledRpms: triggers.map((t) => t * maxRpm),
    ledColors: DEFAULT_COLORS,
    redlineRpm: maxRpm * 0.98,
    redlineColor: DEFAULT_REDLINE_COLOR,
    redlineBlinkInterval: DEFAULT_BLINK_INTERVAL,
  };
}

function parseHex(color?: string): string | null {
  if (!color) return null;
  if (color.startsWith('#') && color.length === 9) return '#' + color.slice(3);
  return color === '#00000000' ? null : color;
}

function parseColors(ledColor: string[], ledCount: number): string[] {
  if (!ledColor?.length) return DEFAULT_COLORS.slice(0, ledCount);
  const leds = ledColor.slice(1, ledCount + 1);
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
