import React, { useState, useEffect } from 'react';
import { Overlay } from '../components/Overlay';
import { MockTelemetryProvider } from '../../adapters/telemetry-mock/mock-telemetry-provider';
import { composeRevStrip } from '../../application/use-cases/compose-rev-strip';
import { composeRibbon } from '../../application/use-cases/compose-ribbon';
import { resolveProfile } from '../../domain/telemetry/car-profiles';
import type { TelemetrySnapshot } from '../../domain/telemetry/types';
import type { RevStripState } from '../../domain/rev-strip/types';
import type { RibbonState } from '../../domain/ribbon/types';

interface FrameState {
  snapshot: TelemetrySnapshot;
  revStrip: RevStripState | null;
  ribbon: RibbonState;
  useMock: boolean;
}

export function MockOverlayHoc({ scenario, width = 840, height = 126 }: { scenario: string; width?: number; height?: number }) {
  const [frame, setFrame] = useState<FrameState | null>(null);

  useEffect(() => {
    const provider = new MockTelemetryProvider(scenario);
    let rafId: number;

    const tick = () => {
      const snapshot = provider.tryReadSnapshot();
      const profile = resolveProfile(snapshot.driverCarId, snapshot.carPath, snapshot.gear, snapshot.maxRpm);
      const revStrip = composeRevStrip(snapshot, profile);
      const ribbon = composeRibbon(snapshot);
      
      setFrame({ snapshot, revStrip, ribbon, useMock: true });
      rafId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(rafId);
  }, [scenario]);

  const graphMargin = 320; // space for telemetry graph + bars that overhang to the left

  return (
    <div style={{ width: `${width + graphMargin}px`, height: `${height + 80}px`, position: 'relative', overflow: 'visible' }}>
      <div style={{ position: 'absolute', left: graphMargin, top: 40, width: `${width}px`, height: `${height}px` }}>
      <Overlay 
        frame={frame}
        waitingMessage={`Running Scenario: ${scenario}`}
        locked={true}
        initialSize={{ w: width, h: height }}
      />
      </div>
    </div>
  );
}
