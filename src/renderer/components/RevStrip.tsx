import React from 'react';
import type { RevStripState } from '../../domain/rev-strip/types';

interface Props {
  state: RevStripState;
  rpm: number;
  maxRpm: number;
}

export function RevStrip({ state, rpm, maxRpm }: Props) {
  const segmentCount = Math.max(state.segmentColors?.length ?? 0, 10);
  const isAtLimiter = maxRpm > 0 && rpm >= maxRpm * 0.995;
  const shouldFlash = (state.flashMode !== 'none' || isAtLimiter) && Date.now() % 320 < 160;

  return (
    <div>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: segmentCount }, (_, i) => {
          const active = i < state.activeSegments;
          let color = active ? (state.segmentColors?.[i] ?? '#22C55E') : 'rgb(45, 56, 68)';

          if (shouldFlash) {
            color = isAtLimiter || state.flashMode === 'pit-limiter' ? 'rgb(64, 196, 255)' : 'rgb(255, 244, 92)';
          }

          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 36,
                borderRadius: 8,
                background: color,
                border: `${active ? 1.4 : 1}px solid rgba(255,255,255,${active ? 0.86 : 0.35})`,
                transition: 'background 0.05s',
              }}
            />
          );
        })}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: '#eef0f4' }}>
        {rpm.toFixed(0)} / {maxRpm.toFixed(0)} RPM
      </div>
    </div>
  );
}
