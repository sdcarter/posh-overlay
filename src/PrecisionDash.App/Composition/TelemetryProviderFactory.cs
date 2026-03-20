using PrecisionDash.Adapters.Telemetry.Mock;
using PrecisionDash.Adapters.Telemetry.iRacing;
using PrecisionDash.Application.Ports;

namespace PrecisionDash.App.Composition;

public static class TelemetryProviderFactory
{
    public static ITelemetryProvider Create(bool useMock)
    {
        return useMock ? new MockTelemetryProvider() : new iRacingSdkTelemetryProvider();
    }
}