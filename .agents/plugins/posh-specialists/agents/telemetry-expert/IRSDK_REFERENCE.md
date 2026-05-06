# iRacing SDK Reference (irsdk_1_19)

Source: ~/Downloads/irsdk_1_19.zip — official C API for iRacing telemetry
This is the ground truth for variable types, structures, and behavior.

## Shared Memory Layout

### File Header (`irsdk_header`)
```c
int ver;                  // API version (2)
int status;               // bitfield: irsdk_StatusField (0x01 = connected)
int tickRate;             // 60 Hz typically
int sessionInfoUpdate;    // increments when YAML changes
int sessionInfoLen;       // byte length of YAML
int sessionInfoOffset;    // pointer to YAML string
int numVars;              // count of telemetry variables (100–200+)
int varHeaderOffset;      // pointer to irsdk_varHeader[numVars]
int numBuf;               // 3 or 4 buffers (triple-buffered)
int bufLen;               // bytes per buffer row
int pad1[2];              // alignment
irsdk_varBuf varBuf[4];   // array of buffer metadata
```

### Variable Descriptor (`irsdk_varHeader`)
```c
int type;           // irsdk_VarType (see types section)
int offset;         // byte offset within a data row
int count;          // array size (1 for scalar, 64 for CarIdx*)
bool countAsTime;   // if true, display as time MM:SS.sss
char name[32];      // e.g., "RPM", "dcTractionControl"
char desc[64];      // "Engine speed", "Traction control setting"
char unit[32];      // "rpm", "n/a", "m/s", etc.
```

### Data Row (`varBuf`)
Each row is `bufLen` bytes of packed binary data. Variable offsets and sizes are in `varHeader`. Example:
```
offset 0, 4 bytes (float): RPM value
offset 4, 4 bytes (float): Speed value
offset 8, 1 byte (bool): IsOnTrack
...
```

## Variable Types (Memory Layout)

```c
enum irsdk_VarType {
  irsdk_char = 0,      // 1 byte, -128..127
  irsdk_bool = 1,      // 1 byte, 0 or 1
  irsdk_int = 2,       // 4 bytes, signed
  irsdk_bitField = 3,  // 4 bytes, interpreted as bit flags
  irsdk_float = 4,     // 4 bytes, IEEE 754
  irsdk_double = 5,    // 8 bytes, IEEE 754
};
```

**Key Point**: All session flags, engine warnings, pit flags, etc. are `irsdk_bitField` (4-byte bitsets). Interpret with bitwise AND.

## Session States (irsdk_SessionState, int)

```c
irsdk_StateInvalid = 0       // not in session
irsdk_StateGetInCar = 1      // loading car
irsdk_StateWarmup = 2        // warmup lap
irsdk_StateParadeLaps = 3    // parade laps (oval only)
irsdk_StateRacing = 4        // actively racing
irsdk_StateCheckered = 5     // checkered flag crossed
irsdk_StateCoolDown = 6      // cool down period
```

**Logic**: When `SessionState === 5` and current lap > first checkered lap, player is finished.

## Track Location (irsdk_TrkLoc, int)

```c
irsdk_NotInWorld = -1        // loading/not loaded
irsdk_OffTrack = 0           // grass, gravel, etc.
irsdk_InPitStall = 1         // stopped in pits
irsdk_AproachingPits = 2     // pit road entry/road (speed limit enforced)
irsdk_OnTrack = 3            // racing surface
```

## Global Flags (irsdk_Flags, bitfield / 32-bit uint)

```c
// Race flags
irsdk_checkered = 0x00000001         // finish
irsdk_white = 0x00000002             // 1 lap left
irsdk_green = 0x00000004             // green flag
irsdk_yellow = 0x00000008            // yellow (incident ahead)
irsdk_red = 0x00000010               // red (stop racing)
irsdk_blue = 0x00000020              // blue (faster car approaching)
irsdk_debris = 0x00000040            // debris
irsdk_crossed = 0x00000080           // crossed finish line
irsdk_yellowWaving = 0x00000100      // yellow waving (incident in sector)
irsdk_oneLapToGreen = 0x00000200     // restart coming
irsdk_greenHeld = 0x00000400         // green held
irsdk_tenToGo = 0x00000800           // 10 laps to go
irsdk_fiveToGo = 0x00001000          // 5 laps to go
irsdk_randomWaving = 0x00002000      // waving random
irsdk_caution = 0x00004000           // caution (full-course yellow)
irsdk_cautionWaving = 0x00008000     // caution waving (same session)

// Driver-specific flags
irsdk_black = 0x00010000             // disqualified
irsdk_disqualify = 0x00020000        // ★ also means disqualified
irsdk_servicible = 0x00040000        // allowed service (not a race flag)
irsdk_furled = 0x00080000            // flag furled
irsdk_repair = 0x00100000            // mandatory repair needed
irsdk_dqScoringInvalid = 0x00200000  // DQ and scoring disabled

// Start lights (mutually exclusive)
irsdk_startHidden = 0x10000000       // lights hidden
irsdk_startReady = 0x20000000        // red lights on
irsdk_startSet = 0x40000000          // waiting for green
irsdk_startGo = 0x80000000           // lights out
```

**"Green Flag" Condition** (used in PoshDash fuel averaging):
```c
bool isGreenFlag = !(flags & (irsdk_yellow | irsdk_caution | irsdk_red | irsdk_cautionWaving));
```

## Engine Warnings (irsdk_EngineWarnings, bitfield)

```c
irsdk_waterTempWarning = 0x0001       // overheat
irsdk_fuelPressureWarning = 0x0002    // fuel pressure low
irsdk_oilPressureWarning = 0x0004     // oil pressure low
irsdk_engineStalled = 0x0008          // engine off
irsdk_pitSpeedLimiter = 0x0010        // pit limiter ACTIVE ← bit 4
irsdk_revLimiterActive = 0x0020       // rev limiter engaged
irsdk_oilTempWarning = 0x0040         // oil temp high
irsdk_mandRepNeeded = 0x0080          // mandatory repairs needed
irsdk_optRepNeeded = 0x0100           // optional repairs available
```

**Pit Limiter Check**:
```c
bool pitLimiterActive = (engineWarnings & irsdk_pitSpeedLimiter) !== 0;
```

## Pit Service Flags (irsdk_PitSvFlags, bitfield)

```c
irsdk_LFTireChange = 0x0001           // left front
irsdk_RFTireChange = 0x0002           // right front
irsdk_LRTireChange = 0x0004           // left rear
irsdk_RRTireChange = 0x0008           // right rear
irsdk_FuelFill = 0x0010               // add fuel
irsdk_WindshieldTearoff = 0x0020      // clean windshield
irsdk_FastRepair = 0x0040             // repair
```

## Incident Flags (irsdk_IncidentFlags, bitfield)

```c
// First byte: incident type (mutually exclusive)
irsdk_Incident_RepNoReport = 0x0000
irsdk_Incident_RepOutOfControl = 0x0001        // Loss of Control (2x)
irsdk_Incident_RepOffTrack = 0x0002            // Off Track (1x)
irsdk_Incident_RepContactWithWorld = 0x0004    // Contact (0x)
irsdk_Incident_RepCollisionWithWorld = 0x0005  // Contact (2x)
irsdk_Incident_RepContactWithCar = 0x0007      // Car Contact (0x)
irsdk_Incident_RepCollisionWithCar = 0x0008    // Car Contact (4x)

// Second byte: penalty (mutually exclusive)
irsdk_Incident_PenNoReport = 0x0000
irsdk_Incident_PenZeroX = 0x0100
irsdk_Incident_PenOneX = 0x0200
irsdk_Incident_PenTwoX = 0x0300
irsdk_Incident_PenFourX = 0x0400

// Masks for extraction
IRSDK_INCIDENT_REP_MASK = 0x000000FF
IRSDK_INCIDENT_PEN_MASK = 0x0000FF00
```

## Track Surfaces (irsdk_TrkSurf, int)

```c
irsdk_SurfaceNotInWorld = -1
irsdk_UndefinedMaterial = 0
irsdk_Asphalt[1-4]
irsdk_Concrete[1-2]
irsdk_RacingDirt[1-2]
irsdk_Paint[1-2]
irsdk_Rumble[1-4]
irsdk_Grass[1-4]
irsdk_Dirt[1-4]
irsdk_Sand
irsdk_Gravel[1-2]
irsdk_Grascrete
irsdk_Astroturf
```

## Track Wetness (irsdk_TrackWetness, int)

```c
irsdk_TrackWetness_UNKNOWN = 0
irsdk_TrackWetness_Dry = 1
irsdk_TrackWetness_MostlyDry = 2
irsdk_TrackWetness_VeryLightlyWet = 3
irsdk_TrackWetness_LightlyWet = 4
irsdk_TrackWetness_ModeratelyWet = 5
irsdk_TrackWetness_VeryWet = 6
irsdk_TrackWetness_ExtremelyWet = 7
```

## Pit Service Status (irsdk_PitSvStatus, int)

```c
// Status codes
irsdk_PitSvNone = 0
irsdk_PitSvInProgress = 1
irsdk_PitSvComplete = 2

// Error codes (100+)
irsdk_PitSvTooFarLeft = 100
irsdk_PitSvTooFarRight = 101
irsdk_PitSvTooFarForward = 102
irsdk_PitSvTooFarBack = 103
irsdk_PitSvBadAngle = 104
irsdk_PitSvCantFixThat = 105
```

## Camera State (irsdk_CameraState, bitfield)

```c
irsdk_IsSessionScreen = 0x0001            // must be in session for camera
irsdk_IsScenicActive = 0x0002             // no specific car focus
irsdk_CamToolActive = 0x0004              // camera tool enabled (user-adjustable)
irsdk_UIHidden = 0x0008                   // UI hidden (user-adjustable)
irsdk_UseAutoShotSelection = 0x0010       // (user-adjustable)
irsdk_UseTemporaryEdits = 0x0020          // (user-adjustable)
irsdk_UseKeyAcceleration = 0x0040         // (user-adjustable)
irsdk_UseKey10xAcceleration = 0x0080      // (user-adjustable)
irsdk_UseMouseAimMode = 0x0100            // (user-adjustable)
```

## Unlimited Session Markers

```c
irsdk_UNLIMITED_LAPS = 32767              // SessionLapsRemain, SessionLapsTotal
irsdk_UNLIMITED_TIME = 604800.0f          // SessionTimeRemain (10 days in seconds)
```

When you see these values, skip calculations on lap counts / time limits; treat as "no limit."

## Multi-Car Arrays

Many variables are arrays indexed by car:
- `CarIdxPosition[64]`: Position of each car (1 = leader, 2 = second, ..., 0 = off-track)
- `CarIdxLap[64]`: Current lap of each car
- `CarIdxLapDistPct[64]`: Lap progress (0.0–1.0)
- `CarIdxSessionFlags[64]`: Session flags for each car (bit 0x10 = finished)

**Player Car Index**: Always read `PlayerCarIdx` first; it's your index into these arrays.

## Timing

```c
struct irsdk_header {
  int tickRate;  // typically 60 Hz (60 updates per second)
};
// Each update is 1 / 60 ≈ 16.67 ms
```

**Poll Interval**: irsdk-node typically calls `waitForData(0)` every 8ms; some data will be shared across multiple polls.

## Variable Name Patterns (from irsdk-node types)

**Common Prefixes**:
- `PlayerCar*`: Your car's data
- `CarIdx*`: Multi-car arrays (indexed by car index 0–63)
- `dc*`: Driver control / adjustable settings (ABS, TC, BrakeBias, etc.)
- `Engine*`: Engine state
- `Session*`: Session-level data

**Traction Control Specifics**:
- `dcTractionControl`: Base TC (no suffix) = TC Slip / primary channel (= TC1 in display)
- `dcTractionControl2`: Secondary TC (= TC2)
- `dcTractionControlMode`: **Not a channel value** — mode of TC
- `dcTractionControlTarget`: **Not a channel value** — target
- Filter: Match only `/^dcTractionControl\d*$/` or exact `'dcTractionControl'`

## Data Flow (Triple Buffering)

iRacing writes to buffers in round-robin fashion:
1. Sim writes frame A to `varBuf[0]`, increments `varBuf[0].tickCount`
2. Sim writes frame B to `varBuf[1]`, increments `varBuf[1].tickCount`
3. Sim writes frame C to `varBuf[2]`, increments `varBuf[2].tickCount`
4. Sim writes frame D to `varBuf[0]`, increments `varBuf[0].tickCount` again
5. Client reads highest `tickCount` to get latest frame

**irsdk-node Abstraction**: You don't manage buffers; `waitForData()` and `getTelemetry()` handle it.

## YAML Session Info

`getSessionData()` returns parsed YAML with keys like:
```
DriverInfo:
  DriverCarIdx: 0            # your car index
  Drivers:
    - CarIdx: 0
      CarPath: "bmw_m_gt3"   # used to identify car for special handling
      ...
WeekendInfo:
  TrackName: "Spa-Francorchamps"
  ...
SessionInfo:
  Sessions:
    - SessionType: "Race"
      SessionLaps: 5
      ...
```

---

## Debugging Checklist

When telemetry appears wrong:

- [ ] Verify `SessionState`: Are you in racing (4) or checkered (5)?
- [ ] Check `SessionFlags`: Is green flag set? Any yellow/caution?
- [ ] Confirm `PlayerCarIdx` and array indexing with `CarIdx*` variables
- [ ] For TC issues: Grep for keys matching `/^dcTractionControl\d+$/` — dump actual keys from `getTelemetry()`
- [ ] For ABS: Check if `dcABS` is 0 (car doesn't use) vs. legitimate setting
- [ ] For fuel: Verify `FuelLevel` units (liters vs. gallons) and compare to `FuelLevelPct`
- [ ] For lap counting: Confirm `Lap` increments at S/F, `LapDistPct` goes 0→1
- [ ] Check `SessionTimeRemain` for 32767 (unlimited marker)
- [ ] Verify shift points: `PlayerCarSLShiftRPM`, fallback to `PlayerCarSLBlinkRPM`, then `PlayerCarSLLastRPM`
