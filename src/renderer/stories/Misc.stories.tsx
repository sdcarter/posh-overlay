import type { Meta, StoryObj } from '@storybook/react';
import { MockOverlayHoc } from './MockOverlayHoc';

const meta = {
  title: 'Misc',
  component: MockOverlayHoc,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MockOverlayHoc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WideLedCollision: Story = { args: { scenario: 'wide-led-collision' } };
