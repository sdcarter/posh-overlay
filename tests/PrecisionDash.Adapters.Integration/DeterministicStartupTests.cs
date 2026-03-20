using PrecisionDash.App.Composition;
using Xunit;

namespace PrecisionDash.Adapters.Integration;

public sealed class DeterministicStartupTests
{
    [Fact]
    public void ProviderFactory_Creates_Mock_Provider_Without_Live_Process()
    {
        var provider = TelemetryProviderFactory.Create(useMock: true);
        Assert.NotNull(provider);
    }
}