using PrecisionDash.Generated;

namespace PrecisionDash.App.Composition;

public static class CarProfileComposition
{
    public static bool HasProfile(int driverCarId) => CarLookup.HasProfile(driverCarId);
}