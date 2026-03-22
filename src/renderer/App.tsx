import React, { useState, useEffect } from 'react';
import { Overlay } from './components/Overlay';
import type { TelemetrySnapshot } from '../domain/telemetry/types';
import type { RevStripState } from '../domain/rev-strip/types';
import type { RibbonState } from '../domain/ribbon/types';

declare global {
  interface Window {
    electronAPI: {
      onTelemetryUpdate: (cb: (data: TelemetryFrame) => void) => void;
      onTelemetryWaiting: (cb: (msg: string) => void) => void;
      setIgnoreMouse: (ignore: boolean) => void;
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

  useEffect(() => {
    window.electronAPI.onTelemetryUpdate((data) => setFrame(data));
    window.electronAPI.onTelemetryWaiting((msg) => { setFrame(null); setWaitingMsg(msg); });
  }, []);

  return <Overlay frame={frame} waitingMessage={waitingMsg} />;
}
