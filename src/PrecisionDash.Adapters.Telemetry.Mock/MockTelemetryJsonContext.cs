using System.Text.Json.Serialization;
using PrecisionDash.Domain.Telemetry;

namespace PrecisionDash.Adapters.Telemetry.Mock;

[JsonSerializable(typeof(TelemetrySnapshot))]
internal partial class MockTelemetryJsonContext : JsonSerializerContext
{
}