import type { Meta, StoryObj } from '@storybook/react';
import { MockOverlayHoc } from './MockOverlayHoc';

const meta = {
  title: 'Finishes',
  component: MockOverlayHoc,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MockOverlayHoc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RoadRace: Story = { args: { scenario: 'road-finish' } };
export const TimedRace: Story = { args: { scenario: 'timed' } };
