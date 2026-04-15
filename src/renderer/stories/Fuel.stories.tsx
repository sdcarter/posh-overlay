import type { Meta, StoryObj } from '@storybook/react';
import { MockOverlayHoc } from './MockOverlayHoc';

const meta = {
  title: 'Fuel',
  component: MockOverlayHoc,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MockOverlayHoc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FuelLevels: Story = { args: { scenario: 'fuel' } };
export const Stabilizing: Story = { args: { scenario: 'stabilizing-fuel' } };
export const PitWindow: Story = { args: { scenario: 'pit-window' } };
