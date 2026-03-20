using PrecisionDash.Adapters.Telemetry.iRacing;
using Xunit;

namespace PrecisionDash.Contracts;

public sealed class GeneratedTelemetryStructContractTests
{
    [Fact]
    public void GeneratedTelemetryBindings_Has_Expected_Fields()
    {
        var bindings = new GeneratedTelemetryBindings(1000f, 9000f, false);
        Assert.Equal(1000f, bindings.EngineRpm);
        Assert.Equal(9000f, bindings.EngineMaxRpm);
        Assert.False(bindings.PitLimiter);
    }
}