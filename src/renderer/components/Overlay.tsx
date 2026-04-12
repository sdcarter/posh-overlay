import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TelemetrySnapshot } from '../../domain/telemetry/types';
import type { RevStripState } from '../../domain/rev-strip/types';
import type { RibbonState } from '../../domain/ribbon/types';
import { TelemetryGraph } from './TelemetryGraph';

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

function RevDots({ state, height, spacingScale, yOffset }: { state: RevStripState; height: number; spacingScale: number; yOffset: number }) {
  const [flashOn, setFlashOn] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.flashMode === 'none') return;
    const ms = state.flashMode === 'redline' ? Math.max(state.redlineBlinkInterval / 2, 40) : 160;
    intervalRef.current = setInterval(() => setFlashOn((v) => !v), ms);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.flashMode, state.redlineBlinkInterval]);

  const blockWidth = Math.max(14, height * 0.22) * spacingScale;
  const blockHeight = Math.max(8, height * 0.12);
  const borderSize = 1;
  const gap = 3 * spacingScale;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      gap, 
      minHeight: blockHeight,
      transform: `translateY(${yOffset}px)`,
      background: 'linear-gradient(180deg, rgba(15, 22, 33, 0.9) 0%, rgba(7, 11, 17, 0.95) 100%)',
      padding: '6px 10px 4px 10px', // Extra top padding for the stripe
      borderRadius: 2,
      border: '1.2px solid rgba(0, 156, 222, 0.45)', // BMW M Light Blue
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      position: 'relative',
    }}>
      {/* BMW M-Sport Signature Stripe */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: 'linear-gradient(to right, #009CDE 33%, #0033A0 33% 66%, #FF0000 66%)',
        opacity: 0.8,
      }} />
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
              width: blockWidth,
              height: blockHeight,
              borderRadius: 0,
              background: color,
              border: isSpacer ? 'none' : `${borderSize}px solid rgba(255,255,255,${active ? 0.86 : 0.15})`,
              boxShadow: active ? `0 0 10px ${color}` : 'none',
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
    borderRadius: 0,
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
  const pillWidth = 120 * scale;
  const pillHeight = 60 * scale;
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
    opacity: frame?.ribbon.visible ? 1 : 0,
    pointerEvents: frame?.ribbon.visible ? 'auto' : 'none',
    transition: 'opacity 0.15s ease-out',
  };

  const coreStyle: React.CSSProperties = {
    height: mainHeight,
    borderRadius: 0,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${Math.max(12, 16 * scale)}px`,
    background: 'rgba(18, 18, 18, 0.85)',
    border: locked ? '1.5px solid rgba(255, 255, 255, 0.15)' : '1.6px dashed rgba(247, 210, 112, 0.88)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
    backdropFilter: 'blur(5px)',
    boxSizing: 'border-box',
    overflow: 'visible',
    gap: 16,
  };

  const leftPillStyle: React.CSSProperties = {
    position: 'relative',
    width: pillHeight, // Square for Position
    height: pillHeight,
    borderRadius: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(circle at 30% 20%, rgba(44,58,78,0.96) 0%, rgba(7,11,17,0.96) 70%)',
    border: '2px solid var(--bmw-m-light-blue, #009CDE)',
    boxShadow: '0 0 0 2px rgba(5, 7, 10, 0.86), 0 8px 20px rgba(0,0,0,0.46)',
    flexShrink: 0,
  };

  const rightPillStyle: React.CSSProperties = {
    position: 'relative',
    width: pillWidth, // Wider for Session time
    height: pillHeight,
    borderRadius: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(circle at 30% 20%, rgba(40,50,64,0.8) 0%, rgba(11,17,27,0.9) 72%)',
    border: '1.6px solid #FF00FF',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    flexShrink: 0,
  };

  const ribbonStyle: React.CSSProperties = {
    alignSelf: 'center',
    width: 'fit-content',
    minWidth: Math.max(250, size.w * 0.34),
    maxWidth: '95%',
    height: ribbonHeight,
    borderRadius: 0,
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
    borderRadius: 0,
  };

  const lowerItems = frame ? [
    frame.ribbon.incidentsText,
    frame.ribbon.brakeBiasText,
    frame.ribbon.tractionControlText,
    frame.ribbon.absText,
    frame.snapshot.pitLimiterActive ? 'PIT' : null,
  ].filter(Boolean) : [];

  const finished = frame?.ribbon.finished ?? false;
  const positionText = frame?.snapshot.positionOverall != null ? `P${frame.snapshot.positionOverall}` : '--';
  const sessionText = frame?.ribbon.lapInfoText ?? '--';
  const gearText = frame ? formatGear(frame.snapshot.gear) : '--';
  const rpmText = frame ? Math.max(0, Math.round(frame.snapshot.rpm)).toString() : '--';
  const speedText = frame ? Math.max(0, Math.round(frame.snapshot.speedKmH)).toString() : '--';

  // Dynamic LED scaling and offset
  const ledCount = frame?.revStrip?.ledCount ?? 0;
  const corePadding = Math.max(12, 16 * scale);
  const safeZoneWidth = size.w - pillWidth - pillHeight - (2 * corePadding) - 40; // 40px safe margin
  const baseLedWidth = Math.max(14, size.h * 0.22);
  const baseGap = 3;
  const totalLedWidth = ledCount * (baseLedWidth + baseGap);
  
  const spacingScale = (totalLedWidth > safeZoneWidth && ledCount > 0) 
    ? safeZoneWidth / totalLedWidth 
    : 1.0;
  
  // yOffset to ensure 10px buffer from top of pills. 
  // Pills are centered in mainHeight. 
  // Center Column is also centered.
  const yOffset = - (pillHeight * 0.22); // Shift up by ~22% of pill height for solid clearance

  const content = frame ? (
    <div style={capsuleStyle}>
      <div style={coreStyle}>
        {/* Left Column (Position) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <div style={{ ...leftPillStyle, position: 'relative' }}>
            <div style={{ fontSize: `${0.16 * pillHeight}px`, letterSpacing: '0.1em', fontWeight: 700, opacity: 0.82 }}>POS</div>
            <div style={{ fontSize: `${0.45 * pillHeight}px`, lineHeight: 1, fontWeight: 800 }}>{positionText}</div>
            {/* Telemetry graph anchored to left edge of the Position pill */}
            <div style={{
              position: 'absolute',
              right: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              marginRight: 4,
              zIndex: -1,
            }}>
              <TelemetryGraph snapshot={frame.snapshot} height={mainHeight * 0.75} scale={scale} />
            </div>
          </div>
        </div>

        {/* Center Column (fixed centering) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: Math.max(7, 8 * scale), minWidth: 0 }}>
          {frame.revStrip ? <RevDots key={`${frame.revStrip.flashMode}-${frame.revStrip.redlineBlinkInterval}`} state={frame.revStrip} height={size.h} spacingScale={spacingScale} yOffset={yOffset} /> : <div style={{ height: Math.max(6, size.h * 0.08) }} />}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: centerStackGap, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid white', padding: '4px 8px', borderRadius: 0 }}>
              <div style={{ fontSize: `${Math.max(10, 10 * scale)}px`, letterSpacing: '0.14em', opacity: 0.82 }}>SPEED</div>
              <div style={{ fontSize: `${Math.max(24, 34 * scale)}px`, lineHeight: 0.95, fontWeight: 800, width: '2.2em', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{speedText}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: `${Math.max(10, 10 * scale)}px`, letterSpacing: '0.14em', opacity: 0.82 }}>RPM</div>
              <div style={{ 
                fontSize: `${Math.max(34, 48 * scale)}px`, 
                lineHeight: 0.95, 
                fontWeight: 800,
                width: '3.2em',
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums'
              }}>{rpmText}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid white', padding: '4px 8px', borderRadius: 0 }}>
              <div style={{ fontSize: `${Math.max(10, 10 * scale)}px`, letterSpacing: '0.14em', opacity: 0.82 }}>GEAR</div>
              <div style={{ fontSize: `${Math.max(24, 34 * scale)}px`, lineHeight: 0.95, fontWeight: 800, width: '1.4em', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{gearText}</div>
            </div>
          </div>
        </div>

        {/* Right Column (Session info) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div style={rightPillStyle}>
            <div style={{ fontSize: `${0.16 * pillHeight}px`, letterSpacing: '0.1em', fontWeight: 700, opacity: 0.82 }}>{finished ? 'DONE' : 'SESSION'}</div>
            {finished ? (
              <CheckeredFlagIcon size={Math.max(20, pillHeight * 0.42)} />
            ) : (
              <div 
                style={{ 
                  fontSize: `${0.32 * pillHeight}px`, 
                  lineHeight: 1, 
                  fontWeight: 800,
                  maxWidth: '92%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center'
                }}
                title={sessionText}
              >
                {sessionText}
              </div>
            )}
          </div>
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
          let dotColor: string;
          switch (frame.ribbon.fuelStatus) {
            case 'green': dotColor = '#00FF00'; break;
            case 'yellow': dotColor = '#FFD400'; break;
            case 'red': dotColor = '#FF3B30'; break;
            case 'stabilizing': dotColor = '#3b82f6'; break;
            default: dotColor = 'rgba(173,185,199,0.72)';
          }
          return (
            <React.Fragment key="fuel">
              {lowerItems.length > 0 && <span style={{ color: 'rgba(173,185,199,0.58)' }}>|</span>}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: 0, backgroundColor: dotColor, display: 'inline-block', flexShrink: 0 }} />
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
      borderRadius: 0,
      padding: `0 ${Math.max(12, 16 * scale)}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: Math.max(4, 7 * scale),
      background: 'rgba(18, 18, 18, 0.85)',
      border: locked ? '1.5px solid rgba(255, 255, 255, 0.15)' : '1.5px dashed rgba(247,210,112,0.88)',
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
