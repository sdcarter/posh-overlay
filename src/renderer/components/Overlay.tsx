import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TelemetrySnapshot } from '../../domain/telemetry/types';
import { isDriverFinished, lapsRemainingForDriver } from '../../domain/telemetry/lap-count';
import type { RevStripState } from '../../domain/rev-strip/types';
import type { RibbonState } from '../../domain/ribbon/types';

interface Props {
  frame: { snapshot: TelemetrySnapshot; revStrip: RevStripState | null; ribbon: RibbonState; useMock: boolean } | null;
  waitingMessage: string;
  locked: boolean;
}

const OFF_DOT = 'rgb(54, 62, 74)';
const PIT_DOT = '#f4de57';
const FLASH_WHITE = '#ffffff';

function formatGear(gear: number | null): string {
  if (gear == null) return '--';
  if (gear < 0) return 'R';
  if (gear === 0) return 'N';
  return String(gear);
}

function formatPillNumber(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '--';
  return String(Math.max(0, Math.round(value)));
}

function CheckeredFlagIcon({ size }: { size: number }) {
  const flagWidth = size;
  const flagHeight = size * 0.8;
  const cellWidth = flagWidth / 4;
  const cellHeight = flagHeight / 4;

  return (
    <svg
      width={size * 1.16}
      height={size}
      viewBox="0 0 58 48"
      role="img"
      aria-label="Finished"
      style={{
        overflow: 'visible',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))',
      }}
    >
      <defs>
        <clipPath id="finish-flag-shape">
          <path d="M14 6 C20 4, 28 4, 34 6 S46 9, 52 7 L52 31 C46 33, 40 31, 34 29 S22 27, 14 29 Z" />
        </clipPath>
      </defs>

      <rect x="7" y="4" width="4" height="38" rx="2" fill="rgba(213,221,231,0.9)" />
      <rect x="6" y="41" width="8" height="3" rx="1.5" fill="rgba(154,166,179,0.9)" />

      <g clipPath="url(#finish-flag-shape)">
        {Array.from({ length: 4 }, (_, row) =>
          Array.from({ length: 4 }, (_, col) => {
            const dark = (row + col) % 2 === 0;
            return (
              <rect
                key={`${row}-${col}`}
                x={14 + col * (cellWidth * (38 / flagWidth))}
                y={6 + row * (cellHeight * (25 / flagHeight))}
                width={cellWidth * (38 / flagWidth) + 0.4}
                height={cellHeight * (25 / flagHeight) + 0.4}
                fill={dark ? '#11161d' : '#f7fafc'}
              />
            );
          })
        )}
        <path d="M14 6 C20 4, 28 4, 34 6 S46 9, 52 7 L52 31 C46 33, 40 31, 34 29 S22 27, 14 29 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.1" />
      </g>
    </svg>
  );
}

function RevDots({ state, height }: { state: RevStripState; height: number }) {
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.flashMode, state.redlineBlinkInterval]);

  const dotSize = Math.max(6, Math.min(13, height * 0.1));
  const borderSize = dotSize > 9 ? 1.4 : 1;
  const gap = Math.max(4, dotSize * 0.56);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap, minHeight: dotSize }}>
      {state.ledColors.map((ledColor, i) => {
        const isSpacer = ledColor === 'transparent';
        let color: string;
        if (isSpacer) {
          color = 'transparent';
        } else if (state.flashMode === 'redline') {
          color = flashOn ? (state.redlineColor || '#7cff62') : FLASH_WHITE;
        } else if (state.flashMode === 'pit-limiter') {
          color = flashOn ? PIT_DOT : OFF_DOT;
        } else {
          color = state.ledOn[i] ? ledColor : OFF_DOT;
        }

        const active = !isSpacer && (state.flashMode !== 'none' || state.ledOn[i]);
        return (
          <div
            key={i}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              background: color,
              border: isSpacer ? 'none' : `${borderSize}px solid rgba(255,255,255,${active ? 0.86 : 0.34})`,
              boxShadow: active ? `0 0 ${Math.max(6, dotSize * 1.6)}px rgba(255,255,255,0.2)` : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

export function Overlay({ frame, waitingMessage, locked }: Props) {
  const [pos, setPos] = useState({ x: 80, y: 40 });
  const [size, setSize] = useState({ w: 840, h: 126 });
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
    padding: 0,
    borderRadius: 24,
    background: 'transparent',
    border: 'none',
    fontFamily: "Rajdhani, Orbitron, Eurostile, sans-serif",
    color: '#f8fafc',
    userSelect: 'none',
    pointerEvents: 'auto',
    cursor: locked ? 'default' : 'move',
    boxSizing: 'border-box',
    overflow: 'visible',
  };

  const scale = Math.max(0.72, Math.min(1.2, size.h / 126));
  const ribbonHeight = Math.max(20, 25 * scale);
  const capsuleGap = Math.max(4, 6 * scale);
  const mainHeight = Math.max(62, size.h - ribbonHeight - capsuleGap - 6);
  const pillSize = Math.max(48, mainHeight * 0.88);
  const badgeInset = pillSize * 0.44;
  const capsuleRadius = Math.max(18, mainHeight * 0.42);
  const centerStackGap = Math.max(12, 18 * scale);

  const capsuleStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: capsuleGap,
    justifyContent: 'flex-start',
    paddingTop: 3,
    boxSizing: 'border-box',
  };

  const coreStyle: React.CSSProperties = {
    height: mainHeight,
    marginLeft: badgeInset,
    marginRight: badgeInset,
    borderRadius: capsuleRadius,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `0 ${Math.max(34, pillSize * 0.66)}px`,
    background: 'linear-gradient(150deg, rgba(7,11,18,0.93) 0%, rgba(5,9,15,0.9) 100%)',
    border: locked ? '1.5px solid rgba(170, 184, 201, 0.34)' : '1.6px dashed rgba(247, 210, 112, 0.88)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
    backdropFilter: 'blur(5px)',
    boxSizing: 'border-box',
    overflow: 'visible',
  };

  const leftPillStyle: React.CSSProperties = {
    position: 'absolute',
    left: -badgeInset,
    top: (mainHeight - pillSize) / 2,
    width: pillSize,
    height: pillSize,
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(circle at 30% 20%, rgba(44,58,78,0.96) 0%, rgba(7,11,17,0.96) 70%)',
    border: '2px solid rgba(123, 255, 99, 0.9)',
    boxShadow: '0 0 0 2px rgba(5, 7, 10, 0.86), 0 8px 20px rgba(0,0,0,0.46)',
  };

  const rightPillStyle: React.CSSProperties = {
    position: 'absolute',
    right: -badgeInset,
    top: (mainHeight - pillSize * 0.78) / 2,
    width: pillSize * 0.78,
    height: pillSize * 0.78,
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(circle at 30% 20%, rgba(40,50,64,0.8) 0%, rgba(11,17,27,0.9) 72%)',
    border: '1.6px solid rgba(176, 189, 205, 0.42)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
  };

  const ribbonStyle: React.CSSProperties = {
    alignSelf: 'center',
    width: 'fit-content',
    minWidth: Math.max(250, size.w * 0.34),
    maxWidth: '95%',
    height: ribbonHeight,
    borderRadius: ribbonHeight / 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Math.max(8, 12 * scale),
    padding: `0 ${Math.max(10, 15 * scale)}px`,
    background: 'linear-gradient(180deg, rgba(43, 52, 65, 0.9) 0%, rgba(21, 27, 35, 0.95) 100%)',
    border: '1px solid rgba(166, 182, 199, 0.46)',
    boxShadow: '0 6px 12px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.07)',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    boxSizing: 'border-box',
  };

  const resizeHandle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    cursor: 'nwse-resize',
    background: 'rgba(247, 210, 112, 0.4)',
    borderRadius: '0 0 20px 0',
  };

  const lowerItems = frame ? [
    frame.ribbon.incidentsText,
    frame.ribbon.brakeBiasText,
    frame.ribbon.tractionControlText,
    frame.ribbon.absText,
    frame.snapshot.pitLimiterActive ? 'PIT' : null,
  ].filter(Boolean) : [];

  const finished = frame ? isDriverFinished(frame.snapshot) : false;
  const positionText = frame?.snapshot.positionOverall != null ? `P${formatPillNumber(frame.snapshot.positionOverall)}` : '--';
  const lapsText = frame ? formatPillNumber(lapsRemainingForDriver(frame.snapshot)) : '--';
  const gearText = frame ? formatGear(frame.snapshot.gear) : '--';
  const rpmText = frame ? Math.max(0, Math.round(frame.snapshot.rpm)).toString() : '--';
  const speedText = frame ? Math.max(0, Math.round(frame.snapshot.speedKmH)).toString() : '--';

  const content = frame ? (
    <div style={capsuleStyle}>
      <div style={coreStyle}>
        <div style={leftPillStyle}>
          <div style={{ fontSize: `${0.42 * pillSize}px`, lineHeight: 1, fontWeight: 800 }}>{positionText}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: Math.max(7, 8 * scale), minWidth: 0 }}>
          {frame.revStrip ? <RevDots state={frame.revStrip} height={size.h} /> : <div style={{ height: Math.max(6, size.h * 0.08) }} />}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: centerStackGap, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: `${Math.max(10, 10 * scale)}px`, letterSpacing: '0.14em', opacity: 0.82 }}>SPEED</div>
              <div style={{ fontSize: `${Math.max(24, 34 * scale)}px`, lineHeight: 0.95, fontWeight: 800 }}>{speedText}</div>
            </div>
            <div style={{ width: 1, height: Math.max(22, 28 * scale), background: 'rgba(183,197,214,0.36)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: `${Math.max(10, 10 * scale)}px`, letterSpacing: '0.14em', opacity: 0.82 }}>RPM</div>
              <div style={{ 
                fontSize: `${Math.max(34, 48 * scale)}px`, 
                lineHeight: 0.95, 
                fontWeight: 900,
                fontFamily: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif"
              }}>{rpmText}</div>
            </div>
            <div style={{ width: 1, height: Math.max(22, 28 * scale), background: 'rgba(183,197,214,0.36)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: `${Math.max(10, 10 * scale)}px`, letterSpacing: '0.14em', opacity: 0.82 }}>GEAR</div>
              <div style={{ fontSize: `${Math.max(24, 34 * scale)}px`, lineHeight: 0.95, fontWeight: 800 }}>{gearText}</div>
            </div>
          </div>
        </div>

        <div style={rightPillStyle}>
          <div style={{ fontSize: `${0.16 * pillSize}px`, letterSpacing: '0.1em', fontWeight: 700, opacity: 0.82 }}>{finished ? 'DONE' : 'LAPS'}</div>
          {finished ? (
            <CheckeredFlagIcon size={Math.max(20, pillSize * 0.32)} />
          ) : (
            <div style={{ fontSize: `${0.28 * pillSize}px`, lineHeight: 1, fontWeight: 800 }}>{lapsText}</div>
          )}
        </div>
      </div>

      <div style={ribbonStyle}>
        {lowerItems.length > 0 ? lowerItems.map((item, i) => (
          <React.Fragment key={`${String(item)}-${i}`}>
            {i > 0 ? <span style={{ color: 'rgba(173,185,199,0.58)' }}>|</span> : null}
            <span style={{ fontSize: `${Math.max(10, 12 * scale)}px`, fontWeight: 700, letterSpacing: '0.03em', color: '#edf3ff' }}>
              {item as string}
            </span>
          </React.Fragment>
        )) : (!frame?.ribbon.fuelLapsText && <span style={{ fontSize: `${Math.max(10, 12 * scale)}px`, fontWeight: 700, color: 'rgba(237,243,255,0.72)' }}>Telemetry ready</span>)}
        {frame?.ribbon.fuelLapsText != null && frame.ribbon.fuelStatus != null && (() => {
          const dotColor = frame.ribbon.fuelStatus === 'green' ? '#00FF00' : frame.ribbon.fuelStatus === 'yellow' ? '#FFD400' : '#FF3B30';
          return (
            <React.Fragment key="fuel">
              {lowerItems.length > 0 && <span style={{ color: 'rgba(173,185,199,0.58)' }}>|</span>}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: dotColor, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: `${Math.max(10, 12 * scale)}px`, fontWeight: 700, letterSpacing: '0.03em', color: '#edf3ff' }}>
                  {frame.ribbon.fuelLapsText}
                </span>
              </span>
            </React.Fragment>
          );
        })()}
      </div>

      {!locked && (
        <div style={{ fontSize: `${Math.max(10, 11 * scale)}px`, color: 'rgba(247,210,112,0.72)', textAlign: 'right', paddingRight: 4 }}>
          UNLOCKED - drag to move, corner to resize
        </div>
      )}
    </div>
  ) : (
    <div style={{
      height: '100%',
      borderRadius: 20,
      padding: `0 ${Math.max(12, 16 * scale)}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: Math.max(4, 7 * scale),
      background: 'linear-gradient(150deg, rgba(8,12,19,0.85) 0%, rgba(7,10,16,0.78) 100%)',
      border: locked ? '1.3px solid rgba(170,184,201,0.32)' : '1.5px dashed rgba(247,210,112,0.88)',
      boxShadow: '0 12px 24px rgba(0,0,0,0.34)',
      boxSizing: 'border-box',
    }}>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
        PoshDash Overlay Running &nbsp;|&nbsp; {waitingMessage}
      </span>
      {!locked && (
        <div style={{ fontSize: 11, color: 'rgba(255,209,102,0.85)', marginTop: 4 }}>
          Unlocked - drag to move, corner to resize. Lock via tray icon.
        </div>
      )}
    </div>
  );

  return (
    <div style={panelStyle} onMouseDown={onDragStart}>
      {content}
      {!locked && <div style={resizeHandle} onMouseDown={onResizeStart} />}
    </div>
  );
}
