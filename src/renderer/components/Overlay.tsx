import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const PANEL_W = 960;
const PANEL_H = 150;

export function Overlay({ frame, waitingMessage, locked }: Props) {
  const [pos, setPos] = useState({ x: 80, y: 40 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (locked) return;
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  }, [locked, pos]);

  useEffect(() => {
    if (locked) return;
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [locked]);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    left: pos.x,
    top: pos.y,
    width: PANEL_W,
    height: PANEL_H,
    padding: '12px 18px',
    borderRadius: 18,
    background: 'rgba(18, 22, 28, 0.82)',
    border: locked ? '1.5px solid rgba(90, 100, 115, 0.7)' : '2px dashed rgba(255, 209, 102, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    overflow: 'hidden',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#eef0f4',
    userSelect: 'none',
    cursor: locked ? 'default' : 'move',
    boxSizing: 'border-box',
  };

  if (!frame) {
    return (
      <div style={panelStyle} onMouseDown={onMouseDown}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
          PrecisionDash Overlay Running &nbsp;|&nbsp; {waitingMessage}
        </span>
        {!locked && <UnlockedBadge />}
      </div>
    );
  }

  const { snapshot, revStrip, ribbon, useMock } = frame;
  const source = useMock ? 'MOCK' : 'LIVE';
  const statusText = useMock ? 'Mock telemetry stream' : 'Live iRacing telemetry stream';

  return (
    <div style={panelStyle} onMouseDown={onMouseDown}>
      <RevStrip state={revStrip} rpm={snapshot.rpm} maxRpm={snapshot.maxRpm} />
      <Ribbon state={ribbon} source={source} driverCarId={snapshot.driverCarId} pitLimiter={snapshot.pitLimiterActive} />
      <div style={{ fontSize: 9, color: 'rgba(255,209,102,0.58)', textAlign: 'right' }}>
        {statusText}
        {!locked && ' — UNLOCKED (drag to reposition)'}
      </div>
    </div>
  );
}

function UnlockedBadge() {
  return (
    <div style={{ fontSize: 11, color: 'rgba(255,209,102,0.85)', marginTop: 4 }}>
      🔓 Unlocked — drag to reposition. Lock via tray icon.
    </div>
  );
}
