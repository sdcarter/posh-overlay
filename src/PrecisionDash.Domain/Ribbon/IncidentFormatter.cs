using PrecisionDash.Application.Ports;

namespace PrecisionDash.Domain.Ribbon;

public static class IncidentFormatter
{
    public static string Format(TelemetrySnapshot snapshot)
    {
        if (snapshot.IncidentLimit.HasValue)
        {
            return $"Inc {snapshot.IncidentCount}/{snapshot.IncidentLimit.Value}";
        }

        return $"Inc {snapshot.IncidentCount}/-";
    }
}