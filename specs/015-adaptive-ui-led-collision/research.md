# Research: Adaptive UI Layout & LED Collision Avoidance

## Decision: Dynamic Scaling & Vertical Offset

**Decision**: Implement a dynamic vertical offset for the RPM LED array based on the current car's LED count and width, combined with a width-constraint that reduces LED spacing if the array would otherwise overlap the rectangular info boxes.

**Rationale**:
- **Rectangular Boxes**: Transitioning from squares to rectangles (e.g., 1.5:1 or 2:1 aspect ratio) increases the horizontal footprint of the "Lap" and "Position" containers.
- **Collision Logic**: The "outermost" LEDs on wide-array cars (15+ LEDs) are the most likely to collide. A fixed Y-offset might move LEDs too high on narrow cars, while being insufficient for wide ones.
- **Dynamic Scaling**: By calculating the available horizontal "Safe Zone" between the two corner boxes, the UI can automatically compress the LED spacing for ultra-wide arrays (BMW GT3, etc.) while maintaining the requested 10px vertical buffer.

**Alternatives Considered**:
- **Fixed Offset**: Rejected because it doesn't account for varying LED counts across iRacing's car roster.
- **Always High**: Rejected as it breaks the "minimalist" aesthetic for cars with small LED arrays (e.g., MX-5).

## Decision: Raw SDK Session Source

**Decision**: Switch from computed lap/time logic to raw `SessionLaps` and `SessionTimeRemain` variables from the iRacing SDK.

**Rationale**:
- **Source of Truth**: The user explicitly requested raw SDK values to match the iRacing "black box" 1:1.
- **Session Type Detection**: 
    - **Lap-Based (Ovals)**: Detected when `SessionLaps` is a valid positive integer (typically < 32767).
    - **Time-Based (Road)**: Detected when `SessionLaps` is effectively infinite (32767 in some SDK versions) or when `SessionTimeRemain` is the primary decrementing counter.
- **Consistency**: Using raw values eliminates discrepancies caused by local "estimated" lap count logic.

## Decision: "On-Track Only" Visibility

**Decision**: Implement a global visibility toggle in the `Overlay` component driven by `(IsConnected && IsOnTrack && !IsReplay)`.

**Rationale**:
- **Zero Interference**: Setting `display: none` or `opacity: 0` on the parent container ensures the overlay doesn't block mouse clicks or visibility when the user is in the garage or replay mode.
- **Performance**: Prevents unnecessary React renders when the overlay is hidden.

## Decision: Layout Constants

**Decision**:
- **Info Box Dimensions**: Width: 120px, Height: 60px (at 1.0 scale).
- **LED Buffer**: 10px minimum Y-gap from the top edge of the info boxes.
- **Safe Zone Width**: `ScreenColorWidth - (LeftBoxWidth + RightBoxWidth) - (2 * 10px Margin)`.
