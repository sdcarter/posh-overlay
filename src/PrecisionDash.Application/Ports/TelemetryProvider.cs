using System.Threading;
using System.Threading.Tasks;

namespace PrecisionDash.Application.Ports;

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

public interface ITelemetryProvider
{
    ValueTask StartAsync(CancellationToken cancellationToken);
    ValueTask StopAsync(CancellationToken cancellationToken);
    bool TryReadSnapshot(out TelemetrySnapshot snapshot);
}