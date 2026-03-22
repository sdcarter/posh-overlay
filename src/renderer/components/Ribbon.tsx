import React from 'react';
import type { RibbonState } from '../../domain/ribbon/types';

interface Props {
  state: RibbonState;
  source: string;
  driverCarId: number;
  pitLimiter: boolean;
}

export function Ribbon({ state, source, driverCarId, pitLimiter }: Props) {
  const topLine = [state.incidentsText, state.brakeBiasText ?? 'BB -', state.tractionControlText ?? 'TC -'].join('   ');
  const bottomLine = `${source}  Car ${driverCarId}  Pit ${pitLimiter ? 'ON' : 'OFF'}`;

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f3f5' }}>{topLine}</div>
      <div style={{ fontSize: 13, color: 'rgba(180, 191, 203, 1)' }}>{bottomLine}</div>
    </div>
  );
}
