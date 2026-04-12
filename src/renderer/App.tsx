import React, { useState, useEffect } from 'react';
import { Overlay } from './components/Overlay';
import type { TelemetrySnapshot } from '../domain/telemetry/types';
import type { RevStripState } from '../domain/rev-strip/types';
import type { RibbonState } from '../domain/ribbon/types';

declare global {
  interface Window {
    electronAPI: {
      onTelemetryUpdate: (cb: (data: unknown) => void) => void;
      onTelemetryWaiting: (cb: (msg: string) => void) => void;
      onLockChange: (cb: (locked: boolean) => void) => void;
      getLayout: () => Promise<{ x: number; y: number; w: number; h: number } | null>;
      saveLayout: (layout: { x: number; y: number; w: number; h: number }) => void;
    };
  }
}

interface TelemetryFrame {
  snapshot: TelemetrySnapshot;
  revStrip: RevStripState;
  ribbon: RibbonState;
  useMock: boolean;
}

export function App() {
  const [frame, setFrame] = useState<TelemetryFrame | null>(null);
  const [waitingMsg, setWaitingMsg] = useState('Waiting for iRacing telemetry.');
  const [locked, setLocked] = useState(true);

  useEffect(() => {
    window.electronAPI.onTelemetryUpdate((data) => setFrame(data as TelemetryFrame));
    window.electronAPI.onTelemetryWaiting((msg) => { setFrame(null); setWaitingMsg(msg); });
    window.electronAPI.onLockChange((l) => setLocked(l));
  }, []);

  const isVisible = frame !== null && frame.snapshot.isOnTrack && !frame.snapshot.isReplayPlaying;

  return (
    <div style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
      <Overlay frame={frame} waitingMessage={waitingMsg} locked={locked} />
    </div>
  );
}
