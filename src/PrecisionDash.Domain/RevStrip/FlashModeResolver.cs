using PrecisionDash.Application.Ports;

namespace PrecisionDash.Domain.RevStrip;

public static class FlashModeResolver
{
    public static FlashMode Resolve(TelemetrySnapshot snapshot)
    {
        if (snapshot.PitLimiterActive)
        {
            return FlashMode.PitLimiter;
        }

        var ratio = snapshot.MaxRpm > 0f ? snapshot.Rpm / snapshot.MaxRpm : 0f;
        return ratio >= 0.95f ? FlashMode.ShiftPoint : FlashMode.None;
    }
}