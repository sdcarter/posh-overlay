namespace PrecisionDash.Application.Ports;

public readonly record struct CarShiftProfile(int CarId, float[] SegmentTriggers, string[] SegmentColors);

public interface ICarProfileProvider
{
    bool TryGetProfile(int driverCarId, out CarShiftProfile profile);
}