using PrecisionDash.App.Composition;
using Xunit;

namespace PrecisionDash.Adapters.Integration;

public sealed class TelemetryLifecycleLoggingTests
{
    [Fact]
    public void LoggingConfig_Records_Attach_Detach_Reconnect_And_Health()
    {
        var config = new LoggingConfig();
        config.LogAttach();
        config.LogProviderHealth("ok");
        config.LogReconnect();
        config.LogDetach();

        Assert.Contains("attach", config.Events);
        Assert.Contains("provider-health:ok", config.Events);
        Assert.Contains("reconnect", config.Events);
        Assert.Contains("detach", config.Events);
    }
}