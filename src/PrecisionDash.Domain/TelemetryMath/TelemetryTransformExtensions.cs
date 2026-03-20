namespace PrecisionDash.Domain.TelemetryMath;

public static class TelemetryTransformExtensions
{
    public static float NormalizedRpm(this TelemetryState state)
    {
        if (state.MaxRpm <= 0f)
        {
            return 0f;
        }

        return state.Rpm / state.MaxRpm;
    }
}