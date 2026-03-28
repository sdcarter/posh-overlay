# Feature Spec: Transparent Overlay Window

**Status:** Implemented

## Summary

Always-on-top transparent Electron window that is click-through when locked and draggable/resizable when unlocked. Invisible to screen capture tools. Position and size persist across restarts.

## Acceptance Criteria

- Window spans primary display, frameless, transparent, always on top
- `setAlwaysOnTop(true, 'screen-saver', 1)` for maximum z-order
- When locked: `setIgnoreMouseEvents(true)` — fully click-through
- When unlocked: accepts input, draggable, resizable via corner handle
- Position and size saved to `overlay-layout.json` in user data directory
- System tray icon with right-click menu: show/hide, lock/unlock, check for updates, exit
- Never toggle `resizable`, `movable`, or `focusable` after window creation (DWM chrome recomposition)

## Key Files

- `src/main/index.ts` — BrowserWindow creation, lock/unlock, layout persistence, tray setup
- `src/main/preload.cts` — IPC bridge (CommonJS, Electron sandbox requirement)
- `src/renderer/components/Overlay.tsx` — drag/resize interaction handling
