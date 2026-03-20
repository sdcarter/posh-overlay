namespace PrecisionDash.Domain.TelemetryMath;

public sealed class TelemetryState
{
    private float _rpm;
    private float _maxRpm;
    private bool _pitLimiter;

    public float Rpm
    {
        get => _rpm;
        set => _rpm = value;
    }

    public float MaxRpm
    {
        get => _maxRpm;
        set => _maxRpm = value;
    }

    public bool PitLimiter
    {
        get => _pitLimiter;
        set => _pitLimiter = value;
    }
}