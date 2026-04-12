import React, { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Overlay } from './components/Overlay';
import { MockTelemetryProvider } from '../adapters/telemetry-mock/mock-telemetry-provider';
import { composeRevStrip } from '../application/use-cases/compose-rev-strip';
import { composeRibbon } from '../application/use-cases/compose-ribbon';

import { resolveProfile } from '../domain/telemetry/car-profiles';
import type { TelemetrySnapshot } from '../domain/telemetry/types';
import type { RevStripState } from '../domain/rev-strip/types';
import type { RibbonState } from '../domain/ribbon/types';

interface FrameState {
  snapshot: TelemetrySnapshot;
  revStrip: RevStripState | null;
  ribbon: RibbonState;
  useMock: boolean;
}

function MockOverlayHoc({ scenario }: { scenario: string }) {
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

  return (
    <div style={{ width: '840px', height: '126px', position: 'relative' }}>
      <Overlay 
        frame={frame}
        waitingMessage={`Running Scenario: ${scenario}`}
        locked={true}
      />
    </div>
  );
}

const meta = {
  title: 'Overlay',
  component: MockOverlayHoc,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MockOverlayHoc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MazdaSweep: Story = {
  args: { scenario: 'mazda-sweep' }
};

export const BmwSweep: Story = {
  args: { scenario: 'bmw-sweep' }
};

export const SuperFormulaLightsSweep: Story = {
  args: { scenario: 'sfl-sweep' }
};

export const MustangSweep: Story = {
  args: { scenario: 'mustang-sweep' }
};

export const RoadRaceFinish: Story = {
  args: { scenario: 'road-finish' }
};

export const TimedRace: Story = {
  args: { scenario: 'timed' }
};

export const WideLedCollision: Story = {
  args: { scenario: 'wide-led-collision' }
};

export const FuelScenario: Story = {
  args: { scenario: 'fuel' }
};

export const StabilizingFuel: Story = {
  args: { scenario: 'stabilizing-fuel' }
};

export const GarageHidden: Story = {
  args: { scenario: 'garage' }
};

export const ReplayHidden: Story = {
  args: { scenario: 'replay' }
};
