# Quickstart: Adaptive UI & LED Collision Avoidance

## Overview
This feature migrates the dashboard to a "Source of Truth" model using raw iRacing SDK session data, transitions info containers to rectangular boxes, and implements a collision-avoidance system for the RPM LED array.

## Core Changes

### 1. Telemetry Data Migration
- **Source**: `SessionLaps` and `SessionTimeRemain` are now pulled directly from the SDK.
- **Logic**: 
    - `lap-based`: If `SessionLaps < 32767`.
    - `time-based`: If `SessionLaps >= 32767`.
- **Visibility**: The overlay is now only visible when `IsOnTrack` is true AND `IsReplayPlaying` is false.

### 2. UI Layout (The "Safe Zone")
- **Rectangles**: Lap (top-left) and Position (top-right) containers are widened to 120px x 60px (at 1.0 scale).
- **LED Buffer**: The RPM LED array is shifted upward on the Y-axis to ensure a 10px minimum gap from the top of the info boxes.
- **Dynamic Scaling**: For cars with wide LED arrays (BMW GT3, etc.), the LED horizontal spacing is reduced if it exceeds the "Safe Zone" between the corner boxes.

### 3. Verification & Mocking
- **Mock Scenario**: A new scenario `wide-led-collision.mjs` is provided to simulate ultra-wide LED arrays (25+ LEDs).
- **Storybook**: Run `npm run storybook` to view the `AdaptiveLayout` story, showing how the UI responds to different session types and LED widths.

## Commands
- `npm run mock:wide`: Simulates a wide-array car (BMW GT3) with a timed race.
- `npm run mock:oval`: Simulates a lap-based session.
- `npm run storybook`: Verify the UI geometry and buffers.
