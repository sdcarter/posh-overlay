import React, { useEffect, useRef } from 'react';
import type { TelemetrySnapshot } from '../../domain/telemetry/types';

interface Props {
  snapshot: TelemetrySnapshot;
  height: number;
  scale: number;
}

interface DataPoint {
  throttle: number;
  brake: number;
  clutch: number;
  absActive: boolean;
  timeMs: number;
}

export function TelemetryGraph({ snapshot, height, scale }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<DataPoint[]>([]);
  
  const width = Math.max(100, 240 * scale);
  const durationMs = 10000;

  useEffect(() => {
    const now = snapshot.timestampMs;
    historyRef.current.push({
      throttle: snapshot.throttle,
      brake: snapshot.brake,
      clutch: snapshot.clutch ?? 0,
      absActive: snapshot.absActive,
      timeMs: now,
    });

    while (historyRef.current.length > 0 && now - historyRef.current[0].timeMs > durationMs) {
      historyRef.current.shift();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.floor(width * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (historyRef.current.length < 2) {
      ctx.restore();
      return;
    }

    const padY = height * 0.15;
    const drawHeight = height - padY * 2;

    // Draw reference lines (horizontal)
    ctx.lineWidth = 1 * scale;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(0, padY);
    ctx.lineTo(width, padY);
    ctx.moveTo(0, height - padY);
    ctx.lineTo(width, height - padY);
    ctx.stroke();

    // Draw vertical time markers — boldest at 0s (right edge), fading toward history
    const totalSeconds = durationMs / 1000;
    for (let s = 0; s < totalSeconds; s++) {
      const x = width - (s * 1000 / durationMs) * width;
      const fade = 1 - (s / totalSeconds);  // 1.0 at 0s, diminishing toward the past
      const opacity = s === 0 ? 0.4 : 0.08 + 0.07 * fade;
      const lineW = s === 0 ? 2 * scale : 1 * scale;

      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.lineWidth = lineW;
      ctx.beginPath();
      ctx.moveTo(s === 0 ? x - 1 : x, padY);
      ctx.lineTo(s === 0 ? x - 1 : x, height - padY);
      ctx.stroke();
    }

    const drawLine = (
      getValue: (pt: DataPoint) => number,
      getColor: (pt: DataPoint) => string
    ) => {
      const points = historyRef.current.map(pt => {
        const x = width - ((now - pt.timeMs) / durationMs) * width;
        const val = getValue(pt);
        const y = height - padY - (val * drawHeight);
        return { x, y, pt };
      });

      ctx.lineWidth = Math.max(1.5, 2 * scale);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i+1];
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = getColor(p2.pt);
        ctx.stroke();
      }
    };

    // Draw Throttle (Green)
    drawLine(
      pt => pt.throttle,
      () => '#52c41a'
    );

    // Draw Brake (Red, turning Yellow for ABS)
    drawLine(
      pt => pt.brake,
      pt => pt.absActive ? '#fadb14' : '#f5222d'
    );

    // Draw Clutch (Blue)
    drawLine(
      pt => pt.clutch,
      () => '#1890ff'
    );

    ctx.restore();
  }, [snapshot, height, scale, width, durationMs]);

  const throttle = snapshot.throttle ?? 0;
  const brake = snapshot.brake ?? 0;
  const clutch = snapshot.clutch ?? 0;

  const bars = [
    { value: brake,    color: '#f5222d', label: 'B' },
    { value: throttle, color: '#52c41a', label: 'T' },
    { value: clutch,   color: '#faad14', label: 'C' },
  ];

  const barWidth = Math.max(16, 18 * scale);
  const barGap = Math.max(3, 4 * scale);
  const barsAreaWidth = bars.length * barWidth + (bars.length - 1) * barGap + barGap * 2;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      width: width + barsAreaWidth,
      height,
      borderRadius: 0,
      background: 'rgba(18, 18, 18, 0.85)',
      border: '1.5px solid rgba(170, 184, 201, 0.1)',
      boxShadow: '0 10px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
      backdropFilter: 'blur(5px)',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      <canvas 
        ref={canvasRef}  
        style={{ width, height, display: 'block', flexShrink: 0 }}
      />
      {/* Live bar indicators */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: barGap,
        padding: `${Math.max(6, 8 * scale)}px ${barGap}px ${barGap}px`,
        width: barsAreaWidth,
        height: '100%',
        boxSizing: 'border-box',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Value labels row */}
        <div style={{ display: 'flex', gap: barGap, alignItems: 'flex-end' }}>
          {bars.map(({ value, color, label }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: Math.max(7, 8 * scale), color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', lineHeight: 1, width: barWidth, textAlign: 'center', display: 'block' }}>
                {Math.round(value * 100)}
              </span>
              {/* Bar track */}
              <div style={{
                width: barWidth,
                height: height * 0.52,
                background: 'rgba(255,255,255,0.07)',
                borderRadius: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}>
                <div style={{
                  width: '100%',
                  height: `${value * 100}%`,
                  background: color,
                  boxShadow: value > 0.05 ? `0 0 6px ${color}` : 'none',
                  transition: 'height 0.05s linear',
                }} />
              </div>
              <span style={{ fontSize: Math.max(6, 7 * scale), color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', lineHeight: 1 }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
