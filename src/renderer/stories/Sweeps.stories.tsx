import type { Meta, StoryObj } from '@storybook/react';
import { MockOverlayHoc } from './MockOverlayHoc';

const meta = {
  title: 'Sweeps',
  component: MockOverlayHoc,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MockOverlayHoc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MazdaMX5Cup: Story = { args: { scenario: 'mazda-sweep' }, name: 'Mazda MX-5 Cup' };
export const BMWM4GT3: Story = { args: { scenario: 'bmw-sweep' }, name: 'BMW M4 GT3' };
export const NASCAROReillyFordMustang: Story = { args: { scenario: 'mustang-sweep' }, name: "NASCAR O'Reilly Ford Mustang" };
export const SuperFormulaLights: Story = { args: { scenario: 'sfl-sweep' }, name: 'Super Formula Lights' };
