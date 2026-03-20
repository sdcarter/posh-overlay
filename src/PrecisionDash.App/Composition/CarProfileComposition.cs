using PrecisionDash.Generated;
using PrecisionDash.Domain.Telemetry;

namespace PrecisionDash.App.Composition;

public static class CarProfileComposition
{
    private static readonly float[] DefaultTriggers = [0.55f, 0.62f, 0.69f, 0.76f, 0.82f, 0.87f, 0.91f, 0.945f, 0.97f, 0.985f];
    private static readonly string[] DefaultColors = ["#22C55E", "#22C55E", "#84CC16", "#84CC16", "#EAB308", "#EAB308", "#F97316", "#F97316", "#EF4444", "#EF4444"];

    public static bool HasProfile(int driverCarId) => CarLookup.HasProfile(driverCarId);

    public static CarShiftProfile ResolveProfile(int driverCarId) => new(
        CarId: driverCarId,
        SegmentTriggers: DefaultTriggers,
        SegmentColors: DefaultColors);
}