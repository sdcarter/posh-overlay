using System.IO;
using System.Text.Json;
using PrecisionDash.Domain.Telemetry;

namespace PrecisionDash.Adapters.Telemetry.Mock;

public static class MockScenarioLoader
{
    public static TelemetrySnapshot LoadSingle(string path)
    {
        var text = File.ReadAllText(path);
        var snapshot = JsonSerializer.Deserialize(text, MockTelemetryJsonContext.Default.TelemetrySnapshot);
        return snapshot;
    }
}