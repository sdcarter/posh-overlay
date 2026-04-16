import type { Meta, StoryObj } from '@storybook/react';
import { MockOverlayHoc } from './MockOverlayHoc';

const meta = {
  title: 'Sizes',
  component: MockOverlayHoc,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MockOverlayHoc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { scenario: 'bmw-sweep' } };
export const Small: Story = { args: { scenario: 'bmw-sweep', width: 600, height: 90 } };
export const Wide: Story = { args: { scenario: 'bmw-sweep', width: 1200, height: 126 } };
export const Tall: Story = { args: { scenario: 'bmw-sweep', width: 840, height: 200 } };
