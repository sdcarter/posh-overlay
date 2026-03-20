namespace PrecisionDash.Domain.Telemetry;

public readonly record struct CarShiftProfile(int CarId, float[] SegmentTriggers, string[] SegmentColors);