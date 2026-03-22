import React from 'react';
import { RevStrip } from './RevStrip';
import { Ribbon } from './Ribbon';
import type { TelemetrySnapshot } from '../../domain/telemetry/types';
import type { RevStripState } from '../../domain/rev-strip/types';
import type { RibbonState } from '../../domain/ribbon/types';

interface Props {
  frame: { snapshot: TelemetrySnapshot; revStrip: RevStripState; ribbon: RibbonState; useMock: boolean } | null;
  waitingMessage: string;
}

const containerStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  background: 'transparent',
  color: '#eef0f4',
  userSelect: 'none',
};

const panelStyle: React.CSSProperties = {
  margin: 8,
  padding: '12px 18px',
  borderRadius: 18,
  background: 'rgba(18, 22, 28, 0.82)',
  border: '1.5px solid rgba(90, 100, 115, 0.7)',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

export function Overlay({ frame, waitingMessage }: Props) {
  if (!frame) {
    return (
      <div style={containerStyle}>
        <div style={panelStyle}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
            PrecisionDash Overlay Running &nbsp;|&nbsp; {waitingMessage}
          </span>
        </div>
      </div>
    );
  }

  const { snapshot, revStrip, ribbon, useMock } = frame;
  const source = useMock ? 'MOCK' : 'LIVE';
  const statusText = useMock ? 'Mock telemetry stream' : 'Live iRacing telemetry stream';

  return (
    <div style={containerStyle}>
      <div style={panelStyle}>
        <RevStrip state={revStrip} rpm={snapshot.rpm} maxRpm={snapshot.maxRpm} />
        <Ribbon state={ribbon} source={source} driverCarId={snapshot.driverCarId} pitLimiter={snapshot.pitLimiterActive} />
        <div style={{ fontSize: 9, color: 'rgba(255,209,102,0.58)', textAlign: 'right' }}>{statusText}</div>
      </div>
    </div>
  );
}
