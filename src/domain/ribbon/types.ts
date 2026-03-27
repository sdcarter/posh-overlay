export interface RibbonState {
  lapProgressText: string;
  incidentsText: string;
  brakeBiasText: string | null;
  tractionControlText: string | null;
  absText: string | null;
  fuelLapsText: string | null;
  fuelStatus: 'green' | 'yellow' | 'red' | null;
}
