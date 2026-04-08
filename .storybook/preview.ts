import type { Preview } from '@storybook/react';

// Mock electron API for components
if (typeof window !== 'undefined') {
  (window as any).electronAPI = {
    getLayout: async () => ({ x: 0, y: 0, w: 840, h: 126 }),
    saveLayout: async () => {},
  };
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
        { name: 'light', value: '#ffffff' },
        { name: 'transparent', value: 'transparent' },
      ],
    },
  },
};

export default preview;
