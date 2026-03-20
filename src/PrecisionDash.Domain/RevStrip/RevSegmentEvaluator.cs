using PrecisionDash.Domain.Telemetry;

namespace PrecisionDash.Domain.RevStrip;

public static class RevSegmentEvaluator
{
    public static int EvaluateActiveSegments(TelemetrySnapshot snapshot, CarShiftProfile profile)
    {
        if (profile.SegmentTriggers.Length == 0 || snapshot.MaxRpm <= 0f)
        {
            return 0;
        }

        var ratio = snapshot.Rpm / snapshot.MaxRpm;
        var activeSegments = 0;

        for (var i = 0; i < profile.SegmentTriggers.Length; i++)
        {
            if (ratio >= profile.SegmentTriggers[i])
            {
                activeSegments = i + 1;
            }
        }

        return activeSegments;
    }
}