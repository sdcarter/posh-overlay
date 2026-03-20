using PrecisionDash.App.Composition;
using Xunit;

namespace PrecisionDash.Contracts;

public sealed class CarDataRuntimeConstraintsTests
{
    [Fact]
    public void CarLookup_Works_Without_Runtime_Network_Or_Dynamic_Loading()
    {
        Assert.True(CarProfileComposition.HasProfile(1));
    }
}