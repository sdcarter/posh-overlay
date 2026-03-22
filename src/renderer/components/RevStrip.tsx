import React, { useEffect, useRef, useState } from 'react';
import type { RevStripState } from '../../domain/rev-strip/types';

interface Props {
  state: RevStripState;
}

const OFF_COLOR = 'rgb(45, 56, 68)';
const PIT_COLOR = '#FFFF00';
const FLASH_WHITE = '#FFFFFF';

export function RevStrip({ state }: Props) {
  const [flashOn, setFlashOn] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (state.flashMode === 'none') {
      setFlashOn(true);
      intervalRef.current = null;
    } else {
      const ms = state.flashMode === 'redline' ? Math.max(state.redlineBlinkInterval / 2, 40) : 160;
      setFlashOn(true);
      intervalRef.current = setInterval(() => setFlashOn((v) => !v), ms);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.flashMode, state.redlineBlinkInterval]);

  return (
    <div style={{ display: 'flex', gap: '1.5%', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
      {state.ledColors.map((ledColor, i) => {
        const isSpacer = ledColor === 'transparent';
        let color: string;
        if (isSpacer) {
          color = 'transparent';
        } else if (state.flashMode === 'redline') {
          color = flashOn ? (state.redlineColor || '#3B82F6') : FLASH_WHITE;
        } else if (state.flashMode === 'pit-limiter') {
          color = flashOn ? PIT_COLOR : OFF_COLOR;
        } else {
          color = state.ledOn[i] ? ledColor : OFF_COLOR;
        }

        const active = !isSpacer && (state.flashMode !== 'none' || state.ledOn[i]);
        return (
          <div
            key={i}
            style={{
              flex: '1 1 0',
              maxHeight: '100%',
              aspectRatio: '1',
              borderRadius: '50%',
              background: color,
              border: isSpacer ? 'none' : `${active ? 1.4 : 1}px solid rgba(255,255,255,${active ? 0.86 : 0.35})`,
              transition: state.flashMode === 'none' ? 'background 0.05s' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}
