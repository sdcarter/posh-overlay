using SVappsLAB.iRacingTelemetrySDK;

namespace PrecisionDash.Adapters.Telemetry.iRacing;

public readonly record struct GeneratedTelemetryBindings(
    float EngineRpm,
    float EngineMaxRpm,
    bool PitLimiter
);

[RequiredTelemetryVars([
    TelemetryVar.RPM,
    TelemetryVar.PlayerCarSLShiftRPM,
    TelemetryVar.PlayerCarSLBlinkRPM,
    TelemetryVar.PlayerCarSLLastRPM,
    TelemetryVar.SessionLapsRemain,
    TelemetryVar.SessionLapsTotal,
    TelemetryVar.SessionTimeRemain,
    TelemetryVar.LapLastLapTime,
    TelemetryVar.PlayerIncidents,
    TelemetryVar.dcBrakeBias,
    TelemetryVar.dcTractionControl
])]
internal sealed class GeneratedTelemetryBindingMarker;