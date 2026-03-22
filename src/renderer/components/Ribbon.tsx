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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexShrink: 0 }}>
      <span style={{ fontSize: '1.1em', fontWeight: 700, color: '#eef0f4' }}>
        {rpm.toFixed(0)} / {maxRpm.toFixed(0)} RPM
      </span>
      <span style={{ fontSize: '1.1em', fontWeight: 700, color: '#f1f3f5', textAlign: 'right' }}>
        {rightItems.map((item, i) => (
          <span key={i}>
            {i > 0 && <span style={{ margin: '0 0.45em', color: 'rgba(255,209,102,0.45)' }}>·</span>}
            {item}
          </span>
        ))}
      </span>
    </div>
  );
}
