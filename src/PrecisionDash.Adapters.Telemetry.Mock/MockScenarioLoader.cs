using System.IO;
using System.Text.Json;
using PrecisionDash.Application.Ports;

namespace PrecisionDash.Adapters.Telemetry.Mock;

public static class MockScenarioLoader
{
    public static TelemetrySnapshot LoadSingle(string path)
    {
        var text = File.ReadAllText(path);
        var snapshot = JsonSerializer.Deserialize<TelemetrySnapshot>(text);
        return snapshot;
    }
}