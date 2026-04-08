# Research Notes: Storybook 8 Integration

## Decision: Storybook 8 setup mechanism
**What was chosen**: Manual addition of `@storybook/react-vite`, `storybook`, and `@storybook/react` instead of `npx storybook@latest init`.
**Rationale**: `npx storybook init` often adds multiple boilerplate, numerous configuration files, and several addons by default (`onboarding`, `interactions`, etc.). To strictly follow the "no addons beyond the essentials" requirement and keep the PR extremely minimal, manually adding just the framework and essential packages keeps the project clean.
**Alternatives considered**: Using `npx storybook init` - rejected due to unnecessary bloat.

## Decision: Mock Data Supply for Stories
**What was chosen**: Import the static snapshot objects directly from `src/adapters/telemetry-mock/snapshots/` arrays or create specific telemetry objects leveraging the `MockTelemetryProvider`'s generator logic. The `Overlay` component accepts `RibbonState` or requires `TelemetrySnapshot` Context.
**Rationale**: Reusing the mock data definitions natively aligns with the existing mock architecture and keeps the stories deterministic and real to the actual game's bounds.
**Alternatives considered**: Generating fresh mock data exclusively in Storybook - rejected because it duplicates what already exists in `MockTelemetryProvider`.
