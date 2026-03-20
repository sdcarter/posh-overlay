using PrecisionDash.Application.Ports;

namespace PrecisionDash.Domain.Ribbon;

public static class ControlDialMapper
{
    public static string? BrakeBias(TelemetrySnapshot snapshot) =>
        snapshot.BrakeBiasPercent.HasValue ? $"BB {snapshot.BrakeBiasPercent.Value:0.0}%" : null;

    public static string? TractionControl(TelemetrySnapshot snapshot) =>
        snapshot.TractionControlLevel.HasValue ? $"TC {snapshot.TractionControlLevel.Value}" : null;
}