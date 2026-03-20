namespace PrecisionDash.Domain.RevStrip;

public enum FlashMode
{
    None,
    PitLimiter,
    ShiftPoint
}

public readonly record struct RevStripState(int ActiveSegments, string[] SegmentColors, FlashMode FlashMode);