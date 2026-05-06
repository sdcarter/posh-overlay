# PoshDash Telemetry Troubleshooting & Patterns

## Quick Lookup: Variable → Display Logic

| What You See | Data Source | Calculation | Gotchas |
|-------|------|-----|-----|
| RPM gauge | `RPM` (float) | 0–`PlayerCarSLShiftRPM` scale | Fallback: `SLBlinkRPM` → `SLLastRPM` if shift point is 0 |
| Shift light | `ShiftIndicatorPct` (float) | Animated 0→1; lerp to visual | Don't threshold; feed directly to LED strip |
| Current gear | `Gear` (int) | 0=R, 1=N, 2+=forward | — |
| Speed | `Speed` (float) | m/s or mph (depends on sim setting) | Use as-is; no conversion needed in overlay |
| Throttle % | `Throttle` (float) | 0.0–1.0, but **inverted**: 0=pedal down, 1=released | For bar display: height * Throttle |
| Brake % | `Brake` (float) | 0.0–1.0, inverted: 0=pedal down, 1=released | For bar display: height * Brake |
| Clutch % | `Clutch` (float) | **INVERTED**: 0=pressed, 1=released; flip for display | For bar: height * (1 - Clutch) |
| ABS Active % | `BrakeABSactive` (float) | 0.0–1.0, percentage ABS is working | Real-time indicator; no delay |
| Pit Limiter Active | `EngineWarnings` (bitfield) | Check: `(EngineWarnings & 0x10) !== 0` | Bit position 4; only true when actively limited |
| Rev Limiter Active | `EngineWarnings` (bitfield) | Check: `(EngineWarnings & 0x20) !== 0` | Bit position 5 |
| Fuel Level (liters) | `FuelLevel` (float) | Used directly | Can be null if not available |
| Fuel % | `FuelLevelPct` (float) | 0.0–1.0 | More reliable than calculating from FuelLevel / capacity |
| Current Lap | `Lap` (int) or `CarIdxLap[playerIdx]` | Increments at S/F; is race lap # | — |
| Lap Progress | `LapDistPct` (float) | 0.0–1.0 from S/F | — |
| Last Lap Time | `LapLastLapTime` (float) | Seconds (negative = invalid/not finished) | Only valid after completing a lap |
| Position | `PlayerCarPosition` (int) or `CarIdxPosition[playerIdx]` | 1=leader, 2=second, etc. | Find leader: `CarIdxPosition.indexOf(1)` |
| Leader Lap # | `CarIdxLap[leaderIdx]` | Lap count of car at index `leaderIdx` | Requires finding leader first |
| Fuel Laps Remaining | Domain calc: `(FuelLevel – 0.5 lap margin) / computedFuelPerLap` | See fuel-laps.ts | **0.5 lap safety margin included** |
| TC Level (single) | `dcTractionControl` (int) | Display as "TC N" (omit "1") | If 0, suppress entirely |
| TC Levels (multi) | Array: `[dcTractionControl, dcTractionControl2, ...]` | Display as "TC1 N • TC2 N" | Filter to `/^dcTractionControl\d+$/` only; suppress if all 0 |
| ABS Level | `dcABS` (int) | Display as "ABS N" | Suppress if 0 (Hypercars don't have driver ABS) |
| Finished | `SessionState >= 6` or (`SessionState === 5 && currentLap > checkeredLap`) | Player finished | Also check `CarIdxSessionFlags[playerIdx] & 0x10` |

## Telemetry Data Extraction Patterns

### Safe Value Access
```typescript
// Template: use these utilities consistently
const val = (v) => v?.value?.[0] ?? null;              // single value
const arrVal = (v, idx) => (idx == null ? null : v?.value?.[idx] ?? null);  // indexed
const lapVal = (v) => {                                 // skip unlimited marker
  const n = val(v);
  return n != null && n >= 32767 ? null : n;
};
```

### Multi-Car Lookups
```typescript
// Find leader by position = 1
const leaderIdx = (positions) => {
  const idx = positions.findIndex((p) => p === 1);
  return idx >= 0 ? idx : null;
};

// Get my value from array
const myValue = arrVal(t.SomeArray, playerCarIdx);

// Get leader's lap
const leaderLap = arrVal(t.CarIdxLap, leaderCarIdx);
```

### Bitfield Operations
```typescript
// Check if flag is set
const isGreen = (flags) => (flags & 0x04) !== 0;
const isYellow = (flags) => (flags & 0x08) !== 0;
const hasCheckered = (flags) => (flags & 0x01) !== 0;

// Check multiple flags
const isGreenFlagCondition = (flags) => {
  const hasBadFlag = (flags & (0x08 | 0x4000 | 0x10 | 0x8000)) !== 0;  // YELLOW | CAUTION | RED | CAUTIONWAVING
  return !hasBadFlag;
};

// Pit limiter active
const pitLimiterOn = (engineWarnings) => (engineWarnings & 0x10) !== 0;
```

### Traction Control Channel Extraction
```typescript
// Correct: Extract only channel variables, in order
const tcKeys = Object.keys(t).filter(k => 
  k === 'dcTractionControl' || /^dcTractionControl\d+$/.test(k)
);
// Result: ['dcTractionControl', 'dcTractionControl2', ...]

// Extract values
const tcLevels = tcKeys.map(k => val(t[k]));
// Result: [3, 5] for a car with TC Slip=3, TC Gain=5

// Display logic
if (tcLevels.every(l => l === 0)) {
  display = null;  // car doesn't use TC as driver setting
} else if (tcLevels.length === 1) {
  display = `TC ${tcLevels[0]}`;  // single channel: omit "1"
} else {
  display = tcLevels.map((l, i) => `TC${i + 1} ${l}`).join(' • ');  // multi: "TC1 3 • TC2 5"
}
```

## Fuel Calculation Workflow (Real-World Edge Cases)

### Setup
```typescript
let fuelUsedHistory = [];          // rolling 5-lap window
let lastLapFuelLevel = null;       // fuel at END of previous lap
let computedFuelPerLap = null;     // average consumption
let firstRecordedLap = null;       // to skip out-lap
let lapWasGreen = true;            // track if lap was uninterrupted
```

### Polling (every 8ms)
```typescript
// Update green flag tracking
if (!isGreenFlagCondition(sessionFlags)) {
  lapWasGreen = false;
}

// On lap boundary (Lap counter increments)
if (currentLap > lastSeenLap) {
  if (lastLapFuelLevel != null && fuelLevel != null) {
    const consumed = lastLapFuelLevel - fuelLevel;
    const justCompletedLap = lastSeenLap;
    
    // Filters
    const isOutLap = (justCompletedLap === firstRecordedLap);
    const isValidConsumption = (consumed > 0.01 && consumed < 150);  // sanity check
    const isNotOutlier = !isLapConsumptionOutlier(consumed, fuelUsedHistory);
    
    if (isValidConsumption && !isOutLap && lapWasGreen && isNotOutlier) {
      fuelUsedHistory.push(consumed);
      if (fuelUsedHistory.length > 5) fuelUsedHistory.shift();
      computedFuelPerLap = avg(fuelUsedHistory);
    }
  }
  
  // Prepare for next lap
  lastLapFuelLevel = fuelLevel;
  lapWasGreen = true;  // reset: assume green until flag says otherwise
  lastSeenLap = currentLap;
}
```

### Display Calculation
```typescript
const safetyMargin = 0.5;
const fuelLapsRemaining = computedFuelPerLap
  ? (fuelLevel - safetyMargin) / computedFuelPerLap
  : null;

// Use sessionLapsRemainEx (not SessionLapsRemain) for remaining count
const lapsLeft = val(t.SessionLapsRemainEx);
const isSafe = fuelLapsRemaining != null && lapsLeft != null && fuelLapsRemaining >= lapsLeft;

display = isSafe ? `${fuelLapsRemaining.toFixed(1)} laps` : `${fuelLapsRemaining.toFixed(1)} ⚠️`;
```

### Caution Lap Consumption Anomaly
**Problem**: Caution lap shows lower consumption (drafting, yellow line, lower speed).
**Symptoms**: After a caution, fuel average drops (too conservative).
**Fix**: `isGreenFlagCondition` catches caution/yellow/red, sets `lapWasGreen = false`, lap is skipped. ✓

### Out-Lap Anomaly
**Problem**: Out-lap (first lap when entering car) has variable consumption (depends on entry point, fuel load).
**Symptoms**: First lap data is garbage.
**Fix**: Track `firstRecordedLap` on first fuel reading; skip lap if `lap === firstRecordedLap`. ✓

### Outlier Detection (IQR Method)
```typescript
function isLapConsumptionOutlier(consumed, history) {
  if (history.length < 2) return false;
  
  if (history.length >= 3) {
    // IQR method for 3+ samples
    const sorted = [...history].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 2.0 * iqr;
    const upperBound = q3 + 2.0 * iqr;
    return consumed < lowerBound || consumed > upperBound;
  } else {
    // Simple 30% threshold for 2 samples
    const avg = (history[0] + history[1]) / 2;
    return Math.abs(consumed - avg) > avg * 0.3;
  }
}
```

## Pedal Display & Inversion

### Throttle & Brake (Straightforward)
```typescript
// iRacing: 0 = pedal down, 1 = released
// Display: Show "how much pedal is applied"
// Logic: Use value as-is for height/intensity

const throttleHeight = height * throttle;  // 0 = no bar, 1 = full bar
const brakeHeight = height * brake;        // same
```

### Clutch (NEEDS INVERSION)
```typescript
// iRacing: 0 = pedal pressed, 1 = released (counter-intuitive!)
// Display: Show "how much clutch is being used"
// Logic: Invert the value

const clutchHeight = height * (1 - clutch);  // if clutch=0 (pressed), bar=height (full)
```

### Canvas Y-Axis (Flipped)
```typescript
// Canvas top = 0, bottom = height
// For visual: pressed pedal should show at bottom, released at top
// Logic: Flip Y

const barTop = height - pedal_height;  // pedal=0 → barTop=height (bottom of canvas)
```

## Session State Machine for Finished Detection

```typescript
let playerCheckeredLap = null;  // capture lap when Checkered seen

// On each poll
if (sessionState === 5 && playerCheckeredLap == null) {
  playerCheckeredLap = currentLap;  // mark it
}

// Check if finished
let isFinished = false;
if (sessionState >= 6) {
  isFinished = true;  // cool down or later
} else if (sessionState === 5) {
  if (playerCheckeredLap != null && currentLap > playerCheckeredLap) {
    isFinished = true;  // crossed checkered
  }
}
```

Alternative (bitfield check):
```typescript
const leaderFlags = t.CarIdxSessionFlags[leaderCarIdx];
const leaderFinished = (leaderFlags & 0x10) !== 0;  // bit 4
```

## Common Failures & Fixes

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| Fuel shows 99 laps remaining after pit | Pit refuel resets `FuelLevel`; history not cleared | Clear `fuelUsedHistory` on pit entry (watch for fuel gain) |
| Clutch bar is inverted | Forgot to flip iRacing pedal value | Use `height * (1 - clutch)` |
| TC showing phantom TC3 when only TC1+TC2 | Regex matched `dcTractionControlMode` | Use exact: `/^dcTractionControl\d+$/` |
| ABS shows "ABS 0" on Hypercars | Hypercars have `dcABS` but don't use driver adjustment | Suppress 0: `if (absLevel === 0) display = null` |
| Shift light flickering randomly | `ShiftIndicatorPct` is animated; threshold causes jitter | Lerp/interpolate; don't threshold |
| Fuel estimate conservatively low after caution | Caution lap has lower consumption | `lapWasGreen` filter catches it; lap skipped |
| Leader lap always 0 | Didn't find leader; `leaderIdx = -1` | Verify `CarIdxPosition.find(p => p === 1)` returns valid index |
| Session time stuck at 604800s | Unlimited session; value is marker | Check for `SessionTimeRemain === 604800.0` and skip |

## Debugging: Live Telemetry Dump

When troubleshooting on real iRacing session, add logging:
```typescript
console.log('Telemetry snapshot:',{
  rpm: val(t.RPM),
  sessionState: val(t.SessionState),
  sessionFlags: val(t.SessionFlags).toString(16),
  engineWarnings: val(t.EngineWarnings).toString(16),
  dcABS: val(t.dcABS),
  tcKeys: Object.keys(t).filter(k => /^dcTractionControl/.test(k)),
  tcValues: Object.keys(t)
    .filter(k => k === 'dcTractionControl' || /^dcTractionControl\d+$/.test(k))
    .map(k => [k, val(t[k])]),
  fuelLevel: val(t.FuelLevel),
  currentLap: val(t.Lap),
  lapDistPct: val(t.LapDistPct),
  sessionState: val(t.SessionState),
  PlayerCarPosition: val(t.PlayerCarPosition),
  carIdxPosition: val(t.CarIdxPosition),
});
```

Then check Electron DevTools console when running overlay.
