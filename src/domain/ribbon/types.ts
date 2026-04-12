export interface RibbonState {
  incidentsText: string;
  brakeBiasText: string | null;
  tractionControlText: string | null;
  absText: string | null;
  fuelLapsText: string | null;
  fuelStatus: 'green' | 'yellow' | 'red' | 'stabilizing' | null;
  lapsRemaining: number | null;
  finished: boolean;
  lapInfoText: string;
  visible: boolean;
}
