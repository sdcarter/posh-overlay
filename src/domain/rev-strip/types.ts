export type FlashMode = 'none' | 'pit-limiter' | 'redline';

export interface RevStripState {
  ledOn: boolean[];
  ledColors: string[];
  flashMode: FlashMode;
  redlineColor: string;
  redlineBlinkInterval: number;
  ledCount: number;
}
