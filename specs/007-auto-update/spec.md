# Feature Spec: Auto-Update

**Status:** Implemented

## Summary

Silent background update checking via GitHub Releases. Downloads new versions automatically and prompts the user to restart when ready.

## Acceptance Criteria

- Check for updates 10 seconds after app start
- Download happens silently in the background
- Synchronous dialog prompts "Restart Now" or "Later" when download is ready
- Releases triggered by pushing a `v*` tag to GitHub

## Key Files

- `src/domain/updates/types.ts` — `UpdateDecision`, `UpdateTransaction`, `ReleaseDescriptor`, `UpdateStatus`
- `src/domain/updates/factories.ts` — factory functions for update domain objects
- `src/application/ports/release-feed-client.ts` — `ReleaseFeedClient` port interface
- `src/adapters/update-github/github-release-feed-client.ts` — GitHub API adapter
- `src/main/index.ts` — electron-updater integration
