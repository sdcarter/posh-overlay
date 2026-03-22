import React from 'react';
import type { RibbonState } from '../../domain/ribbon/types';

interface Props {
  state: RibbonState;
  rpm: number;
  maxRpm: number;
  pitLimiter: boolean;
}

export function Ribbon({ state, rpm, maxRpm, pitLimiter }: Props) {
  const rightItems = [
    state.incidentsText,
    state.brakeBiasText,
    state.tractionControlText,
    state.absText,
    pitLimiter ? 'PIT' : null,
  ].filter(Boolean);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: '1.1em', fontWeight: 700, color: '#eef0f4' }}>
        {rpm.toFixed(0)} / {maxRpm.toFixed(0)} RPM
      </span>
      <span style={{ fontSize: '1.1em', fontWeight: 700, color: '#f1f3f5', textAlign: 'right' }}>
        {rightItems.join('   ')}
      </span>
    </div>
  );
}
