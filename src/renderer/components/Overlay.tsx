import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RevStrip } from './RevStrip';
import { Ribbon } from './Ribbon';
import type { TelemetrySnapshot } from '../../domain/telemetry/types';
import type { RevStripState } from '../../domain/rev-strip/types';
import type { RibbonState } from '../../domain/ribbon/types';

interface Props {
  frame: { snapshot: TelemetrySnapshot; revStrip: RevStripState | null; ribbon: RibbonState; useMock: boolean } | null;
  waitingMessage: string;
  locked: boolean;
}

export function Overlay({ frame, waitingMessage, locked }: Props) {
  const [pos, setPos] = useState({ x: 80, y: 40 });
  const [size, setSize] = useState({ w: 960, h: 150 });
  const dragging = useRef<'move' | 'resize' | null>(null);
  const dragStart = useRef({ mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 });
  const prevLocked = useRef(locked);

  useEffect(() => {
    window.electronAPI.getLayout().then((layout) => {
      if (layout) { setPos({ x: layout.x, y: layout.y }); setSize({ w: layout.w, h: layout.h }); }
    });
  }, []);

  useEffect(() => {
    if (locked && !prevLocked.current) {
      window.electronAPI.saveLayout({ x: pos.x, y: pos.y, w: size.w, h: size.h });
    }
    prevLocked.current = locked;
  }, [locked, pos, size]);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    if (locked) return;
    dragging.current = 'move';
    dragStart.current = { mx: e.clientX, my: e.clientY, x: pos.x, y: pos.y, w: size.w, h: size.h };
    e.preventDefault();
  }, [locked, pos, size]);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    if (locked) return;
    dragging.current = 'resize';
    dragStart.current = { mx: e.clientX, my: e.clientY, x: pos.x, y: pos.y, w: size.w, h: size.h };
    e.preventDefault();
    e.stopPropagation();
  }, [locked, pos, size]);

  useEffect(() => {
    if (locked) return;
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      if (dragging.current === 'move') {
        setPos({ x: dragStart.current.x + dx, y: dragStart.current.y + dy });
      } else {
        setSize({ w: Math.max(200, dragStart.current.w + dx), h: Math.max(50, dragStart.current.h + dy) });
      }
    };
    const onUp = () => { dragging.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [locked]);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    left: pos.x,
    top: pos.y,
    width: size.w,
    height: size.h,
    padding: '12px 18px',
    borderRadius: 18,
    background: 'rgba(18, 22, 28, 0.82)',
    border: locked ? '1.5px solid rgba(90, 100, 115, 0.7)' : '2px dashed rgba(255, 209, 102, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    overflow: 'hidden',
    fontSize: `${size.h / 6}px`,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#eef0f4',
    userSelect: 'none',
    pointerEvents: 'auto',
    cursor: locked ? 'default' : 'move',
    boxSizing: 'border-box',
  };

  const resizeHandle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 20,
    height: 20,
    cursor: 'nwse-resize',
    background: 'rgba(255, 209, 102, 0.4)',
    borderRadius: '0 0 18px 0',
  };

  const content = frame ? (
    <>
      {frame.revStrip && (
        <div style={{ flex: 1, minHeight: 0 }}>
          <RevStrip state={frame.revStrip} />
        </div>
      )}
      <Ribbon state={frame.ribbon} rpm={frame.snapshot.rpm} maxRpm={frame.snapshot.maxRpm} pitLimiter={frame.snapshot.pitLimiterActive} />
      {!locked && (
        <div style={{ fontSize: '0.65em', color: 'rgba(255,209,102,0.58)', textAlign: 'right' }}>
          UNLOCKED — drag to move, corner to resize
        </div>
      )}
    </>
  ) : (
    <>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
        PoshDash Overlay Running &nbsp;|&nbsp; {waitingMessage}
      </span>
      {!locked && (
        <div style={{ fontSize: 11, color: 'rgba(255,209,102,0.85)', marginTop: 4 }}>
          🔓 Unlocked — drag to move, corner to resize. Lock via tray icon.
        </div>
      )}
    </>
  );

  return (
    <div style={panelStyle} onMouseDown={onDragStart}>
      {content}
      {!locked && <div style={resizeHandle} onMouseDown={onResizeStart} />}
    </div>
  );
}
