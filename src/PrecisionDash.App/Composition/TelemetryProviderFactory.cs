using PrecisionDash.Adapters.Telemetry.Mock;
using PrecisionDash.Adapters.Telemetry.iRacing;
using PrecisionDash.Application.Ports;
using System;

namespace PrecisionDash.App.Composition;

public static class TelemetryProviderFactory
{
    public static ITelemetryProvider CreateFromEnvironment()
    {
        var value = Environment.GetEnvironmentVariable("PRECISIONDASH_USE_MOCK");
        var useMock = string.Equals(value, "1", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(value, "true", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(value, "yes", StringComparison.OrdinalIgnoreCase);

        return Create(useMock);
    }

    public static ITelemetryProvider Create(bool useMock)
    {
        return useMock ? new MockTelemetryProvider() : new iRacingSdkTelemetryProvider();
    }
}