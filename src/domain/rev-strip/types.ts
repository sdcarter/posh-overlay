export type FlashMode = 'none' | 'pit-limiter' | 'shift-point';

export interface RevStripState {
  activeSegments: number;
  segmentColors: string[];
  flashMode: FlashMode;
}
