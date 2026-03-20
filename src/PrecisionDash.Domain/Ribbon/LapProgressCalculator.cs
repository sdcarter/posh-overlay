using PrecisionDash.Domain.Telemetry;

namespace PrecisionDash.Domain.Ribbon;

public static class LapProgressCalculator
{
    public static string Calculate(TelemetrySnapshot snapshot)
    {
        if (snapshot.SessionLapsTotal.HasValue && snapshot.SessionLapsRemain.HasValue)
        {
            var completed = snapshot.SessionLapsTotal.Value - snapshot.SessionLapsRemain.Value;
            return $"Laps {completed:0.#}/{snapshot.SessionLapsTotal.Value:0.#}";
        }

        if (snapshot.SessionTimeRemainSeconds.HasValue &&
            snapshot.SessionLastLapTimeSeconds.HasValue &&
            snapshot.SessionLastLapTimeSeconds.Value > 0)
        {
            var estRemain = snapshot.SessionTimeRemainSeconds.Value / snapshot.SessionLastLapTimeSeconds.Value;
            return $"Est laps left {estRemain:0.#}";
        }

        return "Laps -/-";
    }
}