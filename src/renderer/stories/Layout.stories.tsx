import type { Meta, StoryObj } from '@storybook/react';
import { MockOverlayHoc } from './MockOverlayHoc';

const meta = {
  title: 'Layout',
  component: MockOverlayHoc,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MockOverlayHoc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLEDs: Story = { args: { scenario: 'bmw-sweep' }, name: 'With LEDs' };
export const WithoutLEDs: Story = { args: { scenario: 'no-leds' }, name: 'Without LEDs' };
