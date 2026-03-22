import React from 'react';
import { RevStrip } from './RevStrip';
import { Ribbon } from './Ribbon';
import type { TelemetrySnapshot } from '../../domain/telemetry/types';
import type { RevStripState } from '../../domain/rev-strip/types';
import type { RibbonState } from '../../domain/ribbon/types';

interface Props {
  frame: { snapshot: TelemetrySnapshot; revStrip: RevStripState; ribbon: RibbonState; useMock: boolean } | null;
  waitingMessage: string;
  locked: boolean;
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  background: 'transparent',
  color: '#eef0f4',
  userSelect: 'none',
};

const panelBase: React.CSSProperties = {
  margin: 8,
  padding: '12px 18px',
  borderRadius: 18,
  background: 'rgba(18, 22, 28, 0.82)',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  overflow: 'hidden',
};

export function Overlay({ frame, waitingMessage, locked }: Props) {
  const panelStyle: React.CSSProperties = {
    ...panelBase,
    border: locked
      ? '1.5px solid rgba(90, 100, 115, 0.7)'
      : '2px dashed rgba(255, 209, 102, 0.8)',
  };

  const dragStyle: React.CSSProperties = locked
    ? {}
    : { WebkitAppRegion: 'drag' as any, cursor: 'move' };

  if (!frame) {
    return (
      <div style={{ ...containerStyle, ...dragStyle }}>
        <div style={panelStyle}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
            PrecisionDash Overlay Running &nbsp;|&nbsp; {waitingMessage}
          </span>
          {!locked && <UnlockedBadge />}
        </div>
      </div>
    );
  }

  const { snapshot, revStrip, ribbon, useMock } = frame;
  const source = useMock ? 'MOCK' : 'LIVE';
  const statusText = useMock ? 'Mock telemetry stream' : 'Live iRacing telemetry stream';

  return (
    <div style={{ ...containerStyle, ...dragStyle }}>
      <div style={panelStyle}>
        <RevStrip state={revStrip} rpm={snapshot.rpm} maxRpm={snapshot.maxRpm} />
        <Ribbon state={ribbon} source={source} driverCarId={snapshot.driverCarId} pitLimiter={snapshot.pitLimiterActive} />
        <div style={{ fontSize: 9, color: 'rgba(255,209,102,0.58)', textAlign: 'right' }}>
          {statusText}
          {!locked && ' — UNLOCKED (drag to move, resize edges)'}
        </div>
      </div>
    </div>
  );
}

function UnlockedBadge() {
  return (
    <div style={{ fontSize: 11, color: 'rgba(255,209,102,0.85)', marginTop: 4 }}>
      🔓 Unlocked — drag to move, resize edges. Lock via tray icon.
    </div>
  );
}
