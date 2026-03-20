namespace PrecisionDash.Adapters.Telemetry.iRacing;

public readonly record struct GeneratedTelemetryBindings(
    float EngineRpm,
    float EngineMaxRpm,
    bool PitLimiter
);