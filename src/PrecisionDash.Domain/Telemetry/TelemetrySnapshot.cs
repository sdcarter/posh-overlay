namespace PrecisionDash.Domain.Telemetry;

public readonly record struct TelemetrySnapshot(
    long TimestampTicks,
    int DriverCarId,
    float Rpm,
    float MaxRpm,
    bool PitLimiterActive,
    float? SessionLapsRemain,
    float? SessionLapsTotal,
    float? SessionTimeRemainSeconds,
    float? SessionLastLapTimeSeconds,
    int IncidentCount,
    int? IncidentLimit,
    float? BrakeBiasPercent,
    int? TractionControlLevel
);