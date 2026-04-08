# Quickstart: Storybook

## Installation
The required packages will be installed via npm (as `devDependencies`):
```bash
npm install -D storybook @storybook/react-vite @storybook/react @storybook/addon-essentials
```

## Running the visual environment
To start the Storybook development server:
```bash
npx storybook dev -p 6006
```

Or using the NPM script (to be added to `package.json`):
```bash
npm run storybook
```

This will automatically open your default browser to `http://localhost:6006` where you can view the isolated `Overlay` components and their different states/scenarios.
