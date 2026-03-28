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
  absActive: boolean;
  timeMs: number;
}

export function TelemetryGraph({ snapshot, height, scale }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<DataPoint[]>([]);
  
  const width = Math.max(100, 160 * scale);
  const durationMs = 3000;

  useEffect(() => {
    const now = snapshot.timestampMs;
    historyRef.current.push({
      throttle: snapshot.throttle,
      brake: snapshot.brake,
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

    // Draw reference lines
    ctx.lineWidth = 1 * scale;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(0, padY);
    ctx.lineTo(width, padY);
    ctx.moveTo(0, height - padY);
    ctx.lineTo(width, height - padY);
    ctx.stroke();

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

    ctx.restore();
  }, [snapshot, height, scale, width, durationMs]);

  return (
    <div style={{
      width,
      height,
      borderRadius: height * 0.42,
      background: 'linear-gradient(150deg, rgba(7,11,18,0.93) 0%, rgba(5,9,15,0.9) 100%)',
      border: '1.5px solid rgba(170, 184, 201, 0.1)',
      boxShadow: '0 10px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
      backdropFilter: 'blur(5px)',
      overflow: 'hidden',
      boxSizing: 'border-box',
      paddingRight: Math.max(16, 24 * scale) // more padding so lines plunge under the pill before stopping
    }}>
      <canvas 
        ref={canvasRef}  
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
